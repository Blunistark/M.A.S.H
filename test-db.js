const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'Frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  const shivas = profiles.filter(p => p.full_name.toLowerCase().includes('shiva'));
  const kirrans = profiles.filter(p => p.full_name.toLowerCase().includes('kirran'));
  
  console.log('Shivas:', shivas);
  console.log('Kirrans:', kirrans);

  const shivaIds = shivas.map(s => s.id);
  const kirranIds = kirrans.map(k => k.id);

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .or(`patient_id.in.(${shivaIds.join(',')}),doctor_id.in.(${kirranIds.join(',')})`);
  
  console.log('Appointments:', appointments);
}

check();
