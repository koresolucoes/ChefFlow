import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
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
    return res.status(405).json({ message: 'Method Not Allowed. Use POST.' });
  }

  try {
    if (!process.env['DATABASE_URL']) {
      return res.status(500).json({ error: 'DATABASE_URL não configurada no ambiente.' });
    }

    const sql = neon(process.env['DATABASE_URL']);

    // 1. Cria a tabela de usuários se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'cook',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Verifica se o admin padrão já existe
    const existingAdmin = await sql`SELECT * FROM users WHERE email = 'admin@chefflow.com'`;
    
    if (existingAdmin.length === 0) {
      // Cria o hash da senha 'admin123'
      const hash = await bcrypt.hash('admin123', 10);
      
      // Insere o usuário admin
      await sql`
        INSERT INTO users (name, email, password_hash, role)
        VALUES ('Chef Admin', 'admin@chefflow.com', ${hash}, 'admin')
      `;
      
      return res.status(200).json({ 
        message: 'Banco de dados configurado com sucesso!',
        admin_created: true,
        credentials: {
          email: 'admin@chefflow.com',
          password: 'admin123'
        }
      });
    }

    return res.status(200).json({ 
      message: 'A tabela users já existe e o admin já foi criado anteriormente.',
      admin_created: false
    });
  } catch (error) {
    console.error('Erro no setup do banco:', error);
    return res.status(500).json({ error: 'Falha ao configurar o banco de dados', details: String(error) });
  }
}
