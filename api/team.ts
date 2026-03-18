import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper para verificar JWT
function verifyToken(req: VercelRequest): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const token = authHeader.split(' ')[1];
  const secret = process.env['JWT_SECRET'] || 'fallback_secret_key_change_me';
  return jwt.verify(token, secret);
}

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
    const userPayload = verifyToken(req);
    // Apenas admins e chefs podem gerenciar a equipe
    if (userPayload['role'] !== 'admin' && userPayload['role'] !== 'chef') {
       return res.status(403).json({ message: 'Acesso negado' });
    }

    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_ANON_KEY'] || process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // LISTAR USUÁRIOS
    if (req.method === 'GET') {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return res.status(200).json(users);
    }

    // CRIAR USUÁRIO
    if (req.method === 'POST') {
      const { name, email, password, role } = req.body;
      
      // Verifica se o email já existe
      const { data: existing, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email);
        
      if (fetchError) throw fetchError;
      
      if (existing && existing.length > 0) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }

      const hash = await bcrypt.hash(password, 10);
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ name, email, password_hash: hash, role })
        .select('id, name, email, role, created_at');
        
      if (insertError) throw insertError;
      return res.status(201).json(newUser?.[0]);
    }

    // DELETAR USUÁRIO
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      // Não permite deletar a si mesmo
      if (id === userPayload['id']) {
        return res.status(400).json({ message: 'Não é possível deletar seu próprio usuário' });
      }

      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      
      return res.status(200).json({ message: 'Usuário removido com sucesso' });
    }

    return res.status(405).json({ message: 'Método não permitido' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(401).json({ message: 'Não autorizado ou erro no servidor' });
  }
}
