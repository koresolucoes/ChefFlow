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
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    const userRole = userProfile?.role || 'cook';
    const userTenantId = userProfile?.tenant_id;

    // GET: List inventory items
    if (req.method === 'GET') {
      const { team_id } = req.query;
      let query = supabase.from('inventory').select('id, name, category, unit, quantity, min_quantity, cost_per_unit, team_id, created_at');
      
      if (team_id === 'central') {
        query = query.is('team_id', null);
      } else if (team_id) {
        query = query.eq('team_id', team_id);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json(data);
    }

    // POST: Create a new inventory item
    if (req.method === 'POST') {
      if (userRole !== 'admin' && userRole !== 'chef' && userRole !== 'estoque') {
        return res.status(403).json({ error: 'Only admins, chefs and estoque can add inventory items' });
      }

      const { name, category, unit, quantity, min_quantity, cost_per_unit, team_id } = req.body;

      if (!name || !unit) {
        return res.status(400).json({ error: 'Name and unit are required' });
      }

      const { data, error } = await supabase
        .from('inventory')
        .insert({
          name: name,
          category: category || 'Geral',
          unit,
          quantity: quantity || 0,
          min_quantity: min_quantity || 0,
          cost_per_unit: cost_per_unit || 0,
          tenant_id: userTenantId,
          team_id: team_id === 'central' ? null : (team_id || null)
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json(data);
    }

    // PUT: Update an inventory item
    if (req.method === 'PUT') {
      const { id, name, category, unit, quantity, min_quantity, cost_per_unit, team_id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Item ID is required' });
      }

      // Cooks can only update quantity (e.g., when they use an item)
      const updateData: any = {};
      
      if (userRole === 'admin' || userRole === 'chef' || userRole === 'estoque') {
        if (name !== undefined) {
          updateData.name = name;
        }
        if (category !== undefined) updateData.category = category;
        if (unit !== undefined) updateData.unit = unit;
        if (min_quantity !== undefined) updateData.min_quantity = min_quantity;
        if (cost_per_unit !== undefined) updateData.cost_per_unit = cost_per_unit;
        if (team_id !== undefined) updateData.team_id = team_id === 'central' ? null : team_id;
      }
      
      if (quantity !== undefined) updateData.quantity = quantity;

      const { data, error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json(data);
    }

    // DELETE: Remove an inventory item
    if (req.method === 'DELETE') {
      if (userRole !== 'admin' && userRole !== 'chef' && userRole !== 'estoque') {
        return res.status(403).json({ error: 'Only admins, chefs and estoque can delete inventory items' });
      }

      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Item ID is required' });
      }

      const { error } = await supabase
        .from('inventory')
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
