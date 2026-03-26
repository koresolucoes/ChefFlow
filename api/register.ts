import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ message: 'Configuração do servidor ausente' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { name, email, password, restaurantName } = req.body;

    if (!name || !email || !password || !restaurantName) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    // 1. Criar o restaurante (tenant)
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: restaurantName })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 2. Criar o usuário no Auth como ADMIN do novo restaurante
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: 'admin',
        tenant_id: tenant.id
      }
    });

    if (authError) {
      // Rollback: deletar o tenant se a criação do usuário falhar
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return res.status(400).json({ message: authError.message });
    }

    return res.status(201).json({ message: 'Conta criada com sucesso!' });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ message: error.message || 'Erro interno no servidor' });
  }
}
