const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'Frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: appointments } = await supabase.from('appointments').select('*');
  
  console.log('--- PROFILES ---');
  console.log(profiles);
  console.log('--- APPOINTMENTS ---');
  console.log(appointments);
}

check();
