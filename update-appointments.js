const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'Frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars:', { supabaseUrl, supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const today = new Date().toISOString().split('T')[0];

  const { data: appointments, error: fetchErr } = await supabase
    .from('appointments')
    .select('*');

  if (fetchErr) {
    console.error('Fetch Err:', fetchErr);
    return;
  }

  console.log(`Found ${appointments.length} appointments. Updating 2026-06-17 appointments to ${today}...`);

  for (const appt of appointments) {
    if (appt.scheduled_time && appt.scheduled_time.startsWith('2026-06-17')) {
      const newTime = appt.scheduled_time.replace('2026-06-17', today);
      const { error: updateErr } = await supabase
        .from('appointments')
        .update({ scheduled_time: newTime })
        .eq('id', appt.id);
        
      if (updateErr) {
        console.error(`Failed to update appointment ${appt.id}:`, updateErr);
      } else {
        console.log(`Updated appointment ${appt.id} to ${newTime}`);
      }
    }
  }

  console.log('Done updating appointments!');
}

run();
