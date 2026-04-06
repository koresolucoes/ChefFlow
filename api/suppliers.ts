import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_ANON_KEY'];
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials missing' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    const userRole = userProfile?.role;
    const userTenantId = userProfile?.tenant_id;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        if (error.code === '42P01') return res.status(200).json([]);
        throw error;
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      if (userRole !== 'admin' && userRole !== 'estoque') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { name, contact_name, phone, email, delivery_days } = req.body;
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ name, contact_name, phone, email, delivery_days, tenant_id: userTenantId })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      if (userRole !== 'admin' && userRole !== 'estoque') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { id, name, contact_name, phone, email, delivery_days } = req.body;
      const { data, error } = await supabase
        .from('suppliers')
        .update({ name, contact_name, phone, email, delivery_days })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      if (userRole !== 'admin' && userRole !== 'estoque') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { id } = req.query;
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
