import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
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
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials missing' });
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
      .select('role, team_id, tenant_id')
      .eq('id', user.id)
      .single();

    const userRole = userProfile?.role || 'cook';
    const userTeamId = userProfile?.team_id;
    const userTenantId = userProfile?.tenant_id;

    // GET: List prep tasks
    if (req.method === 'GET') {
      let query = supabase
        .from('prep_tasks')
        .select(`
          *,
          teams (id, name),
          assigned_to_user:users!assigned_to (id, name)
        `)
        .order('created_at', { ascending: false });

      // Filter by team if not admin
      if (userRole !== 'admin') {
        if (userTeamId) {
          query = query.eq('team_id', userTeamId);
        } else {
          // If no team, only see own tasks
          query = query.eq('assigned_to', user.id);
        }
      } else {
        // For admin, allow filtering by team if provided
        const { team_id } = req.query;
        if (team_id && team_id !== 'todas') {
          query = query.eq('team_id', team_id);
        }
      }

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json(data);
    }

    // POST: Create a new prep task
    if (req.method === 'POST') {
      if (userRole !== 'admin' && userRole !== 'chef') {
        return res.status(403).json({ error: 'Only admins and chefs can create tasks' });
      }

      const { name, description, status, team_id, assigned_to, due_date, recipe_id, target_portions } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      let finalTeamId = team_id || null;
      if (userRole !== 'admin') {
        finalTeamId = userTeamId || null;
      }

      const { data, error } = await supabase
        .from('prep_tasks')
        .insert({
          title: name,
          name: name,
          description,
          status: status || 'pending',
          team_id: finalTeamId,
          assigned_to: assigned_to || null,
          due_date: due_date || null,
          recipe_id: recipe_id || null,
          target_portions: target_portions || null,
          tenant_id: userTenantId
        })
        .select(`
          *,
          teams (id, name),
          assigned_to_user:users!assigned_to (id, name)
        `)
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json(data);
    }

    // PUT: Update a prep task
    if (req.method === 'PUT') {
      if (userRole !== 'admin' && userRole !== 'chef' && userRole !== 'cook') {
        return res.status(403).json({ error: 'Permission denied to update tasks' });
      }

      const { id, name, description, status, team_id, assigned_to, due_date, recipe_id, target_portions } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      // Check existing task
      const { data: existingTask } = await supabase.from('prep_tasks').select('*').eq('id', id).single();
      if (!existingTask) return res.status(404).json({ error: 'Task not found' });

      const updateData: any = {};
      
      if (name !== undefined) {
        updateData.name = name;
        updateData.title = name;
      }
      if (description !== undefined) updateData.description = description;
      if (team_id !== undefined) updateData.team_id = team_id || null;
      if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null;
      if (due_date !== undefined) updateData.due_date = due_date || null;
      if (recipe_id !== undefined) updateData.recipe_id = recipe_id || null;
      if (target_portions !== undefined) updateData.target_portions = target_portions || null;
      
      let shouldProcessInventory = false;
      if (status !== undefined) {
        updateData.status = status;
        if (existingTask.status !== 'completed' && status === 'completed') {
           shouldProcessInventory = true;
        }
      }

      const { data, error } = await supabase
        .from('prep_tasks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          teams (id, name),
          assigned_to_user:users!assigned_to (id, name)
        `)
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (shouldProcessInventory && data.recipe_id && data.target_portions) {
         // Deduct from inventory
         const { data: recipe } = await supabase.from('recipes').select('*, recipe_ingredients(*)').eq('id', data.recipe_id).single();
         if (recipe) {
            const ratio = data.target_portions / (recipe.base_portions || 1);
            
            // Decrease ingredients
            for (const ing of recipe.recipe_ingredients || []) {
               if (ing.inventory_item_id) {
                 const totalDeduct = ing.quantity * ratio * (ing.correction_factor || 1.0);
                 const { data: invItem } = await supabase.from('inventory').select('quantity').eq('id', ing.inventory_item_id).single();
                 if (invItem) {
                    await supabase.from('inventory').update({ quantity: invItem.quantity - totalDeduct }).eq('id', ing.inventory_item_id);
                 }
               }
            }

            // Increase produced item
            if (recipe.produced_item_id) {
               const { data: invItem } = await supabase.from('inventory').select('quantity').eq('id', recipe.produced_item_id).single();
               if (invItem) {
                  await supabase.from('inventory').update({ quantity: (Number(invItem.quantity) || 0) + data.target_portions }).eq('id', recipe.produced_item_id);
               }
            }
         }
      }

      return res.status(200).json(data);
    }

    // DELETE: Remove a prep task
    if (req.method === 'DELETE') {
      if (userRole !== 'admin' && userRole !== 'chef') {
        return res.status(403).json({ error: 'Only admins and chefs can delete tasks' });
      }

      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const { error } = await supabase
        .from('prep_tasks')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
