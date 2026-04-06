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
      return res.status(500).json({ error: 'Supabase credentials missing' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    const userRole = userProfile?.role;
    const userTenantId = userProfile?.tenant_id;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (name),
          purchase_order_items (
            *,
            inventory (name, unit)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return res.status(200).json([]);
        throw error;
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      if (userRole !== 'admin' && userRole !== 'estoque') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { supplier_id, expected_delivery_date, items } = req.body;
      
      // Calculate total cost
      const total_cost = items.reduce((acc: number, item: any) => acc + (item.quantity_ordered * item.unit_cost), 0);

      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({ 
          supplier_id, 
          status: 'ordered', 
          expected_delivery_date, 
          total_cost,
          tenant_id: userTenantId 
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item: any) => ({
        purchase_order_id: order.id,
        inventory_id: item.inventory_id,
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return res.status(201).json(order);
    }

    if (req.method === 'PUT') {
      if (userRole !== 'admin' && userRole !== 'estoque') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { action, id, items } = req.body;

      if (action === 'receive') {
        // We will do this via RPC to ensure atomicity, but fallback to manual if RPC doesn't exist
        const { error } = await supabase.rpc('receive_purchase_order', {
          p_order_id: id,
          p_items: items // array of { id: item_id, quantity_received: number, unit_cost: number, inventory_id: uuid }
        });

        if (error) {
          console.warn('RPC failed, falling back to manual update', error);
          // Fallback if RPC doesn't exist yet (for the preview)
          // Update order status
          await supabase.from('purchase_orders').update({ status: 'received' }).eq('id', id);
          
          // Update items and inventory
          for (const item of items) {
            await supabase.from('purchase_order_items')
              .update({ quantity_received: item.quantity_received })
              .eq('id', item.id);
              
            // Get current inventory
            const { data: inv } = await supabase.from('inventory').select('quantity, cost_per_unit').eq('id', item.inventory_id).single();
            if (inv) {
              const newQuantity = Number(inv.quantity) + Number(item.quantity_received);
              // Calculate new average cost
              const totalValue = (Number(inv.quantity) * Number(inv.cost_per_unit)) + (Number(item.quantity_received) * Number(item.unit_cost));
              const newCost = newQuantity > 0 ? totalValue / newQuantity : item.unit_cost;
              
              await supabase.from('inventory')
                .update({ quantity: newQuantity, cost_per_unit: newCost })
                .eq('id', item.inventory_id);
            }
          }
        }

        return res.status(200).json({ success: true });
      }
      
      if (action === 'cancel') {
        const { error } = await supabase.from('purchase_orders').update({ status: 'cancelled' }).eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
