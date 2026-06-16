import { supabase } from './supabase';
import { randomUUID } from 'crypto';

// Medicines list with exact IDs matching frontend cache
const MEDICINES = [
  { id: '9f9d7df9-7be8-466d-9642-882200110001', name: 'Amoxicillin 500mg Capsule', stock: 120 },
  { id: '9f9d7df9-7be8-466d-9642-882200110002', name: 'Lisinopril 10mg Tablet', stock: 0 },
  { id: '9f9d7df9-7be8-466d-9642-882200110003', name: 'Atorvastatin 20mg Tablet', stock: 85 },
  { id: '9f9d7df9-7be8-466d-9642-882200110004', name: 'Metformin 500mg Tablet', stock: 150 },
  { id: '9f9d7df9-7be8-466d-9642-882200110005', name: 'Albuterol HFA', stock: 40 },
  { id: '9f9d7df9-7be8-466d-9642-882200110006', name: 'Omeprazole 20mg Capsule', stock: 65 },
  { id: '9f9d7df9-7be8-466d-9642-882200110007', name: 'Levothyroxine 75mcg Tablet', stock: 95 }
];

const SPECIALTIES = [
  'Cardiology', 'Pediatrics', 'Dermatology', 'Neurology', 'Orthopedics',
  'Oncology', 'Psychiatry', 'Endocrinology', 'Gastroenterology', 'Ophthalmology',
  'General Medicine', 'General Surgery', 'Nephrology', 'Pulmonology', 'Rheumatology',
  'Urology', 'Gynecology', 'Otolaryngology', 'Hematology', 'Geriatrics'
];

const FIRST_NAMES_MALE = [
  'Liam', 'Noah', 'Oliver', 'James', 'Elijah', 'William', 'Henry', 'Lucas', 'Benjamin', 'Theodore',
  'Mateo', 'Levi', 'Sebastian', 'Daniel', 'Jack', 'Wyatt', 'Carter', 'Julian', 'Grayson', 'Alexander',
  'Luke', 'Gabriel', 'Anthony', 'Dylan', 'Leo', 'Max', 'Ethan', 'Ryan', 'Jacob', 'Michael',
  'David', 'Samuel', 'Joseph', 'John', 'Owen', 'Jackson', 'Aiden', 'Matthew', 'Christian', 'Andrew'
];

