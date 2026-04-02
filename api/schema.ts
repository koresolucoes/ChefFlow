import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_ANON_KEY'];
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.from('inventory').select('*').limit(1);
    
    const fs = require('fs');
    fs.writeFileSync('schema.json', JSON.stringify({ data, error }, null, 2));

    return res.status(200).json({ data, error });
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}
