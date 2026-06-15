export type ProfileRole = 'patient' | 'doctor' | 'nurse' | 'admin';
export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type PrescriptionStatus = 'pending_check' | 'active' | 'completed';

export interface Profile {
  id: string;
  full_name: string;
  role: ProfileRole;
  contact_number?: string | null;
  created_at: string;
}

export interface DoctorDetails {
  doctor_id: string;
  specialty: string;
  room_number?: string | null;
  is_available: boolean;
  last_updated: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_time: string;
  status: AppointmentStatus;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  record_type: string; // 'Condition', 'Allergy', 'Vital', 'Test', 'Surgery'
  description: string;
  record_date: string;
  created_at: string;
  // Extra fields that could be JSON encoded in description but we keep them here for UI convenience in mock
  metadata?: any;
}

export interface MedicineInventory {
  id: string;
  medicine_name: string;
  current_stock: number;
  reorder_threshold: number;
  repeatedly_used: boolean;
  last_updated: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: PrescriptionStatus;
  doctor_comments?: string | null;
  created_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_id: string;
  dosage: string;
  quantity: number;
}

// --- MOCK DATA ---

const now = new Date().toISOString();

export const mockProfiles: Profile[] = [
  // Doctors
  { id: 'dr-smith', full_name: 'Dr. Smith', role: 'doctor', contact_number: '(555) 000-0001', created_at: now },
  { id: 'dr-chen', full_name: 'Dr. Sarah Chen', role: 'doctor', contact_number: '(555) 000-0002', created_at: now },
  
  // Patients
  { id: 'john-doe', full_name: 'John Doe', role: 'patient', contact_number: '(555) 123-4567', created_at: now },
  { id: 'alice-johnson', full_name: 'Alice Johnson', role: 'patient', contact_number: '(555) 987-6543', created_at: now },
  { id: 'bob-smith', full_name: 'Bob Smith', role: 'patient', contact_number: '(555) 456-7890', created_at: now },
  { id: 'carol-davis', full_name: 'Carol Davis', role: 'patient', contact_number: '(555) 321-7654', created_at: now },
  { id: 'evan-wright', full_name: 'Evan Wright', role: 'patient', contact_number: '(555) 789-0123', created_at: now },
];

export const mockDoctorDetails: DoctorDetails[] = [
  { doctor_id: 'dr-smith', specialty: 'Primary Care', room_number: '101', is_available: true, last_updated: now },
  { doctor_id: 'dr-chen', specialty: 'Cardiologist', room_number: '205', is_available: false, last_updated: now },
];

export const mockAppointments: Appointment[] = [
  { id: 'app-1', patient_id: 'evan-wright', doctor_id: 'dr-smith', scheduled_time: new Date(Date.now() - 4*60*60*1000).toISOString(), status: 'completed', created_at: now },
  { id: 'app-2', patient_id: 'alice-johnson', doctor_id: 'dr-smith', scheduled_time: new Date(Date.now() - 1*60*60*1000).toISOString(), status: 'in_progress', created_at: now },
  { id: 'app-3', patient_id: 'bob-smith', doctor_id: 'dr-smith', scheduled_time: new Date(Date.now() + 1*60*60*1000).toISOString(), status: 'scheduled', created_at: now },
  { id: 'app-4', patient_id: 'carol-davis', doctor_id: 'dr-smith', scheduled_time: new Date(Date.now() + 2*60*60*1000).toISOString(), status: 'scheduled', created_at: now },
  { id: 'app-5', patient_id: 'john-doe', doctor_id: 'dr-smith', scheduled_time: new Date(Date.now() + 3*60*60*1000).toISOString(), status: 'scheduled', created_at: now },
];

