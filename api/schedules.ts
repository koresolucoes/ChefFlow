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
    const supabaseKey = process.env['SUPABASE_ANON_KEY'] || process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET: Buscar escalas (opcionalmente filtrando por data)
    if (req.method === 'GET') {
      const { start_date, end_date } = req.query;
      
      let query = supabase.from('schedules').select('*').order('date', { ascending: true });
      
      if (start_date && end_date) {
        query = query.gte('date', start_date).lte('date', end_date);
      }
      
      const { data: schedules, error } = await query;
      
      if (error) throw error;
      return res.status(200).json(schedules);
    }

    // POST: Criar ou atualizar uma escala (Upsert)
    if (req.method === 'POST') {
      const { user_id, date, shift_start, shift_end, type } = req.body;
      
      if (!user_id || !date || !type) {
        return res.status(400).json({ message: 'user_id, date e type são obrigatórios' });
      }

      // Verifica se já existe uma escala para este usuário nesta data
      const { data: existing, error: fetchError } = await supabase
        .from('schedules')
        .select('id')
        .eq('user_id', user_id)
        .eq('date', date);
        
      if (fetchError) throw fetchError;
      
      if (existing && existing.length > 0) {
        // Atualiza
        const { data: updated, error: updateError } = await supabase
          .from('schedules')
          .update({ shift_start: shift_start || null, shift_end: shift_end || null, type })
          .eq('id', existing[0].id)
          .select();
          
        if (updateError) throw updateError;
        return res.status(200).json(updated[0]);
      } else {
        // Insere
        const { data: inserted, error: insertError } = await supabase
          .from('schedules')
          .insert({ user_id, date, shift_start: shift_start || null, shift_end: shift_end || null, type })
          .select();
          
        if (insertError) throw insertError;
        return res.status(201).json(inserted[0]);
      }
    }

    // DELETE: Remover uma escala
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: 'id é obrigatório' });
      }

      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      return res.status(200).json({ message: 'Escala removida com sucesso' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Erro na API de schedules:', error);
    return res.status(500).json({ message: 'Erro interno no servidor' });
  }
}
