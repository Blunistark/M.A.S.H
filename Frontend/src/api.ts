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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

export function getPatientPhotoUrl(fullName: string, gender?: string): string {
  const name = fullName.toLowerCase();
  
  // Custom stock photo mappings for specific patients in the database
  if (name.includes('bob smith')) {
    return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150';
  }
  if (name.includes('sarah jenkins')) {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150';
  }
  if (name.includes('elena rostova')) {
    return 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150';
  }
  if (name.includes('marcus thompson')) {
    return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150';
  }
  if (name.includes('shiva')) {
    return 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150';
  }
  if (name.includes('john doe')) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150';
  }
  if (name.includes('alice johnson')) {
    return 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150';
  }
  if (name.includes('david miller')) {
    return 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150';
  }
  if (name.includes('james wilson')) {
    return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150';
  }
  if (name.includes('lisa cuddy')) {
    return 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150';
  }
  if (name.includes('remy hadley') || name.includes('thirteen')) {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150';
  }

  // Fallback by gender or name heuristics
  const isFemale = (gender && gender.toLowerCase() === 'female') ||
                   /\b(sarah|elena|alice|lisa|remy|mary|jane|linda|patricia|elizabeth|susan|jessica|sarah|karen|nancy|lisa|betty|margaret|sandra|ashley|dorothy|kimberly|emily|donna|michelle|carol|amanda|melissa|deborah|stephanie|rebecca|sharon|laura|cynthia|kathleen|amy|shirley|angela|helen|anna|brenda|pamela|nicole|samantha|katherine|emma|ruth|christine|debra|rachel|carolyn|janet|catherine|heather)\b/i.test(fullName);

  if (isFemale) {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
  }
  return 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150';
}
