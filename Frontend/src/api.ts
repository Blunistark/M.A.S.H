import type { 
  Profile, 
  DoctorDetails, 
  Appointment, 
  MedicalRecord, 
  MedicineInventory, 
  Prescription, 
  PrescriptionItem,
  DashboardMetrics
} from './types';

const API_BASE = 'http://localhost:3000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  return fetchJson<DashboardMetrics>(`${API_BASE}/metrics`);
}

export async function fetchProfiles(): Promise<Profile[]> {
  return fetchJson<Profile[]>(`${API_BASE}/profiles`);
}

export async function fetchProfileById(id: string): Promise<Profile> {
  return fetchJson<Profile>(`${API_BASE}/profiles/${id}`);
}

export async function fetchDoctorDetails(): Promise<DoctorDetails[]> {
  return fetchJson<DoctorDetails[]>(`${API_BASE}/doctor_details`);
}

export async function fetchAppointments(): Promise<Appointment[]> {
  return fetchJson<Appointment[]>(`${API_BASE}/appointments`);
}

export async function createAppointment(appt: { 
  patient_id: string; 
  doctor_id: string; 
  scheduled_time: string; 
  status: string; 
}): Promise<Appointment> {
  return fetchJson<Appointment>(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appt)
  });
}

export async function fetchMedicalRecords(): Promise<MedicalRecord[]> {
  return fetchJson<MedicalRecord[]>(`${API_BASE}/medical_records`);
}

export async function fetchPrescriptions(): Promise<Prescription[]> {
  return fetchJson<Prescription[]>(`${API_BASE}/prescriptions`);
}

export async function fetchPrescriptionItems(): Promise<PrescriptionItem[]> {
  return fetchJson<PrescriptionItem[]>(`${API_BASE}/prescription_items`);
}

export async function fetchMedicineInventory(): Promise<MedicineInventory[]> {
  return fetchJson<MedicineInventory[]>(`${API_BASE}/medicine_inventory`);
}
