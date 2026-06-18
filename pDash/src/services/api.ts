import {
  mockDoctors,
  mockAppointments,
  mockPrescriptions,
  mockPatientProfile,
  mockNavRoutes,
  type Doctor,
  type Appointment,
  type Prescription,
  type PatientProfile,
  type NavRoute,
} from '../data/mockData';

// ─── Simulated network delay ────────────────────────────────────

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── API Functions ──────────────────────────────────────────────

export async function getDoctors(): Promise<Doctor[]> {
  await delay();
  return mockDoctors;
}

export async function getAppointments(): Promise<Appointment[]> {
  await delay();
  return mockAppointments;
}

export async function getPrescriptions(): Promise<Prescription[]> {
  await delay();
  return mockPrescriptions;
}

export async function getPatientProfile(): Promise<PatientProfile> {
  await delay();
  return mockPatientProfile;
}

export async function getNavRoute(destination: string): Promise<NavRoute | null> {
  await delay(200);
  return mockNavRoutes[destination] || null;
}

// ─── Chat Intent Parser ─────────────────────────────────────────

interface ChatResponse {
  intent: string;
  text: string;
  data?: unknown;
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  await delay(800);

  const lower = message.toLowerCase();

  // Book appointment intent
  if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule')) {
    const availableDoctors = mockDoctors.filter((d) => d.availability === 'available');
    const doctor = availableDoctors[0];
    return {
      intent: 'book_appointment',
      text: `I can help you book an appointment. ${doctor.name} (${doctor.specialty}) is available ${doctor.nextSlot}. Room ${doctor.room}. Would you like to confirm this booking?`,
      data: {
        type: 'appointment_card',
        doctor: doctor,
        suggestedTime: doctor.nextSlot,
      },
    };
  }

  // Find doctor intent
  if (lower.includes('find') || lower.includes('doctor') || lower.includes('specialist')) {
    return {
      intent: 'find_doctor',
      text: `Here are the doctors available today:`,
      data: {
        type: 'doctor_list',
        doctors: mockDoctors,
      },
    };
  }

  // Reschedule intent
  if (lower.includes('reschedule') || lower.includes('change') || lower.includes('cancel')) {
    const upcoming = mockAppointments.filter((a) => a.status === 'upcoming');
    return {
      intent: 'reschedule',
      text: `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}. Which one would you like to reschedule?`,
      data: {
        type: 'appointment_list',
        appointments: upcoming,
      },
    };
  }

  // Prescription intent
  if (lower.includes('prescription') || lower.includes('medicine') || lower.includes('medication')) {
    return {
      intent: 'prescription',
      text: `Here are your current prescriptions:`,
      data: {
        type: 'prescription_list',
        prescriptions: mockPrescriptions,
      },
    };
  }

  // Navigation intent
  if (lower.includes('navigate') || lower.includes('where') || lower.includes('direction') || lower.includes('find room')) {
    return {
      intent: 'navigate',
      text: `I can help you navigate. Which room or area would you like to go to? Available destinations: Room 101, Room 102, Room 103, or Pharmacy.`,
    };
  }

  // Default response
  return {
    intent: 'general',
    text: `I'm your healthcare assistant. I can help you with:\n\n• **Book appointments** with available doctors\n• **Find doctors** by specialty\n• **Reschedule** upcoming visits\n• **Check prescriptions** and medications\n• **Navigate** within the hospital\n\nJust ask me anything!`,
  };
}
