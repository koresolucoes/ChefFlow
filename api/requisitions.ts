import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env vars');

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, team_id, tenant_id')
      .eq('id', user.id)
      .single();

    const userRole = userProfile?.role || 'cook';
    const userTeamId = userProfile?.team_id;
    const userTenantId = userProfile?.tenant_id;

    // GET: Listar requisições
    if (req.method === 'GET') {
      const { team_id } = req.query;

      let query = supabase
        .from('requisitions')
        .select(`
          *,
          requester:users!requester_id(name),
          team:teams(name),
          items:requisition_items(
            *,
            inventory:inventory!product_id(name, unit)
          )
        `);

      if (userRole === 'cook' || userRole === 'chef') {
        // Cooks and chefs only see their team's requisitions
        if (userTeamId) {
          query = query.eq('team_id', userTeamId);
        } else {
          // If they don't have a team, they shouldn't see any requisitions, or maybe just theirs
          query = query.eq('requester_id', user.id);
        }
      } else if (team_id) {
        // Admin/estoque can filter by team
        query = query.eq('team_id', team_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json(data);
    }

    // POST: Criar nova requisição
    if (req.method === 'POST') {
      const { notes, items, team_id } = req.body;
      
      if (!items || !items.length) return res.status(400).json({ error: 'Items are required' });

      // Only allow admin/estoque to override team_id
      const finalTeamId = (userRole === 'admin' || userRole === 'estoque') && team_id ? team_id : userTeamId;

      const { data: reqData, error: reqError } = await supabase
        .from('requisitions')
        .insert({
          requester_id: user.id,
          team_id: finalTeamId,
          tenant_id: userTenantId,
          status: 'pending',
          notes
        })
        .select()
        .single();

      if (reqError) throw reqError;

      const itemsToInsert = items.map((i: any) => ({
        requisition_id: reqData.id,
        product_id: i.product_id,
        quantity_requested: i.quantity_requested,
        status: 'pending'
      }));

      const { error: itemsError } = await supabase.from('requisition_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      return res.status(201).json(reqData);
    }

    // PUT: Atender requisição (Apenas Estoque/Admin)
    if (req.method === 'PUT') {
      if (userRole !== 'admin' && userRole !== 'estoque') {
        return res.status(403).json({ error: 'Only admin and estoque can fulfill requisitions' });
      }

      const { id, items } = req.body;
      if (!id || !items) return res.status(400).json({ error: 'Requisition ID and items are required' });

      const { data: reqData } = await supabase.from('requisitions').select('team_id').eq('id', id).single();
      const targetTeamId = reqData?.team_id;

      let allFulfilled = true;
      let anyFulfilled = false;

      for (const item of items) {
        const status = item.quantity_fulfilled >= item.quantity_requested ? 'fulfilled' : 
                       (item.quantity_fulfilled > 0 ? 'partial' : 'out_of_stock');
        
        if (status !== 'fulfilled') allFulfilled = false;
        if (item.quantity_fulfilled > 0) anyFulfilled = true;

        await supabase.from('requisition_items').update({
          quantity_fulfilled: item.quantity_fulfilled,
          status: status
        }).eq('id', item.id);
          
        // Desconta do estoque central e adiciona ao estoque da praça
        if (item.quantity_fulfilled > 0) {
          const { data: centralInvItem } = await supabase.from('inventory').select('*').eq('id', item.product_id).single();
          if (centralInvItem) {
            // Subtract from central inventory
            await supabase.from('inventory').update({
              quantity: Math.max(0, Number(centralInvItem.quantity) - Number(item.quantity_fulfilled))
            }).eq('id', item.product_id);

            // Add to team inventory
            if (targetTeamId) {
              const { data: teamInvItem } = await supabase
                .from('inventory')
                .select('*')
                .eq('name', centralInvItem.name)
                .eq('team_id', targetTeamId)
                .single();

              if (teamInvItem) {
                await supabase.from('inventory').update({
                  quantity: Number(teamInvItem.quantity) + Number(item.quantity_fulfilled)
                }).eq('id', teamInvItem.id);
              } else {
                await supabase.from('inventory').insert({
                  name: centralInvItem.name,
                  category: centralInvItem.category,
                  unit: centralInvItem.unit,
                  quantity: Number(item.quantity_fulfilled),
                  min_quantity: 0,
                  cost_per_unit: centralInvItem.cost_per_unit,
                  tenant_id: centralInvItem.tenant_id,
                  team_id: targetTeamId
                });
              }
            }
          }
        }
      }

      const reqStatus = allFulfilled ? 'completed' : (anyFulfilled ? 'partial' : 'pending');

      const { data, error } = await supabase.from('requisitions').update({
        status: reqStatus,
        fulfilled_at: new Date().toISOString(),
        fulfilled_by: user.id
      }).eq('id', id).select().single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
