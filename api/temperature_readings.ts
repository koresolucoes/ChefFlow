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

  try {
    switch (req.method) {
      case 'GET': {
        const { equipment_id, start_date, end_date } = req.query;
        let query = supabase.from('temperature_readings').select(`
          *,
          equipment:equipment ( name ),
          user:users ( name )
        `).order('created_at', { ascending: false });

        if (equipment_id) query = query.eq('equipment_id', equipment_id);
        if (start_date) query = query.gte('created_at', start_date);
        if (end_date) query = query.lte('created_at', end_date);

        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data);
      }

      case 'POST': {
        const { equipment_id, value, status, reason } = req.body;
        const { data, error } = await supabase.from('temperature_readings').insert([{
          equipment_id,
          value,
          status,
          reason,
          user_id: user.id
        }]).select().single();

        if (error) throw error;
        return res.status(201).json(data);
      }

      default: return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