const FIRST_NAMES_FEMALE = [
  'Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia', 'Isabella', 'Ava', 'Mia', 'Evelyn', 'Harper',
  'Luna', 'Camila', 'Gianna', 'Elizabeth', 'Eleanor', 'Ella', 'Abigail', 'Sofia', 'Avery', 'Scarlett',
  'Emily', 'Aria', 'Penelope', 'Chloe', 'Layla', 'Grace', 'Lily', 'Sarah', 'Victoria', 'Madison',
  'Zoe', 'Stella', 'Hazel', 'Natalie', 'Leah', 'Audrey', 'Lucy', 'Anna', 'Caroline', 'Maya'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const ALLERGIES_LIST = [
  { name: 'Penicillin', severity: 'Anaphylaxis' },
  { name: 'Shellfish', severity: 'Hives' },
  { name: 'Sulfa Drugs', severity: 'Rash' },
  { name: 'Aspirin', severity: 'Angioedema' },
  { name: 'Peanuts', severity: 'Anaphylaxis' },
  { name: 'Pollen', severity: 'Sneezing/Itchy Eyes' },
  { name: 'Latex', severity: 'Contact Dermatitis' }
];

const CHRONIC_CONDITIONS_LIST = [
  'Hypertension (Controlled)',
  'Type 2 Diabetes (Diet controlled)',
  'Hyperlipidemia',
  'Asthma (Mild intermittent)',
  'Hypothyroidism',
  'Gastroesophageal Reflux Disease (GERD)',
  'Osteoarthritis',
  'Migraine (Chronic)',
  'Generalized Anxiety Disorder (GAD)'
];

const TESTS_LIST = [
  { name: 'Complete Blood Count (CBC)', result: 'Normal', resultClass: 'normal' },
  { name: 'Lipid Panel', result: 'Elevated', resultClass: 'elevated' },
  { name: 'ECG / Electrocardiogram', result: 'Normal', resultClass: 'normal' },
  { name: 'Basic Metabolic Panel (BMP)', result: 'Normal', resultClass: 'normal' },
  { name: 'TSH Thyroid Panel', result: 'Normal', resultClass: 'normal' },
  { name: 'HbA1c Glycated Hemoglobin', result: 'Normal', resultClass: 'normal' },
  { name: 'Liver Function Panel', result: 'Normal', resultClass: 'normal' },
  { name: 'Urinalysis', result: 'Normal', resultClass: 'normal' }
];

const SURGERIES_LIST = [
  { name: 'Appendectomy', description: 'Uncomplicated laparoscopic removal. Full recovery.' },
  { name: 'Knee Arthroscopy (Right)', description: 'Meniscus repair. Physical therapy completed.' },
  { name: 'Gallbladder Removal', description: 'Laparoscopic cholecystectomy. Recovered without complications.' },
  { name: 'Tonsillectomy', description: 'Bilateral tonsillectomy in childhood. No issues.' },
  { name: 'Inguinal Hernia Repair', description: 'Open repair with mesh. Satisfactory healing.' }
];

// Validated database enums for appointment_status
const STATUS_LIST = ['scheduled', 'rescheduled', 'completed', 'cancelled'];

// Validated database enums for prescription_status
const RX_STATUS_LIST = ['pushed_to_pharma', 'alternative_requested', 'pending_check', 'fulfilled'];

const DOSAGES = [
  '500mg - 1 cap TID',
  '10mg - 1 tab QD',
  '20mg - 1 tab QHS',
  '500mg - 1 tab BID',
  '2 puffs Q6H PRN',
  '20mg - 1 cap QD AC',
  '75mcg - 1 tab QD AC'
];

// Random helpers
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate Unsplash profile photos
function getRandomPhoto(gender: string): string {
  const malePhotos = [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300'
  ];
  const femalePhotos = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=300'
  ];
  return gender.toLowerCase() === 'female' ? getRandomElement(femalePhotos) : getRandomElement(malePhotos);
}

