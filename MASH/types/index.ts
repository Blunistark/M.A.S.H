export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  cardType?: 'appointment' | 'doctor' | 'prescription' | 'navigation' | 'suggested_appointments';
  cardData?: any;
}

export interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  room_number: string;
  experience_years?: number;
  rating?: number;
  available_slots?: string[];
  image_url?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  room_number?: string;
}

export interface PrescriptionItem {
  medicine_name: string;
  dosage: string;
  quantity: number;
  status?: string;
  inStock?: boolean;
}

export interface Prescription {
  id: string;
  patient_name: string;
  doctor_name: string;
  status: 'pending_check' | 'active' | 'completed' | 'pushed_to_pharma' | 'alternative_requested' | 'fulfilled';
  items: PrescriptionItem[];
  doctor_comments?: string;
}
