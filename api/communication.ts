import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env['SUPABASE_URL'] || '';
  const supabaseKey = process.env['SUPABASE_ANON_KEY'] || '';

  // Authentication check
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
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
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, tenant_id, team_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return res.status(401).json({ error: 'User not found in database' });
  }

  const userRole = userData.role;
  const userTenantId = userData.tenant_id;

  try {
    switch (req.method) {
      case 'GET': {
        let query = supabase
          .from('communication')
          .select(`
            *,
            author:users!communication_author_id_fkey ( name, role )
          `)
          .order('created_at', { ascending: false });

        // Filter by team if not admin
        if (userRole !== 'admin') {
          if (userData.team_id) {
            // Show announcements for this team OR global announcements (team_id is null)
            query = query.or(`team_id.eq.${userData.team_id},team_id.is.null`);
          } else {
            // If no team, only show global announcements
            query = query.is('team_id', null);
          }
        } else {
          // For admin, allow filtering by team if provided
          const { team_id } = req.query;
          if (team_id && team_id !== 'todas') {
            query = query.or(`team_id.eq.${team_id},team_id.is.null`);
          }
        }

        const { data, error } = await query;

        if (error) throw error;
        return res.status(200).json(data);
      }

      case 'POST': {
        if (userRole !== 'admin' && userRole !== 'chef') {
          return res.status(403).json({ error: 'Forbidden: Only admins and chefs can post announcements' });
        }

        const { title, content, type, team_id } = req.body;
        
        if (!title || !content) {
          return res.status(400).json({ error: 'Title and content are required' });
        }

        const { data, error } = await supabase
          .from('communication')
          .insert([{ 
            title, 
            content, 
            type: type || 'info',
            author_id: user.id,
            tenant_id: userTenantId,
            team_id: userRole === 'admin' && team_id ? team_id : userData.team_id
          }])
          .select(`
            *,
            author:users!communication_author_id_fkey ( name, role )
          `)
          .single();

        if (error) throw error;
        return res.status(201).json(data);
      }

      case 'DELETE': {
        if (userRole !== 'admin' && userRole !== 'chef') {
          return res.status(403).json({ error: 'Forbidden: Only admins and chefs can delete announcements' });
        }

        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Announcement ID is required' });
        }

        const { error } = await supabase
          .from('communication')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ message: 'Announcement deleted successfully' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Communication API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
