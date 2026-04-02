import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.example' }); // or .env if it exists

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('inventory').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', data);
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    }
  }
}

checkSchema();
