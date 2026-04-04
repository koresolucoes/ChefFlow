import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']; // OBRIGATÓRIO para gerenciar Auth

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ message: 'Configuração do Supabase ausente (SERVICE_ROLE_KEY)' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verifica o Token do Supabase Auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    // 2. Verifica se o usuário tem permissão (admin ou chef) para modificações
    const { data: currentUser } = await supabase.from('users').select('role, tenant_id, team_id').eq('id', user.id).single();
    if (!currentUser) {
       return res.status(403).json({ message: 'Acesso negado' });
    }

    // LISTAR USUÁRIOS
    if (req.method === 'GET') {
      let query = supabase
        .from('users')
        .select(`
          id, name, email, role, created_at, team_id, tenant_id,
          teams:team_id (id, name)
        `)
        .eq('tenant_id', currentUser.tenant_id)
        .order('created_at', { ascending: false });

      if (currentUser.role !== 'admin') {
        if (currentUser.team_id) {
          query = query.eq('team_id', currentUser.team_id);
        } else {
          query = query.eq('id', user.id); // Only see themselves if no team
        }
      } else {
        const { team_id } = req.query;
        if (team_id && team_id !== 'todas') {
          query = query.eq('team_id', team_id);
        }
      }

      const { data: users, error } = await query;
        
      if (error) throw error;
      return res.status(200).json(users);
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'chef') {
       return res.status(403).json({ message: 'Acesso negado' });
    }

    // CRIAR USUÁRIO
    if (req.method === 'POST') {
      const { name, email, password, role, team_id } = req.body;
      
      // 1. Cria o usuário no Supabase Auth
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      
      if (createError) {
        return res.status(400).json({ message: createError.message });
      }

      if (!newAuthUser.user) {
        return res.status(500).json({ message: 'Falha ao criar usuário no Auth' });
      }

      // 2. Cria o perfil na tabela public.users
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .upsert({ 
          id: newAuthUser.user.id, // Vincula o ID do Auth ao ID da tabela
          name, 
          email, 
          role,
          team_id: team_id || null,
          tenant_id: currentUser.tenant_id
        })
        .select(`
          id, name, email, role, created_at, team_id, tenant_id,
          teams:team_id (id, name)
        `);
        
      if (insertError) {
        // Se falhar no banco, apaga no Auth para não ficar sujo
        await supabase.auth.admin.deleteUser(newAuthUser.user.id);
        throw insertError;
      }
      
      return res.status(201).json(newUser?.[0]);
    }

    // ATUALIZAR USUÁRIO
    if (req.method === 'PUT') {
      const { id, name, email, password, role, team_id } = req.body;

      if (!id) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório' });
      }

      // Atualiza no Auth se tiver email ou senha
      if (email || password) {
        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(id, updateData);
        if (authUpdateError) {
          return res.status(400).json({ message: authUpdateError.message });
        }
      }

      // Atualiza na tabela users
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name,
          email,
          role,
          team_id: team_id || null
        })
        .eq('id', id)
        .select(`
          id, name, email, role, created_at, team_id, tenant_id,
          teams:team_id (id, name)
        `)
        .single();

      if (updateError) throw updateError;

      return res.status(200).json(updatedUser);
    }

    // DELETAR USUÁRIO
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      // Não permite deletar a si mesmo
      if (id === user.id) {
        return res.status(400).json({ message: 'Não é possível deletar seu próprio usuário' });
      }

      // Deletar no Auth vai deletar na tabela users automaticamente por causa do ON DELETE CASCADE
      const { error } = await supabase.auth.admin.deleteUser(id as string);
      if (error) throw error;
      
      return res.status(200).json({ message: 'Usuário removido com sucesso' });
    }

    return res.status(405).json({ message: 'Método não permitido' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
}
