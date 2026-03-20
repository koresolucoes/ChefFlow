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
        const dateParam = req.query.date as string;
        let logDate = '';
        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
          logDate = dateParam;
        } else {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          logDate = `${yyyy}-${mm}-${dd}`;
        }

        const { data: templates, error: templatesError } = await supabase
          .from('cleaning_templates')
          .select('*, cleaning_logs(*)')
          .eq('is_active', true)
          .eq('cleaning_logs.log_date', logDate)
          .order('created_at', { ascending: true });

        if (templatesError) throw templatesError;

        const tasks = templates?.map(t => {
          const log = t.cleaning_logs?.[0];
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            shift_moment: t.shift_moment,
            target_value: t.target_value,
            status: log ? log.status : 'pending',
            value: log ? log.value : undefined,
            reason: log ? log.reason : undefined,
            updated_at: log ? log.created_at : t.created_at
          };
        }) || [];

        return res.status(200).json(tasks);
      }

      case 'POST': {
        if (userRole !== 'admin' && userRole !== 'chef') {
          return res.status(403).json({ error: 'Forbidden: Only admins and chefs can create tasks' });
        }

        const { title, description, category, shift_moment, shift_moments, target_value } = req.body;
        
        const momentsToInsert = shift_moments || (shift_moment ? [shift_moment] : []);

        if (!title || !category || momentsToInsert.length === 0) {
          return res.status(400).json({ error: 'Title, category, and at least one shift_moment are required' });
        }

        const inserts = momentsToInsert.map((sm: string) => ({
          title,
          description,
          category,
          shift_moment: sm,
          target_value
        }));

        const { data, error } = await supabase
          .from('cleaning_templates')
          .insert(inserts)
          .select();

        if (error) throw error;

        const responseData = data.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          category: d.category,
          shift_moment: d.shift_moment,
          target_value: d.target_value,
          status: 'pending',
          updated_at: d.created_at
        }));

        return res.status(201).json(responseData);
      }

      case 'PUT': {
        const { id, status, reason, value } = req.body;

        if (!id || !status) {
          return res.status(400).json({ error: 'Template ID and status are required' });
        }

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const logDate = `${yyyy}-${mm}-${dd}`;

        if (status === 'pending') {
           await supabase.from('cleaning_logs').delete().eq('template_id', id).eq('log_date', logDate);
           return res.status(200).json({ status: 'pending', updated_at: new Date().toISOString() });
        }

        const logData: any = { template_id: id, status, user_id: user.id, log_date: logDate };
        if (reason !== undefined) logData.reason = reason;
        if (value !== undefined) logData.value = value;

        // Check if log exists
        const { data: existingLog } = await supabase
          .from('cleaning_logs')
          .select('id')
          .eq('template_id', id)
          .eq('log_date', logDate)
          .single();

        let resultData;
        let error;

        if (existingLog) {
          const { data, error: updateError } = await supabase
            .from('cleaning_logs')
            .update(logData)
            .eq('id', existingLog.id)
            .select()
            .single();
          resultData = data;
          error = updateError;
        } else {
          const { data, error: insertError } = await supabase
            .from('cleaning_logs')
            .insert(logData)
            .select()
            .single();
          resultData = data;
          error = insertError;
        }

        if (error) throw error;

        return res.status(200).json({
          status: resultData?.status || 'pending',
          reason: resultData?.reason,
          value: resultData?.value,
          updated_at: resultData?.created_at || new Date().toISOString()
        });
      }

      case 'DELETE': {
        if (userRole !== 'admin' && userRole !== 'chef') {
          return res.status(403).json({ error: 'Forbidden: Only admins and chefs can delete tasks' });
        }

        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }

        // Soft delete
        const { error } = await supabase.from('cleaning_templates').update({ is_active: false }).eq('id', id);
        if (error) throw error;
        
        return res.status(200).json({ message: 'Deleted successfully' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Cleaning API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
