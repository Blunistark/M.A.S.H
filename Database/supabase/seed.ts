import { supabase } from './supabase';

const DOCTOR_ID = 'a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd';

const PATIENTS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'John Doe',
    age: 45,
    dob: '12/05/1978',
    gender: 'Male',
    bloodType: 'O+',
    phone: '(555) 123-4567',
    email: 'john.doe@email.com',
    address: '123 Maple St, NY',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    initials: 'JD',
    time: '12:00 PM',
    status: 'Waiting',
    allergies: [
      { name: 'Penicillin', severity: 'Anaphylaxis' },
      { name: 'Shellfish', severity: 'Hives' }
    ],
    chronicConditions: [
      'Hypertension (Controlled)',
      'Type 2 Diabetes (Diet controlled)',
      'Hyperlipidemia'
    ],
    vitals: { bp: '120/80', hr: '72 bpm', weight: '185 lbs' },
    pastTests: [
      { date: 'Oct 12, 2023', name: 'Complete Blood Count (CBC)', result: 'Normal', resultClass: 'normal' },
      { date: 'Sep 05, 2023', name: 'Lipid Panel', result: 'Elevated', resultClass: 'elevated' },
      { date: 'Jan 22, 2023', name: 'ECG', result: 'Normal', resultClass: 'normal' }
    ],
    surgicalHistory: [
      { name: 'Appendectomy', date: 'Mar 2015', description: 'Uncomplicated laparoscopic removal. Full recovery noted.', checked: false },
      { name: 'Knee Arthroscopy (Right)', date: 'Nov 2008', description: 'Meniscus repair. Physical therapy completed successfully.', checked: true }
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Alice Johnson',
    age: 34,
    dob: '04/18/1992',
    gender: 'Female',
    bloodType: 'A+',
    phone: '(555) 987-6543',
    email: 'alice.j@email.com',
    address: '456 Oak Ave, Brooklyn, NY',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    initials: 'AJ',
    time: '09:00 AM',
    status: 'In Progress',
    allergies: [
      { name: 'Sulfa Drugs', severity: 'Rash' }
    ],
    chronicConditions: [
      'Asthma (Mild intermittent)'
    ],
    vitals: { bp: '115/75', hr: '68 bpm', weight: '135 lbs' },
    pastTests: [
      { date: 'Nov 02, 2023', name: 'Spirometry Pulmonary Function', result: 'Normal', resultClass: 'normal' }
    ],
    surgicalHistory: []
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Bob Smith',
    age: 61,
    dob: '08/22/1964',
    gender: 'Male',
    bloodType: 'B-',
    phone: '(555) 456-7890',
    email: 'bob.smith@email.com',
    address: '789 Pine Rd, Queens, NY',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    initials: 'BS',
    time: '10:30 AM',
    status: 'Waiting',
    allergies: [],
    chronicConditions: [
      'Gastroesophageal Reflux Disease (GERD)',
      'Osteoarthritis'
    ],
    vitals: { bp: '128/82', hr: '76 bpm', weight: '210 lbs' },
    pastTests: [
      { date: 'Dec 15, 2023', name: 'Basic Metabolic Panel (BMP)', result: 'Normal', resultClass: 'normal' }
    ],
    surgicalHistory: [
      { name: 'Gallbladder Removal', date: 'Jun 2018', description: 'Laparoscopic cholecystectomy. Recovered without complications.', checked: true }
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Carol Davis',
    age: 52,
    dob: '11/03/1973',
    gender: 'Female',
    bloodType: 'AB+',
    phone: '(555) 321-7654',
    email: 'carol.d@email.com',
    address: '321 Elm St, Staten Island, NY',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    initials: 'CD',
    time: '11:15 AM',
    status: 'Waiting',
    allergies: [
      { name: 'Aspirin', severity: 'Angioedema' }
    ],
    chronicConditions: [
      'Hypothyroidism'
    ],
    vitals: { bp: '118/76', hr: '64 bpm', weight: '155 lbs' },
    pastTests: [
      { date: 'Aug 14, 2023', name: 'TSH Thyroid Panel', result: 'Normal', resultClass: 'normal' }
    ],
    surgicalHistory: []
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Evan Wright',
    age: 29,
    dob: '02/14/1997',
    gender: 'Male',
    bloodType: 'O-',
    phone: '(555) 789-0123',
    email: 'evan.wright@email.com',
    address: '567 Birch Blvd, Bronx, NY',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300',
    initials: 'EW',
    time: '08:00 AM',
    status: 'Done',
    allergies: [],
    chronicConditions: [],
    vitals: { bp: '110/70', hr: '60 bpm', weight: '168 lbs' },
    pastTests: [
      { date: 'Jan 05, 2024', name: 'Annual Blood Chemistry', result: 'Normal', resultClass: 'normal' }
    ],
    surgicalHistory: []
  }
];

