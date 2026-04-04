import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.example' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('inventory').select('*');
  console.log('All inventory:', data?.length);
  
  const { data: central } = await supabase.from('inventory').select('*').is('team_id', null);
  console.log('Central inventory:', central?.length);
  
  const { data: praca } = await supabase.from('inventory').select('*').not('team_id', 'is', null);
  console.log('Praca inventory:', praca?.length);
}
run();
