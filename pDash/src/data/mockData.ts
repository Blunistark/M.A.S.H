// ─── Type Definitions ────────────────────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  availability: 'available' | 'busy' | 'off-duty';
  room: string;
  avatar: string;
  nextSlot: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  room: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  type: string;
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  endDate: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  bloodGroup: string;
  phone: string;
  email: string;
  emergencyContact: string;
  insurance: string;
}

export interface NavStep {
  instruction: string;
  distance: string;
}

export interface NavRoute {
  destination: string;
  room: string;
  estimatedTime: string;
  pathData: string;
  steps: NavStep[];
}

// ─── Mock Doctors ────────────────────────────────────────────────

export const mockDoctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Smith',
    specialty: 'Cardiologist',
    availability: 'available',
    room: '102',
    avatar: '👩‍⚕️',
    nextSlot: 'Today, 2:30 PM',
  },
  {
    id: 'doc-2',
    name: 'Dr. Michael Jones',
    specialty: 'Neurologist',
    availability: 'busy',
    room: '103',
    avatar: '👨‍⚕️',
    nextSlot: 'Tomorrow, 10:00 AM',
  },
  {
    id: 'doc-3',
    name: 'Dr. Emily Chen',
    specialty: 'Dermatologist',
    availability: 'available',
    room: '101',
    avatar: '👩‍⚕️',
    nextSlot: 'Today, 4:00 PM',
  },
  {
    id: 'doc-4',
    name: 'Dr. James Wilson',
    specialty: 'Orthopedic Surgeon',
    availability: 'off-duty',
    room: '102',
    avatar: '👨‍⚕️',
    nextSlot: 'Mon, 9:00 AM',
  },
  {
    id: 'doc-5',
    name: 'Dr. Priya Patel',
    specialty: 'Pediatrician',
    availability: 'available',
    room: '101',
    avatar: '👩‍⚕️',
    nextSlot: 'Today, 3:15 PM',
  },
];

// ─── Mock Appointments ───────────────────────────────────────────

export const mockAppointments: Appointment[] = [
  {
    id: 'apt-1',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Smith',
    specialty: 'Cardiologist',
    date: '2026-06-20',
    time: '2:30 PM',
    room: '102',
    status: 'upcoming',
    type: 'Follow-up',
  },
  {
    id: 'apt-2',
    doctorId: 'doc-3',
    doctorName: 'Dr. Emily Chen',
    specialty: 'Dermatologist',
    date: '2026-06-22',
    time: '4:00 PM',
    room: '101',
    status: 'upcoming',
    type: 'Consultation',
  },
  {
    id: 'apt-3',
    doctorId: 'doc-2',
    doctorName: 'Dr. Michael Jones',
    specialty: 'Neurologist',
    date: '2026-06-10',
    time: '11:00 AM',
    room: '103',
    status: 'completed',
    type: 'Check-up',
  },
  {
    id: 'apt-4',
    doctorId: 'doc-5',
    doctorName: 'Dr. Priya Patel',
    specialty: 'Pediatrician',
    date: '2026-06-05',
    time: '9:30 AM',
    room: '101',
    status: 'completed',
    type: 'Vaccination',
  },
  {
    id: 'apt-5',
    doctorId: 'doc-4',
    doctorName: 'Dr. James Wilson',
    specialty: 'Orthopedic Surgeon',
    date: '2026-06-01',
    time: '10:00 AM',
    room: '102',
    status: 'cancelled',
    type: 'Surgery Consult',
  },
];

// ─── Mock Prescriptions ─────────────────────────────────────────

export const mockPrescriptions: Prescription[] = [
  {
    id: 'rx-1',
    medication: 'Amlodipine',
    dosage: '5mg',
    frequency: 'Once daily',
    prescribedBy: 'Dr. Sarah Smith',
    startDate: '2026-06-10',
    endDate: '2026-07-10',
  },
  {
    id: 'rx-2',
    medication: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    prescribedBy: 'Dr. Michael Jones',
    startDate: '2026-06-01',
    endDate: '2026-08-01',
  },
  {
    id: 'rx-3',
    medication: 'Cetirizine',
    dosage: '10mg',
    frequency: 'Once daily (night)',
    prescribedBy: 'Dr. Emily Chen',
    startDate: '2026-06-15',
    endDate: '2026-06-30',
  },
];

// ─── Mock Patient Profile ────────────────────────────────────────

export const mockPatientProfile: PatientProfile = {
  id: 'PAT-2026-0847',
  name: 'Alex Johnson',
  age: 32,
  bloodGroup: 'O+',
  phone: '+1 (555) 012-3456',
  email: 'alex.johnson@email.com',
  emergencyContact: 'Maria Johnson — +1 (555) 789-0123',
  insurance: 'BlueCross Shield — Plan Gold',
};

// ─── Mock Navigation Routes ─────────────────────────────────────

export const mockNavRoutes: Record<string, NavRoute> = {
  '101': {
    destination: 'Room 101',
    room: '101',
    estimatedTime: '2 min',
    pathData: 'M 60 280 L 60 200 L 200 200 L 200 100',
    steps: [
      { instruction: 'Walk straight from the entrance', distance: '20m' },
      { instruction: 'Turn right at the main corridor', distance: '15m' },
      { instruction: 'Room 101 is on your right', distance: '5m' },
    ],
  },
  '102': {
    destination: 'Room 102',
    room: '102',
    estimatedTime: '3 min',
    pathData: 'M 60 280 L 60 200 L 200 200 L 200 170',
    steps: [
      { instruction: 'Walk straight from the entrance', distance: '20m' },
      { instruction: 'Turn right at the main corridor', distance: '15m' },
      { instruction: 'Continue past Room 101', distance: '10m' },
      { instruction: 'Room 102 is on your right', distance: '5m' },
    ],
  },
  '103': {
    destination: 'Room 103',
    room: '103',
    estimatedTime: '4 min',
    pathData: 'M 60 280 L 60 200 L 200 200 L 200 240',
    steps: [
      { instruction: 'Walk straight from the entrance', distance: '20m' },
      { instruction: 'Turn right at the main corridor', distance: '15m' },
      { instruction: 'Continue past Rooms 101 and 102', distance: '15m' },
      { instruction: 'Room 103 is on your right', distance: '5m' },
    ],
  },
  pharmacy: {
    destination: 'Pharmacy',
    room: 'Pharmacy',
    estimatedTime: '5 min',
    pathData: 'M 60 280 L 60 200 L 60 60',
    steps: [
      { instruction: 'Walk straight from the entrance', distance: '20m' },
      { instruction: 'Continue straight through the main corridor', distance: '30m' },
      { instruction: 'Pharmacy is at the far end', distance: '5m' },
    ],
  },
};
