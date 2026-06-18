const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, 'Frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars:', { supabaseUrl, supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const doctorId = '2b6b5666-287a-4ea7-8cf1-fc8f508c6e75'; // Dr. Gregory House
  const today = new Date().toISOString().split('T')[0];

  const patients = [
    {
      id: crypto.randomUUID(),
      name: 'James Wilson',
      phone: '(555) 555-0101',
      email: 'wilson@princeton.edu',
      dob: '02/28/1969',
      gender: 'Male',
      bloodType: 'B+',
      age: 57,
      address: '122 Mercer St, Princeton, NJ',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      vitals: { bp: '120/80', hr: '70 bpm', weight: '175 lbs' },
      time: `${today}T10:00:00.000Z`,
      status: 'scheduled'
    },
    {
      id: crypto.randomUUID(),
      name: 'Lisa Cuddy',
      phone: '(555) 555-0102',
      email: 'cuddy@princeton.edu',
      dob: '05/24/1966',
      gender: 'Female',
      bloodType: 'A-',
      age: 60,
      address: '45 Broad St, Princeton, NJ',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      vitals: { bp: '110/72', hr: '64 bpm', weight: '125 lbs' },
      time: `${today}T13:30:00.000Z`,
      status: 'scheduled'
    },
    {
      id: crypto.randomUUID(),
      name: 'Remy Hadley',
      phone: '(555) 555-0113',
      email: 'thirteen@princeton.edu',
      dob: '03/10/1984',
      gender: 'Female',
      bloodType: 'O+',
      age: 42,
      address: '742 Evergreen Terrace, Princeton, NJ',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
      vitals: { bp: '115/70', hr: '75 bpm', weight: '120 lbs' },
      time: `${today}T15:00:00.000Z`,
      status: 'scheduled'
    }
  ];

  for (const p of patients) {
    console.log('Inserting patient profile for:', p.name);
    // 1. Profile
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: p.id,
      full_name: p.name,
      role: 'patient',
      contact_number: p.phone
    });
    if (profileErr) console.error('Profile Err:', profileErr);

    // 2. Demographics
    const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const { error: demoErr } = await supabase.from('medical_records').insert({
      patient_id: p.id,
      doctor_id: doctorId,
      record_type: 'demographics',
      description: JSON.stringify({
        dob: p.dob,
        gender: p.gender,
        bloodType: p.bloodType,
        photo: p.photo,
        age: p.age,
        address: p.address,
        email: p.email,
        initials
      }),
      record_date: new Date().toISOString().split('T')[0]
    });
    if (demoErr) console.error('Demographics Err:', demoErr);

    // 3. Vitals
    const { error: vitalsErr } = await supabase.from('medical_records').insert({
      patient_id: p.id,
      doctor_id: doctorId,
      record_type: 'vitals',
      description: JSON.stringify(p.vitals),
      record_date: new Date().toISOString().split('T')[0]
    });
    if (vitalsErr) console.error('Vitals Err:', vitalsErr);

    // 4. Appointment
    const { error: apptErr } = await supabase.from('appointments').insert({
      patient_id: p.id,
      doctor_id: doctorId,
      scheduled_time: p.time,
      status: p.status
    });
    if (apptErr) console.error('Appointment Err:', apptErr);
  }

  console.log('Done seeding!');
}

run();
