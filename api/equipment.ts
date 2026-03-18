import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['SUPABASE_URL'] || '';
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
  const userRole = userData?.role;

  try {
    switch (req.method) {
      case 'GET': {
        const { id, team_id, category } = req.query;
        let query = supabase.from('equipment').select('*').order('name', { ascending: true });
        if (id) query = query.eq('id', id);
        if (team_id) query = query.eq('team_id', team_id);
        if (category) query = query.eq('category', category);
        
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data);
      }

      case 'POST': {
        if (userRole !== 'admin' && userRole !== 'chef') return res.status(403).json({ error: 'Forbidden' });
        const { name, target_min, target_max, team_id, category } = req.body;
        const { data, error } = await supabase.from('equipment').insert([{ name, target_min, target_max, team_id, category }]).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      case 'DELETE': {
        if (userRole !== 'admin' && userRole !== 'chef') return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.query;
        const { error } = await supabase.from('equipment').delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ message: 'Deleted' });
      }

      default: return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
