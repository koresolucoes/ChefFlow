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
    // Para gerenciar usuários no Auth, PRECISAMOS da service_role key
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas no ambiente.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verifica se o admin já existe no Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      return res.status(500).json({ error: 'Erro ao conectar com Supabase Auth', details: authError.message });
    }

    const adminExists = authUsers.users.some(u => u.email === 'admin@chefflow.com');

    if (!adminExists) {
      // 1. Cria o usuário no Supabase Auth
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@chefflow.com',
        password: 'admin123',
        email_confirm: true
      });

      if (createError) {
        return res.status(500).json({ error: 'Erro ao criar admin no Auth', details: createError.message });
      }

      // 2. Cria o perfil na tabela public.users
      if (newAuthUser.user) {
        await supabase.from('users').upsert({
          id: newAuthUser.user.id, // Usa o mesmo ID do Auth
          name: 'Chef Admin',
          email: 'admin@chefflow.com',
          role: 'admin'
        });
      }

      return res.status(200).json({ 
        message: 'Admin criado com sucesso no Supabase Auth! Use admin@chefflow.com e admin123',
        admin_created: true
      });
    }

    return res.status(200).json({ 
      message: 'Banco de dados Supabase configurado e Admin já existe no Auth!',
      admin_created: false
    });
  } catch (error) {
    console.error('Erro no setup do banco:', error);
    return res.status(500).json({ error: 'Falha ao verificar o banco de dados', details: String(error) });
  }
}
