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
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartISO = todayStart.toISOString();

        const [checklistsRes, equipmentsRes, closingRes] = await Promise.all([
          supabase.from('checklists').select('*, checklist_records(*)').gte('checklist_records.created_at', todayStartISO).order('created_at', { foreignTable: 'checklist_records', ascending: false }),
          supabase.from('equipments').select('*, temperature_records(*)').gte('temperature_records.created_at', todayStartISO).order('created_at', { foreignTable: 'temperature_records', ascending: false }),
          supabase.from('closing_tasks').select('*, closing_records(*)').gte('closing_records.created_at', todayStartISO).order('created_at', { foreignTable: 'closing_records', ascending: false })
        ]);

        if (checklistsRes.error) throw checklistsRes.error;
        if (equipmentsRes.error) throw equipmentsRes.error;
        if (closingRes.error) throw closingRes.error;

        const tasks: any[] = [];

        if (checklistsRes.data) {
          tasks.push(...checklistsRes.data.map(c => {
            const record = c.checklist_records?.[0];
            return {
              id: c.id,
              title: c.title,
              description: c.description,
              category: 'checklist',
              status: record ? record.status : 'pending',
              updated_at: record ? record.created_at : c.created_at
            };
          }));
        }

        if (equipmentsRes.data) {
          tasks.push(...equipmentsRes.data.map(e => {
            const record = e.temperature_records?.[0];
            return {
              id: e.id,
              title: e.name,
              description: e.description,
              category: 'termometria',
              target_value: e.target_value,
              status: record ? record.status : 'pending',
              value: record ? record.value : undefined,
              updated_at: record ? record.created_at : e.created_at
            };
          }));
        }

        if (closingRes.data) {
          tasks.push(...closingRes.data.map(c => {
            const record = c.closing_records?.[0];
            return {
              id: c.id,
              title: c.title,
              description: c.description,
              category: 'fechamento',
              status: record ? record.status : 'pending',
              reason: record ? record.reason : undefined,
              updated_at: record ? record.created_at : c.created_at
            };
          }));
        }

        // Sort by created_at descending
        tasks.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        return res.status(200).json(tasks);
      }

      case 'POST': {
        if (userRole !== 'admin' && userRole !== 'chef') {
          return res.status(403).json({ error: 'Forbidden: Only admins and chefs can create tasks' });
        }

        const { title, description, category, target_value } = req.body;
        
        if (!title || !category) {
          return res.status(400).json({ error: 'Title and category are required' });
        }

        let resultData;

        if (category === 'checklist') {
          const { data, error } = await supabase.from('checklists').insert([{ title, description }]).select().single();
          if (error) throw error;
          resultData = { id: data.id, title: data.title, description: data.description, category: 'checklist', status: 'pending', updated_at: data.created_at };
        } else if (category === 'termometria') {
          const { data, error } = await supabase.from('equipments').insert([{ name: title, description, target_value }]).select().single();
          if (error) throw error;
          resultData = { id: data.id, title: data.name, description: data.description, category: 'termometria', target_value: data.target_value, status: 'pending', updated_at: data.created_at };
        } else if (category === 'fechamento') {
          const { data, error } = await supabase.from('closing_tasks').insert([{ title, description }]).select().single();
          if (error) throw error;
          resultData = { id: data.id, title: data.title, description: data.description, category: 'fechamento', status: 'pending', updated_at: data.created_at };
        } else {
          return res.status(400).json({ error: 'Invalid category' });
        }

        return res.status(201).json(resultData);
      }

      case 'PUT': {
        const { id, category, status, reason, value } = req.body;

        if (!id || !category) {
          return res.status(400).json({ error: 'Task ID and category are required' });
        }

        let resultData;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        if (category === 'checklist') {
          if (status === 'pending') {
             await supabase.from('checklist_records').delete().eq('checklist_id', id).gte('created_at', todayStart.toISOString());
             resultData = { status: 'pending', updated_at: new Date().toISOString() };
          } else {
             const { data: existing } = await supabase.from('checklist_records').select('id').eq('checklist_id', id).gte('created_at', todayStart.toISOString()).single();
             if (existing) {
               const { data } = await supabase.from('checklist_records').update({ status, user_id: user.id, created_at: new Date().toISOString() }).eq('id', existing.id).select().single();
               resultData = data;
             } else {
               const { data } = await supabase.from('checklist_records').insert([{ checklist_id: id, status, user_id: user.id }]).select().single();
               resultData = data;
             }
          }
        } else if (category === 'termometria') {
          const { data: existing } = await supabase.from('temperature_records').select('id').eq('equipment_id', id).gte('created_at', todayStart.toISOString()).single();
          const recordData = { value: value !== undefined ? value : '', status: status || 'conforme', user_id: user.id, created_at: new Date().toISOString() };

          if (existing) {
            const { data } = await supabase.from('temperature_records').update(recordData).eq('id', existing.id).select().single();
            resultData = data;
          } else {
            const { data } = await supabase.from('temperature_records').insert([{ equipment_id: id, ...recordData }]).select().single();
            resultData = data;
          }
        } else if (category === 'fechamento') {
          const { data: existing } = await supabase.from('closing_records').select('id').eq('closing_task_id', id).gte('created_at', todayStart.toISOString()).single();
          const recordData: any = { status: status || 'conforme', user_id: user.id, created_at: new Date().toISOString() };
          if (reason !== undefined) recordData.reason = reason;

          if (existing) {
            const { data } = await supabase.from('closing_records').update(recordData).eq('id', existing.id).select().single();
            resultData = data;
          } else {
            const { data } = await supabase.from('closing_records').insert([{ closing_task_id: id, ...recordData }]).select().single();
            resultData = data;
          }
        }

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

        const { id, category } = req.query;
        if (!id || !category) {
          return res.status(400).json({ error: 'ID and category are required' });
        }

        let table = '';
        if (category === 'checklist') table = 'checklists';
        else if (category === 'termometria') table = 'equipments';
        else if (category === 'fechamento') table = 'closing_tasks';

        if (!table) return res.status(400).json({ error: 'Invalid category' });

        const { error } = await supabase.from(table).delete().eq('id', id);
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
