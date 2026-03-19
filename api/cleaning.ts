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
        const { category } = req.query;
        let query = supabase.from('cleaning_tasks').select(`
          *,
          teams ( name ),
          assigned_to_user:users!cleaning_tasks_assigned_to_fkey ( name )
        `).order('created_at', { ascending: false });

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data);
      }

      case 'POST': {
        if (userRole !== 'admin' && userRole !== 'chef') {
          return res.status(403).json({ error: 'Forbidden: Only admins and chefs can create cleaning tasks' });
        }

        const { title, description, category, target_value, team_id, assigned_to } = req.body;
        
        if (!title || !category) {
          return res.status(400).json({ error: 'Title and category are required' });
        }

        const { data, error } = await supabase
          .from('cleaning_tasks')
          .insert([{ 
            title, 
            description, 
            category, 
            target_value,
            team_id: team_id || null,
            assigned_to: assigned_to || null,
            status: 'pending'
          }])
          .select()
          .single();

        if (error) throw error;
        
        await supabase.from('cleaning_task_history').insert([{
          task_id: data.id,
          user_id: user.id,
          action: 'created'
        }]);

        return res.status(201).json(data);
      }

      case 'PUT': {
        const { id, status, reason, value } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Task ID is required' });
        }

        const updates: any = { updated_at: new Date().toISOString() };
        if (status !== undefined) updates.status = status;
        if (reason !== undefined) updates.reason = reason;
        if (value !== undefined) updates.value = value;

        const { data, error } = await supabase
          .from('cleaning_tasks')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        // Insert into history
        let action = 'updated';
        if (status === 'completed' || status === 'conforme' || status === 'nao_conforme') action = 'status_changed';
        if (value !== undefined) action = 'temperature_read';
        
        await supabase.from('cleaning_task_history').insert([{
          task_id: id,
          user_id: user.id,
          action: action,
          new_value: value || status,
          notes: reason
        }]);

        return res.status(200).json(data);
      }

      case 'DELETE': {
        if (userRole !== 'admin' && userRole !== 'chef') {
          return res.status(403).json({ error: 'Forbidden: Only admins and chefs can delete cleaning tasks' });
        }

        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Task ID is required' });
        }

        const { error } = await supabase
          .from('cleaning_tasks')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ message: 'Task deleted successfully' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Cleaning API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
