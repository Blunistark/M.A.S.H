const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'Frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: prescriptions } = await supabase.from('prescriptions').select('*');
  const { data: items } = await supabase.from('prescription_items').select('*');
  const { data: inventory } = await supabase.from('medicine_inventory').select('*');
  
  console.log('--- PRESCRIPTIONS ---');
  console.log(JSON.stringify(prescriptions, null, 2));
  console.log('--- PRESCRIPTION ITEMS ---');
  console.log(JSON.stringify(items, null, 2));
  console.log('--- INVENTORY ---');
  console.log(JSON.stringify(inventory, null, 2));
}

check();
