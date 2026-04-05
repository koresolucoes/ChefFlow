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
      throw new Error('Missing Supabase env vars');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user role and tenant
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, tenant_id, team_id')
      .eq('id', user.id)
      .single();

    const userTenantId = userProfile?.tenant_id;
    const userRole = userProfile?.role;
    const userTeamId = userProfile?.team_id;

    if (req.method === 'GET') {
      const { date } = req.query;
      let query = supabase.from('time_entries').select('*, users!inner(name, role, team_id)');
      if (date) {
        query = query.eq('date', date);
      }

      if (userRole !== 'admin') {
        if (userTeamId) {
          query = query.eq('users.team_id', userTeamId);
        } else {
          query = query.eq('user_id', user.id);
        }
      } else {
        const { team_id } = req.query;
        if (team_id && team_id !== 'todas') {
          query = query.eq('users.team_id', team_id);
        }
      }

      const { data, error } = await query.order('clock_in', { ascending: false });
      
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST200') {
          console.warn(`Table or relationship error (${error.code}). Returning empty array.`);
          return res.status(200).json([]);
        }
        throw error;
      }
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { user_id, action } = req.body; // action: 'in' or 'out'
      
      const timeZone = (req.headers['x-timezone'] as string) || 'America/Sao_Paulo';
      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
      const today = formatter.format(new Date()); // Returns YYYY-MM-DD in the requested timezone
      
      const now = new Date().toISOString();

      if (action === 'in') {
        const { data, error } = await supabase.from('time_entries').insert({
          user_id,
          date: today,
          clock_in: now,
          tenant_id: userTenantId
        }).select().single();
        
        if (error) {
          if (error.code === '42P01') {
            return res.status(200).json({ id: 'mock-id', user_id, date: today, clock_in: now, clock_out: null, users: { name: 'Usuário Teste', role: 'freelancer' } });
          }
          throw error;
        }
        return res.status(200).json(data);
      } else if (action === 'out') {
        const { data: entries, error: fetchError } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user_id)
          .eq('date', today)
          .is('clock_out', null)
          .order('clock_in', { ascending: false })
          .limit(1);
          
        if (fetchError) {
          if (fetchError.code === '42P01') {
            return res.status(200).json({ id: 'mock-id', user_id, date: today, clock_in: today + 'T08:00:00Z', clock_out: now, users: { name: 'Usuário Teste', role: 'freelancer' } });
          }
          throw fetchError;
        }
        if (!entries || entries.length === 0) {
          return res.status(400).json({ message: 'No open clock-in found' });
        }

        const { data, error } = await supabase.from('time_entries')
          .update({ clock_out: now })
          .eq('id', entries[0].id)
          .select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Time tracking API error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: String(error) });
  }
}
