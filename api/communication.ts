import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['SUPABASE_URL'] || '';
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication check
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get user role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return res.status(401).json({ error: 'User not found in database' });
  }

  const userRole = userData.role;

  try {
    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase
          .from('communication')
          .select(`
            *,
            author:users!communication_author_id_fkey ( name, role )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data);
      }

      case 'POST': {
        if (userRole !== 'admin' && userRole !== 'chef') {
          return res.status(403).json({ error: 'Forbidden: Only admins and chefs can post announcements' });
        }

        const { title, content, type } = req.body;
        
        if (!title || !content) {
          return res.status(400).json({ error: 'Title and content are required' });
        }

        const { data, error } = await supabase
          .from('communication')
          .insert([{ 
            title, 
            content, 
            type: type || 'info',
            author_id: user.id
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
