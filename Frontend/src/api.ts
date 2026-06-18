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

export async function createProfile(profile: { full_name: string; contact_number?: string }): Promise<Profile> {
  return fetchJson<Profile>(`${API_BASE}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profile)
  });
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

export async function completeAppointmentForPatient(patientId: string): Promise<any> {
  return fetchJson<any>(`${API_BASE}/appointments/patient/${patientId}/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function fulfillPrescription(id: string): Promise<any> {
  return fetchJson<any>(`${API_BASE}/prescriptions/${id}/fulfill`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function requestAlternativePrescription(id: string, comments: string): Promise<any> {
  return fetchJson<any>(`${API_BASE}/prescriptions/${id}/alternative`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ comments })
  });
}

export async function restockMedicine(id: string, amount: number): Promise<any> {
  return fetchJson<any>(`${API_BASE}/medicine_inventory/${id}/restock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount })
  });
}

export async function sendPrescriptionToPharmacy(payload: {
  patient_id: string;
  doctor_id?: string;
  items: { name: string; dosage: string; frequency: string; duration: number; quantity: number }[];
  doctor_comments?: string;
}): Promise<any> {
  return fetchJson<any>(`${API_BASE}/prescriptions/send-to-pharmacy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export async function fetchPharmacyData(): Promise<{
  prescriptions: any[];
  inventory: MedicineInventory[];
}> {
  return fetchJson<{ prescriptions: any[]; inventory: MedicineInventory[] }>(`${API_BASE}/pharmacy`);
}

export async function updateAppointment(id: string, payload: { scheduled_time: string; status?: string }): Promise<Appointment> {
  return fetchJson<Appointment>(`${API_BASE}/appointments/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export interface DoctorAssistantResponse {
  reply: string;
  action?: {
    type: string;
    route?: string;
    patientId?: string;
  };
}

export async function askDoctorAssistant(message: string, history: { role: 'user' | 'model'; text: string }[]): Promise<DoctorAssistantResponse> {
  return fetchJson<DoctorAssistantResponse>(`${API_BASE}/doctor-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, history })
  });
}

export async function askPharmacistAssistant(message: string, history: { role: 'user' | 'model'; text: string }[]): Promise<DoctorAssistantResponse> {
  return fetchJson<DoctorAssistantResponse>(`${API_BASE}/pharmacist-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, history })
  });
}

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const response = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error(`TTS HTTP error! status: ${response.status}`);
  }

  return response.arrayBuffer();
}
