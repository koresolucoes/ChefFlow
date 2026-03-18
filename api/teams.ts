import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ message: 'Configuração do Supabase ausente' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verifica o Token do Supabase Auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    // LISTAR EQUIPES (PRAÇAS)
    if (req.method === 'GET') {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) throw error;
      return res.status(200).json(teams || []);
    }

    // Apenas admin e chef podem criar/deletar equipes
    const { data: currentUser } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'chef') {
       return res.status(403).json({ message: 'Acesso negado' });
    }

    // CRIAR EQUIPE
    if (req.method === 'POST') {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Nome da equipe é obrigatório' });
      }

      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({ name, description })
        .select('*')
        .single();
        
      if (error) {
        if (error.code === '23505') { // Unique violation
          return res.status(400).json({ message: 'Já existe uma equipe com este nome' });
        }
        throw error;
      }
      
      return res.status(201).json(newTeam);
    }

    // DELETAR EQUIPE
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) return res.status(400).json({ message: 'ID da equipe é obrigatório' });

      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
      
      return res.status(200).json({ message: 'Equipe removida com sucesso' });
    }

    return res.status(405).json({ message: 'Método não permitido' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
}