const MEDICINES = [
  { id: '9f9d7df9-7be8-466d-9642-882200110001', name: 'Amoxicillin 500mg Capsule', stock: 120 },
  { id: '9f9d7df9-7be8-466d-9642-882200110002', name: 'Lisinopril 10mg Tablet', stock: 0 },
  { id: '9f9d7df9-7be8-466d-9642-882200110003', name: 'Atorvastatin 20mg Tablet', stock: 85 },
  { id: '9f9d7df9-7be8-466d-9642-882200110004', name: 'Metformin 500mg Tablet', stock: 150 },
  { id: '9f9d7df9-7be8-466d-9642-882200110005', name: 'Albuterol HFA', stock: 40 },
  { id: '9f9d7df9-7be8-466d-9642-882200110006', name: 'Omeprazole 20mg Capsule', stock: 65 },
  { id: '9f9d7df9-7be8-466d-9642-882200110007', name: 'Levothyroxine 75mcg Tablet', stock: 95 }
];

async function seed() {
  console.log('Cleaning up existing data...');
  
  // Wipe prescription items, prescriptions, medical records, appointments, doctor details, profiles, medicine inventory
  await supabase.from('prescription_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('prescriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('medical_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('doctor_details').delete().neq('doctor_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('medicine_inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Inserting doctor profile...');
  const { error: docProfileErr } = await supabase.from('profiles').insert({
    id: DOCTOR_ID,
    full_name: 'Dr. Smith',
    role: 'doctor',
    contact_number: '(555) 019-2834'
  });
  if (docProfileErr) throw docProfileErr;

  const { error: docDetailErr } = await supabase.from('doctor_details').insert({
    doctor_id: DOCTOR_ID,
    specialty: 'Cardiologist',
    room_number: 'Room 4B',
    is_available: true
  });
  if (docDetailErr) throw docDetailErr;

  console.log('Inserting medicine inventory...');
  for (const med of MEDICINES) {
    const { error } = await supabase.from('medicine_inventory').insert({
      id: med.id,
      medicine_name: med.name,
      current_stock: med.stock,
      reorder_threshold: 10,
      repeatedly_used: true
    });
    if (error) throw error;
  }

  console.log('Inserting patients and medical records...');
  for (const p of PATIENTS) {
    // 1. Insert Profile
    const { error: pErr } = await supabase.from('profiles').insert({
      id: p.id,
      full_name: p.name,
      role: 'patient',
      contact_number: p.phone
    });
    if (pErr) throw pErr;

    // 2. Insert Demographics Record
    const { error: demoErr } = await supabase.from('medical_records').insert({
      patient_id: p.id,
      doctor_id: DOCTOR_ID,
      record_type: 'demographics',
      description: JSON.stringify({
        dob: p.dob,
        gender: p.gender,
        bloodType: p.bloodType,
        photo: p.photo,
        age: p.age,
        address: p.address,
        email: p.email,
        initials: p.initials
      }),
      record_date: new Date().toISOString().split('T')[0]
    });
    if (demoErr) throw demoErr;

    // 3. Insert Vitals Record
    const { error: vitalsErr } = await supabase.from('medical_records').insert({
      patient_id: p.id,
      doctor_id: DOCTOR_ID,
      record_type: 'vitals',
      description: JSON.stringify(p.vitals),
      record_date: new Date().toISOString().split('T')[0]
    });
    if (vitalsErr) throw vitalsErr;

    // 4. Insert Allergies
    for (const allergy of p.allergies) {
      const { error } = await supabase.from('medical_records').insert({
        patient_id: p.id,
        doctor_id: DOCTOR_ID,
        record_type: 'allergy',
        description: JSON.stringify(allergy),
        record_date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
    }

    // 5. Insert Chronic Conditions
    for (const cond of p.chronicConditions) {
      const { error } = await supabase.from('medical_records').insert({
        patient_id: p.id,
        doctor_id: DOCTOR_ID,
        record_type: 'chronic_condition',
        description: cond,
        record_date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
    }

    // 6. Insert Past Tests
    for (const test of p.pastTests) {
      const { error } = await supabase.from('medical_records').insert({
        patient_id: p.id,
        doctor_id: DOCTOR_ID,
        record_type: 'test_result',
        description: JSON.stringify(test),
        record_date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
    }

    // 7. Insert Surgical History
    for (const surg of p.surgicalHistory) {
      const { error } = await supabase.from('medical_records').insert({
        patient_id: p.id,
        doctor_id: DOCTOR_ID,
        record_type: 'surgical_history',
        description: JSON.stringify(surg),
        record_date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
    }

    // 8. Insert Appointment if scheduled
    if (p.time) {
      const time24 = formatTimeTo24(p.time);
      const scheduledTime = `2026-06-14T${time24}:00.000Z`;
      
      const { error: apptErr } = await supabase.from('appointments').insert({
        patient_id: p.id,
        doctor_id: DOCTOR_ID,
        scheduled_time: scheduledTime,
        status: mapStatus(p.status)
      });
      if (apptErr) throw apptErr;
    }
  }

  // Create default prescription for John Doe (Penicillin, Lisinopril, Atorvastatin)
  console.log('Inserting initial prescriptions...');
  const johnDoeId = '550e8400-e29b-41d4-a716-446655440000';
  const rxId = 'd8e3d8f8-8bb8-4e8c-bb01-e22200330001';
  
  const { error: rxErr } = await supabase.from('prescriptions').insert({
    id: rxId,
    patient_id: johnDoeId,
    doctor_id: DOCTOR_ID,
    status: 'active',
    doctor_comments: 'Take medications as directed.'
  });
  if (rxErr) throw rxErr;

  const rxItems = [
    { prescription_id: rxId, medicine_id: '9f9d7df9-7be8-466d-9642-882200110001', dosage: '500mg - 1 cap TID', quantity: 30 },
    { prescription_id: rxId, medicine_id: '9f9d7df9-7be8-466d-9642-882200110002', dosage: '10mg - 1 tab QD', quantity: 30 },
    { prescription_id: rxId, medicine_id: '9f9d7df9-7be8-466d-9642-882200110003', dosage: '20mg - 1 tab QHS', quantity: 90 }
  ];

  for (const item of rxItems) {
    const { error } = await supabase.from('prescription_items').insert(item);
    if (error) throw error;
  }

  console.log('Seeding completed successfully!');
}

function formatTimeTo24(timeStr: string): string {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = (parseInt(hours, 10) + 12).toString().padStart(2, '0');
  } else {
    hours = hours.padStart(2, '0');
  }
  return `${hours}:${minutes}`;
}

function mapStatus(status?: string): string {
  if (status === 'In Progress') return 'in_progress';
  if (status === 'Done') return 'completed';
  return 'pending'; // Default for 'Waiting'
}

seed().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