async function seed() {
  console.log('Cleaning up existing data...');
  
  // Wipe child records first, then parent records
  await supabase.from('prescription_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('prescriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('medical_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('doctor_details').delete().neq('doctor_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('medicine_inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Inserting medicine inventory...');
  const medicineInserts = MEDICINES.map(med => ({
    id: med.id,
    medicine_name: med.name,
    current_stock: med.stock,
    reorder_threshold: 10,
    repeatedly_used: true
  }));
  const { error: medErr } = await supabase.from('medicine_inventory').insert(medicineInserts);
  if (medErr) throw medErr;

  console.log('Generating 20 doctor records...');
  const profiles: any[] = [];
  const doctorDetails: any[] = [];
  const doctorIds: string[] = [];

  // Hardcoded doctor to avoid frontend UI constraint issues
  const primaryDocId = '22222222-2222-2222-2222-222222222222';
  doctorIds.push(primaryDocId);
  profiles.push({
    id: primaryDocId,
    full_name: 'Dr. Anita Desai',
    role: 'doctor',
    contact_number: '(555) 019-2834'
  });
  doctorDetails.push({
    doctor_id: primaryDocId,
    specialty: 'Cardiology',
    room_number: 'Wing B, Room 402',
    is_available: true
  });

  // Generate 19 more doctors
  for (let i = 1; i < 20; i++) {
    const isFemale = Math.random() > 0.5;
    const fName = getRandomElement(isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE);
    const lName = getRandomElement(LAST_NAMES);
    const docId = randomUUID();
    doctorIds.push(docId);
    
    profiles.push({
      id: docId,
      full_name: `Dr. ${fName} ${lName}`,
      role: 'doctor',
      contact_number: `(555) ${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`
    });

    doctorDetails.push({
      doctor_id: docId,
      specialty: SPECIALTIES[i % SPECIALTIES.length],
      room_number: `Building ${getRandomElement(['A', 'B', 'C'])}, Room ${getRandomInt(100, 500)}`,
      is_available: Math.random() > 0.15
    });
  }

  console.log('Generating 90 patient records...');
  const patientIds: string[] = [];
  const patientNames: string[] = [];
  const patientPhones: string[] = [];

  for (let i = 0; i < 90; i++) {
    const isFemale = Math.random() > 0.5;
    const fName = getRandomElement(isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE);
    const lName = getRandomElement(LAST_NAMES);
    const pId = randomUUID();
    const phone = `(555) ${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`;
    const fullName = `${fName} ${lName}`;

    patientIds.push(pId);
    patientNames.push(fullName);
    patientPhones.push(phone);

    profiles.push({
      id: pId,
      full_name: fullName,
      role: 'patient',
      contact_number: phone
    });
  }

  // Bulk insert all profiles (doctors & patients)
  console.log(`Inserting ${profiles.length} profiles into DB...`);
  const { error: profsErr } = await supabase.from('profiles').insert(profiles);
  if (profsErr) throw profsErr;

  // Bulk insert doctor details
  console.log(`Inserting ${doctorDetails.length} doctor details into DB...`);
  const { error: docsErr } = await supabase.from('doctor_details').insert(doctorDetails);
  if (docsErr) throw docsErr;

  console.log('Generating medical records, appointments, and prescriptions...');
  const medicalRecords: any[] = [];
  const appointments: any[] = [];
  const prescriptions: any[] = [];
  const prescriptionItems: any[] = [];

  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 90; i++) {
    const pId = patientIds[i];
    const fullName = patientNames[i];
    const phone = patientPhones[i];
    const assocDocId = getRandomElement(doctorIds); // Assign a primary doctor for this patient's records

    const gender = Math.random() > 0.5 ? 'Female' : 'Male';
    const age = getRandomInt(18, 85);
    const birthYear = new Date().getFullYear() - age;
    const dob = `${getRandomInt(1, 12).toString().padStart(2, '0')}/${getRandomInt(1, 28).toString().padStart(2, '0')}/${birthYear}`;
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    const email = `${fullName.toLowerCase().replace(/\s+/g, '.')}@email.com`;
    const bloodType = getRandomElement(BLOOD_TYPES);
    const address = `${getRandomInt(100, 999)} ${getRandomElement(['Maple St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Birch Blvd'])}, New York, NY`;
    const photo = getRandomPhoto(gender);

    // 1. Demographics Record
    medicalRecords.push({
      patient_id: pId,
      doctor_id: assocDocId,
      record_type: 'demographics',
      description: JSON.stringify({
        dob,
        gender,
        bloodType,
        photo,
        age,
        address,
        email,
        initials
      }),
      record_date: todayStr
    });

    // 2. Vitals Record
    const bpSystolic = getRandomInt(110, 138);
    const bpDiastolic = getRandomInt(68, 88);
    const hr = getRandomInt(60, 92);
    const weight = getRandomInt(110, 230);
    medicalRecords.push({
      patient_id: pId,
      doctor_id: assocDocId,
      record_type: 'vitals',
      description: JSON.stringify({
        bp: `${bpSystolic}/${bpDiastolic}`,
        hr: `${hr} bpm`,
        weight: `${weight} lbs`
      }),
      record_date: todayStr
    });

    // 3. Allergies (0 to 2 per patient)
    const numAllergies = getRandomInt(0, 2);
    if (numAllergies > 0) {
      const selectedAllergies = getRandomElements(ALLERGIES_LIST, numAllergies);
      for (const allergy of selectedAllergies) {
        medicalRecords.push({
          patient_id: pId,
          doctor_id: assocDocId,
          record_type: 'allergy',
          description: JSON.stringify(allergy),
          record_date: todayStr
        });
      }
    }

    // 4. Chronic Conditions (0 to 2 per patient)
    const numConditions = getRandomInt(0, 2);
    if (numConditions > 0) {
      const selectedConditions = getRandomElements(CHRONIC_CONDITIONS_LIST, numConditions);
      for (const cond of selectedConditions) {
        medicalRecords.push({
          patient_id: pId,
          doctor_id: assocDocId,
          record_type: 'chronic_condition',
          description: cond,
          record_date: todayStr
        });
      }
    }

    // 5. Past Tests (1 to 3 per patient)
    const numTests = getRandomInt(1, 3);
    const selectedTests = getRandomElements(TESTS_LIST, numTests);
    const testDates = ['Oct 12, 2025', 'Nov 02, 2025', 'Dec 15, 2025', 'Jan 05, 2026', 'Feb 14, 2026', 'Mar 20, 2026'];
    for (let t = 0; t < selectedTests.length; t++) {
      const test = selectedTests[t];
      medicalRecords.push({
        patient_id: pId,
        doctor_id: assocDocId,
        record_type: 'test_result',
        description: JSON.stringify({
          date: testDates[t % testDates.length],
          name: test.name,
          result: test.result,
          resultClass: test.resultClass
        }),
        record_date: todayStr
      });
    }

    // 6. Surgical History (0 to 1 per patient)
    if (Math.random() > 0.6) {
      const surgery = getRandomElement(SURGERIES_LIST);
      const surgeryYear = getRandomInt(2010, 2025);
      const surgeryMonths = ['Jan', 'Mar', 'Jun', 'Aug', 'Nov'];
      medicalRecords.push({
        patient_id: pId,
        doctor_id: assocDocId,
        record_type: 'surgical_history',
        description: JSON.stringify({
          name: surgery.name,
          date: `${getRandomElement(surgeryMonths)} ${surgeryYear}`,
          description: surgery.description,
          checked: Math.random() > 0.5
        }),
        record_date: todayStr
      });
    }

    // 7. Appointment (scheduled on today's date at various times)
    const apptHour = getRandomInt(8, 17); // 8 AM to 5 PM
    const apptMin = getRandomElement([0, 15, 30, 45]);
    const scheduledTime = new Date();
    scheduledTime.setHours(apptHour, apptMin, 0, 0);

    appointments.push({
      patient_id: pId,
      doctor_id: assocDocId,
      scheduled_time: scheduledTime.toISOString(),
      status: getRandomElement(STATUS_LIST)
    });

    // 8. Prescription (50% chance of prescription)
    if (Math.random() > 0.5) {
      const rxId = randomUUID();
      prescriptions.push({
        id: rxId,
        patient_id: pId,
        doctor_id: assocDocId,
        status: getRandomElement(RX_STATUS_LIST),
        doctor_comments: 'Patient to follow up in 2 weeks.'
      });

      // Prescription items (1 to 2 items)
      const numItems = getRandomInt(1, 2);
      const selectedMeds = getRandomElements(MEDICINES, numItems);
      for (const med of selectedMeds) {
        prescriptionItems.push({
          prescription_id: rxId,
          medicine_id: med.id,
          dosage: getRandomElement(DOSAGES),
          quantity: getRandomInt(10, 90)
        });
      }
    }
  }

  // Bulk insert medical records (chunks of 100 to avoid limits)
  console.log(`Inserting ${medicalRecords.length} medical records...`);
  for (let k = 0; k < medicalRecords.length; k += 100) {
    const chunk = medicalRecords.slice(k, k + 100);
    const { error: mrErr } = await supabase.from('medical_records').insert(chunk);
    if (mrErr) throw mrErr;
  }

  // Bulk insert appointments
  console.log(`Inserting ${appointments.length} appointments...`);
  const { error: apptErr } = await supabase.from('appointments').insert(appointments);
  if (apptErr) throw apptErr;

  // Bulk insert prescriptions
  if (prescriptions.length > 0) {
    console.log(`Inserting ${prescriptions.length} prescriptions...`);
    const { error: rxErr } = await supabase.from('prescriptions').insert(prescriptions);
    if (rxErr) throw rxErr;
  }

  // Bulk insert prescription items
  if (prescriptionItems.length > 0) {
    console.log(`Inserting ${prescriptionItems.length} prescription items...`);
    const { error: rxItemsErr } = await supabase.from('prescription_items').insert(prescriptionItems);
    if (rxItemsErr) throw rxItemsErr;
  }

  console.log('Seeding completed successfully!');
}

seed().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
