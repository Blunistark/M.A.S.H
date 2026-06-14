export interface Patient {
  id: string;
  name: string;
  age: number;
  dob: string;
  gender: string;
  bloodType: string;
  phone: string;
  email: string;
  address: string;
  photo: string;
  initials: string;
  time?: string;
  status?: 'In Progress' | 'Waiting' | 'Done';
  careTeam?: { name: string; role: string; avatar: string; active?: boolean }[];
  chronicConditions?: string[];
  allergies?: { name: string; severity: string }[];
  medications?: { name: string; dosage: string; active: boolean }[];
  vitals?: { bp: string; hr: string; weight: string };
  pastTests?: { date: string; name: string; result: string; resultClass: 'normal' | 'elevated' }[];
  surgicalHistory?: { name: string; date: string; description: string; checked?: boolean }[];
}

export const mockPatients: Patient[] = [
  {
    id: 'john-doe',
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
    careTeam: [
      {
        name: 'Dr. Smith',
        role: 'Primary Care',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
        active: true
      },
      {
        name: 'Dr. Sarah Chen',
        role: 'Cardiologist',
        avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150',
        active: false
      }
    ],
    chronicConditions: [
      'Hypertension (Controlled)',
      'Type 2 Diabetes (Diet controlled)',
      'Hyperlipidemia'
    ],
    allergies: [
      { name: 'Penicillin', severity: 'Anaphylaxis' },
      { name: 'Shellfish', severity: 'Hives' }
    ],
    medications: [
      { name: 'Lisinopril', dosage: '10mg - Once daily', active: true },
      { name: 'Metformin', dosage: '500mg - Twice daily', active: true }
    ],
    vitals: {
      bp: '120/80',
      hr: '72 bpm',
      weight: '185 lbs'
    },
    pastTests: [
      { date: 'Oct 12, 2023', name: 'Complete Blood Count (CBC)', result: 'Normal', resultClass: 'normal' },
      { date: 'Sep 05, 2023', name: 'Lipid Panel', result: 'Elevated', resultClass: 'elevated' },
      { date: 'Jan 22, 2023', name: 'ECG', result: 'Normal', resultClass: 'normal' }
    ],
    surgicalHistory: [
      {
        name: 'Appendectomy',
        date: 'Mar 2015',
        description: 'Uncomplicated laparoscopic removal. Full recovery noted.',
        checked: false
      },
      {
        name: 'Knee Arthroscopy (Right)',
        date: 'Nov 2008',
        description: 'Meniscus repair. Physical therapy completed successfully.',
        checked: true
      }
    ]
  },
  {
    id: 'alice-johnson',
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
    careTeam: [
      {
        name: 'Dr. Smith',
        role: 'Primary Care',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
        active: true
      }
    ],
    chronicConditions: [
      'Asthma (Mild intermittent)'
    ],
    allergies: [
      { name: 'Sulfa Drugs', severity: 'Rash' }
    ],
    medications: [
      { name: 'Albuterol HFA', dosage: '90mcg - As needed', active: true }
    ],
    vitals: {
      bp: '115/75',
      hr: '68 bpm',
      weight: '135 lbs'
    },
    pastTests: [
      { date: 'Nov 02, 2023', name: 'Spirometry Pulmonary Function', result: 'Normal', resultClass: 'normal' }
    ],
    surgicalHistory: []
  },
  {
    id: 'bob-smith',
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
    careTeam: [
      {
        name: 'Dr. Smith',
        role: 'Primary Care',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
        active: true
      }
    ],
    chronicConditions: [
      'Gastroesophageal Reflux Disease (GERD)',
      'Osteoarthritis'
    ],
    allergies: [],
    medications: [
      { name: 'Omeprazole', dosage: '20mg - Once daily', active: true }
    ],
    vitals: {
      bp: '128/82',
      hr: '76 bpm',
      weight: '210 lbs'
    },
    pastTests: [
      { date: 'Dec 15, 2023', name: 'Basic Metabolic Panel (BMP)', result: 'Normal', resultClass: 'normal' }
    ],
    surgicalHistory: [
      {
        name: 'Gallbladder Removal',
        date: 'Jun 2018',
        description: 'Laparoscopic cholecystectomy. Recovered without complications.',
        checked: true
      }
    ]
  },
  {
    id: 'carol-davis',
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
    careTeam: [
      {
        name: 'Dr. Smith',
        role: 'Primary Care',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
        active: true
      }
    ],
    chronicConditions: [
      'Hypothyroidism'
    ],
    allergies: [
      { name: 'Aspirin', severity: 'Angioedema' }
    ],
    medications: [
      { name: 'Levothyroxine', dosage: '75mcg - Once daily', active: true }
    ],
    vitals: {
      bp: '118/76',
      hr: '64 bpm',
      weight: '155 lbs'
    },
    pastTests: [
      { date: 'Aug 14, 2023', name: 'TSH Thyroid Panel', result: 'Normal', resultClass: 'normal' }
    ],
    surgicalHistory: []
  },
  {
    id: 'evan-wright',
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
    careTeam: [
      {
        name: 'Dr. Smith',
        role: 'Primary Care',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
        active: true
      }
    ],
    chronicConditions: [],
    allergies: [],
    medications: [],
    vitals: {
      bp: '110/70',
      hr: '60 bpm',
      weight: '168 lbs'
    },
    pastTests: [
      { date: 'Jan 05, 2024', name: 'Annual Blood Chemistry', result: 'Normal', resultClass: 'normal' }
    ],
    surgicalHistory: []
  }
];

export interface DashboardMetrics {
  todayAppointmentsCount: number;
  remainingAppointmentsCount: number;
  pendingReschedulesCount: number;
  notificationsCount: number;
  stockAlertsCount: number;
}

export const initialMetrics: DashboardMetrics = {
  todayAppointmentsCount: 12,
  remainingAppointmentsCount: 8,
  pendingReschedulesCount: 3,
  notificationsCount: 8,
  stockAlertsCount: 2
};
