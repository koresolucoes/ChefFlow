import { createClient } from '@supabase/supabase-js';
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

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed. Use GET or POST.' });
  }

  try {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_ANON_KEY'] || process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas no ambiente.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Se o usuário passar ?fix=true na URL, vamos corrigir as senhas em texto puro
    if (req.query.fix === 'true') {
      const { data: allUsers, error: fetchError } = await supabase.from('users').select('*');
      
      if (fetchError) {
        return res.status(500).json({ error: 'Erro ao buscar usuários', details: fetchError.message });
      }

      let fixedCount = 0;
      for (const user of allUsers || []) {
        // Se a senha não começar com $2a$ ou $2b$ (padrão do bcrypt), significa que está em texto puro
        if (!user.password_hash.startsWith('$2a$') && !user.password_hash.startsWith('$2b$')) {
          const newHash = await bcrypt.hash(user.password_hash, 10);
          await supabase.from('users').update({ password_hash: newHash }).eq('id', user.id);
          fixedCount++;
        }
      }

      return res.status(200).json({ 
        message: `Senhas corrigidas com sucesso! ${fixedCount} usuário(s) atualizado(s) para usar criptografia bcrypt.`,
        fixed_count: fixedCount
      });
    }

    // Verifica se o admin padrão já existe
    const { data: existingAdmin, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@chefflow.com');
      
    if (error) {
      // Se der erro, provavelmente a tabela não existe
      return res.status(200).json({ 
        message: 'Por favor, execute o script SQL no painel do Supabase para criar as tabelas.',
        sql_required: true,
        error: error.message
      });
    }
    
    if (existingAdmin && existingAdmin.length === 0) {
      // Vamos criar o admin automaticamente se a tabela existir mas ele não
      const hash = await bcrypt.hash('admin123', 10);
      const { error: insertError } = await supabase.from('users').insert({
        name: 'Chef Admin',
        email: 'admin@chefflow.com',
        password_hash: hash,
        role: 'admin'
      });

      if (insertError) {
        return res.status(500).json({ error: 'Erro ao criar admin', details: insertError.message });
      }

      return res.status(200).json({ 
        message: 'Admin criado com sucesso! Use admin@chefflow.com e admin123',
        admin_created: true
      });
    }

    return res.status(200).json({ 
      message: 'Banco de dados Supabase configurado e conectado com sucesso!',
      admin_created: true
    });
  } catch (error) {
    console.error('Erro no setup do banco:', error);
    return res.status(500).json({ error: 'Falha ao verificar o banco de dados', details: String(error) });
  }
}