export const mockMedicalRecords: MedicalRecord[] = [
  // John Doe
  { id: 'rec-1', patient_id: 'john-doe', doctor_id: 'dr-smith', record_type: 'Condition', description: 'Hypertension (Controlled)', record_date: now, created_at: now },
  { id: 'rec-2', patient_id: 'john-doe', doctor_id: 'dr-smith', record_type: 'Condition', description: 'Type 2 Diabetes (Diet controlled)', record_date: now, created_at: now },
  { id: 'rec-3', patient_id: 'john-doe', doctor_id: 'dr-smith', record_type: 'Allergy', description: 'Penicillin', record_date: now, created_at: now, metadata: { severity: 'Anaphylaxis' } },
  { id: 'rec-4', patient_id: 'john-doe', doctor_id: 'dr-smith', record_type: 'Vital', description: 'Blood Pressure: 120/80, HR: 72, Weight: 185 lbs', record_date: now, created_at: now, metadata: { bp: '120/80', hr: '72 bpm', weight: '185 lbs' } },
  
  // Alice
  { id: 'rec-5', patient_id: 'alice-johnson', doctor_id: 'dr-smith', record_type: 'Condition', description: 'Asthma (Mild intermittent)', record_date: now, created_at: now },
  { id: 'rec-6', patient_id: 'alice-johnson', doctor_id: 'dr-smith', record_type: 'Vital', description: 'Blood Pressure: 115/75, HR: 68, Weight: 135 lbs', record_date: now, created_at: now, metadata: { bp: '115/75', hr: '68 bpm', weight: '135 lbs' } },
];

export const mockMedicineInventory: MedicineInventory[] = [
  { id: 'med-1', medicine_name: 'Lisinopril', current_stock: 150, reorder_threshold: 50, repeatedly_used: true, last_updated: now },
  { id: 'med-2', medicine_name: 'Metformin', current_stock: 300, reorder_threshold: 100, repeatedly_used: true, last_updated: now },
  { id: 'med-3', medicine_name: 'Albuterol HFA', current_stock: 45, reorder_threshold: 20, repeatedly_used: true, last_updated: now },
  { id: 'med-4', medicine_name: 'Omeprazole', current_stock: 200, reorder_threshold: 50, repeatedly_used: true, last_updated: now },
  { id: 'med-5', medicine_name: 'Levothyroxine', current_stock: 120, reorder_threshold: 30, repeatedly_used: true, last_updated: now },
  { id: 'med-6', medicine_name: 'Amoxicillin', current_stock: 10, reorder_threshold: 50, repeatedly_used: true, last_updated: now }, // low stock
];

export const mockPrescriptions: Prescription[] = [
  { id: 'presx-1', patient_id: 'john-doe', doctor_id: 'dr-smith', status: 'active', doctor_comments: 'Take with food', created_at: now },
  { id: 'presx-2', patient_id: 'alice-johnson', doctor_id: 'dr-smith', status: 'pending_check', created_at: now },
  { id: 'presx-3', patient_id: 'bob-smith', doctor_id: 'dr-smith', status: 'active', created_at: now },
  { id: 'presx-4', patient_id: 'carol-davis', doctor_id: 'dr-smith', status: 'active', created_at: now },
];

export const mockPrescriptionItems: PrescriptionItem[] = [
  // John's meds
  { id: 'item-1', prescription_id: 'presx-1', medicine_id: 'med-1', dosage: '10mg - Once daily', quantity: 30 },
  { id: 'item-2', prescription_id: 'presx-1', medicine_id: 'med-2', dosage: '500mg - Twice daily', quantity: 60 },
  // Alice's meds
  { id: 'item-3', prescription_id: 'presx-2', medicine_id: 'med-3', dosage: '90mcg - As needed', quantity: 1 },
  // Bob's meds
  { id: 'item-4', prescription_id: 'presx-3', medicine_id: 'med-4', dosage: '20mg - Once daily', quantity: 30 },
  // Carol's meds
  { id: 'item-5', prescription_id: 'presx-4', medicine_id: 'med-5', dosage: '75mcg - Once daily', quantity: 30 },
];

export interface DashboardMetrics {
  todayAppointmentsCount: number;
  remainingAppointmentsCount: number;
  pendingReschedulesCount: number;
  notificationsCount: number;
  stockAlertsCount: number;
}

export const initialMetrics: DashboardMetrics = {
  todayAppointmentsCount: mockAppointments.length,
  remainingAppointmentsCount: mockAppointments.filter(a => a.status === 'scheduled').length,
  pendingReschedulesCount: 3,
  notificationsCount: 8,
  stockAlertsCount: mockMedicineInventory.filter(m => m.current_stock <= m.reorder_threshold).length
};
