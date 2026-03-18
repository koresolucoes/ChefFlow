import { neon } from '@neondatabase/serverless';
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
    if (!process.env['DATABASE_URL']) {
      throw new Error('DATABASE_URL não configurada');
    }
    const sql = neon(process.env['DATABASE_URL']);

    // GET: Buscar escalas (opcionalmente filtrando por data)
    if (req.method === 'GET') {
      const { start_date, end_date } = req.query;
      let schedules;
      
      if (start_date && end_date) {
        schedules = await sql`
          SELECT * FROM schedules 
          WHERE date >= ${start_date as string} AND date <= ${end_date as string} 
          ORDER BY date ASC
        `;
      } else {
        schedules = await sql`SELECT * FROM schedules ORDER BY date ASC`;
      }
      
      return res.status(200).json(schedules);
    }

    // POST: Criar ou atualizar uma escala (Upsert)
    if (req.method === 'POST') {
      const { user_id, date, shift_start, shift_end, type } = req.body;
      
      if (!user_id || !date || !type) {
        return res.status(400).json({ message: 'user_id, date e type são obrigatórios' });
      }

      // Verifica se já existe uma escala para este usuário nesta data
      const existing = await sql`SELECT id FROM schedules WHERE user_id = ${user_id} AND date = ${date}`;
      
      if (existing.length > 0) {
        // Atualiza
        const updated = await sql`
          UPDATE schedules 
          SET shift_start = ${shift_start || null}, 
              shift_end = ${shift_end || null}, 
              type = ${type}
          WHERE id = ${existing[0]['id']}
          RETURNING *
        `;
        return res.status(200).json(updated[0]);
      } else {
        // Insere
        const inserted = await sql`
          INSERT INTO schedules (user_id, date, shift_start, shift_end, type)
          VALUES (${user_id}, ${date}, ${shift_start || null}, ${shift_end || null}, ${type})
          RETURNING *
        `;
        return res.status(201).json(inserted[0]);
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Erro na API de schedules:', error);
    return res.status(500).json({ message: 'Erro interno no servidor' });
  }
}
