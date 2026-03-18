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
      return res.status(200).json({ 
        message: 'Tabelas existem, mas o admin não foi encontrado. Por favor, execute o script SQL de INSERT no Supabase.',
        sql_required: true
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
