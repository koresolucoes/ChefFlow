import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
  }

  try {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_ANON_KEY'] || process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Busca o usuário pelo e-mail
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) {
      console.error('Erro no Supabase:', error);
      throw error;
    }

    const user = users?.[0];

    if (!user) {
      console.log(`[Login] Usuário não encontrado para o email: ${email}`);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verifica a senha com bcrypt
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      console.log(`[Login] Senha inválida para o email: ${email}`);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gera o Token JWT
    const jwtSecret = process.env['JWT_SECRET'] || 'fallback_secret_key_change_me';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '8h' }
    );

    // Retorna os dados do usuário e o token
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno no servidor' });
  }
}
