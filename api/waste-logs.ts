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
    const supabaseKey = process.env['SUPABASE_ANON_KEY'];
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    
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
    const adminSupabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    // Puxa o tenant_id do usuário logado
    const { data: userProfile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
    if (!userProfile?.tenant_id) return res.status(403).json({ error: 'User tenant not found' });
    
    const tenantId = userProfile.tenant_id;

    if (req.method === 'GET') {
      const { data, error } = await adminSupabase
        .from('waste_logs')
        .select(`
          *,
          inventory_item:inventory(*),
          user:users(id, name, role)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { inventory_item_id, quantity, unit, reason, notes, cost_impact } = req.body;

      if (!inventory_item_id || !quantity || !unit || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data, error } = await adminSupabase
        .from('waste_logs')
        .insert({
          inventory_item_id,
          user_id: user.id,
          quantity,
          unit,
          reason,
          notes,
          cost_impact: cost_impact || 0,
          tenant_id: tenantId
        })
        .select(`
          *,
          inventory_item:inventory(*),
          user:users(id, name, role)
        `)
        .single();

      if (error) return res.status(400).json({ error: error.message });

      return res.status(201).json(data);
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Log ID is required' });
      
      const { error } = await adminSupabase.from('waste_logs').delete().eq('id', id).eq('tenant_id', tenantId);
      if (error) return res.status(400).json({ error: error.message });
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
