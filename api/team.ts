import { neon } from '@neondatabase/serverless';
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
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me';
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
    if (userPayload.role !== 'admin' && userPayload.role !== 'chef') {
       return res.status(403).json({ message: 'Acesso negado' });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'DATABASE_URL não configurada' });
    }

    const sql = neon(process.env.DATABASE_URL);

    // LISTAR USUÁRIOS
    if (req.method === 'GET') {
      const users = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`;
      return res.status(200).json(users);
    }

    // CRIAR USUÁRIO
    if (req.method === 'POST') {
      const { name, email, password, role } = req.body;
      
      // Verifica se o email já existe
      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }

      const hash = await bcrypt.hash(password, 10);
      const newUser = await sql`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (${name}, ${email}, ${hash}, ${role})
        RETURNING id, name, email, role, created_at
      `;
      return res.status(201).json(newUser[0]);
    }

    // DELETAR USUÁRIO
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      // Não permite deletar a si mesmo
      if (id === userPayload.id) {
        return res.status(400).json({ message: 'Não é possível deletar seu próprio usuário' });
      }

      await sql`DELETE FROM users WHERE id = ${id}`;
      return res.status(200).json({ message: 'Usuário removido com sucesso' });
    }

    return res.status(405).json({ message: 'Método não permitido' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(401).json({ message: 'Não autorizado ou erro no servidor' });
  }
}
