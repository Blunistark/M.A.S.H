import { Doctor, Appointment, Prescription } from '../types';

// Detect base URL based on environment
// For Android Emulator: 10.0.2.2
// For iOS Simulator / Web: localhost
const BACKEND_URL = 'http://localhost:3000/api';
const ANDROID_EMULATOR_URL = 'http://10.0.2.2:3000/api';

// Fallback Mock Data
const MOCK_DOCTORS: Doctor[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Dr. Anita Desai',
    specialty: 'Cardiology',
    room_number: 'Room 302',
    experience_years: 12,
    rating: 4.9,
    available_slots: ['09:30 AM', '11:00 AM', '02:00 PM', '04:30 PM'],
    image_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'doctor-2',
    full_name: 'Dr. Rajesh Patel',
    specialty: 'Pediatrics',
    room_number: 'Room 105',
    experience_years: 8,
    rating: 4.8,
    available_slots: ['10:00 AM', '11:30 AM', '03:00 PM', '05:00 PM'],
    image_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'doctor-3',
    full_name: 'Dr. Sarah Jenkins',
    specialty: 'Dermatology',
    room_number: 'Room 214',
    experience_years: 15,
    rating: 4.7,
    available_slots: ['09:00 AM', '10:30 AM', '01:30 PM', '03:30 PM'],
    image_url: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300'
  }
];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    patient_id: '10000000-0000-0000-0000-000000000000',
    doctor_id: '22222222-2222-2222-2222-222222222222',
    doctor_name: 'Dr. Anita Desai',
    specialty: 'Cardiology',
    scheduled_time: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    status: 'scheduled',
    room_number: 'Room 302'
  }
];

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: '3f02fc00-35e0-41fb-a8b8-9b37af8f8153',
    patient_name: 'Priya Singh',
    doctor_name: 'Dr. Anita Desai',
    status: 'pushed_to_pharma',
    doctor_comments: 'Take after meals. Drink plenty of water.',
    items: [
      { medicine_name: 'Amoxicillin 500mg', dosage: '1 tablet - 3 times a day', quantity: 15, inStock: true }
    ]
  }
];

// Helper to handle fetch with timeout and fallback
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 3000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export const api = {
  getDoctors: async (): Promise<Doctor[]> => {
    try {
      // Try local URL first, then emulator URL
      let response;
      try {
        response = await fetchWithTimeout(`${BACKEND_URL}/doctor_details`);
      } catch {
        response = await fetchWithTimeout(`${ANDROID_EMULATOR_URL}/doctor_details`);
      }

      if (response.ok) {
        const data = await response.json();
        // Merge with details if necessary or return
        return data.map((d: any) => {
          const mock = MOCK_DOCTORS.find(m => m.full_name === d.full_name) || MOCK_DOCTORS[0];
          return {
            id: d.doctor_id || d.id,
            full_name: d.full_name || mock.full_name,
            specialty: d.specialty || mock.specialty,
            room_number: d.room_number || mock.room_number,
            experience_years: d.experience_years || mock.experience_years,
            rating: mock.rating,
            available_slots: mock.available_slots,
            image_url: mock.image_url
          };
        });
      }
      return MOCK_DOCTORS;
    } catch (err) {
      console.warn('API error, using mock doctors:', err);
      return MOCK_DOCTORS;
    }
  },

  getAppointments: async (patientId: string): Promise<Appointment[]> => {
    try {
      let response;
      try {
        response = await fetchWithTimeout(`${BACKEND_URL}/appointments`);
      } catch {
        response = await fetchWithTimeout(`${ANDROID_EMULATOR_URL}/appointments`);
      }

      if (response.ok) {
        const data = await response.json();
        // Filter by patientId if available in DB
        const userAppts = data.filter((a: any) => a.patient_id === patientId);
        if (userAppts.length > 0) {
          // Resolve doctor names
          const doctors = await api.getDoctors();
          return userAppts.map((a: any) => {
            const doc = doctors.find(d => d.id === a.doctor_id);
            return {
              id: a.id,
              patient_id: a.patient_id,
              doctor_id: a.doctor_id,
              doctor_name: doc ? doc.full_name : 'Unknown Doctor',
              specialty: doc ? doc.specialty : 'General Medicine',
              scheduled_time: a.scheduled_time,
              status: a.status,
              room_number: doc ? doc.room_number : 'Room 101'
            };
          });
        }
      }
      return MOCK_APPOINTMENTS;
    } catch (err) {
      console.warn('API error, using mock appointments:', err);
      return MOCK_APPOINTMENTS;
    }
  },

  bookAppointment: async (patientId: string, doctorId: string, time: string): Promise<Appointment> => {
    const payload = {
      patient_id: patientId,
      doctor_id: doctorId,
      scheduled_time: time,
      status: 'scheduled'
    };

    try {
      let response;
      try {
        response = await fetchWithTimeout(`${BACKEND_URL}/appointments`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch {
        response = await fetchWithTimeout(`${ANDROID_EMULATOR_URL}/appointments`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const data = await response.json();
        const doctors = await api.getDoctors();
        const doc = doctors.find(d => d.id === doctorId);
        return {
          id: data.id,
          patient_id: data.patient_id,
          doctor_id: data.doctor_id,
          doctor_name: doc ? doc.full_name : 'Unknown Doctor',
          specialty: doc ? doc.specialty : 'General Medicine',
          scheduled_time: data.scheduled_time,
          status: data.status,
          room_number: doc ? doc.room_number : 'Room 101'
        };
      }
      throw new Error('Failed to save to backend');
    } catch (err) {
      console.warn('API error booking appointment, simulating locally:', err);
      const doctors = MOCK_DOCTORS;
      const doc = doctors.find(d => d.id === doctorId) || doctors[0];
      const newAppt: Appointment = {
        id: `appt-${Math.random().toString(36).substr(2, 9)}`,
        patient_id: patientId,
        doctor_id: doctorId,
        doctor_name: doc.full_name,
        specialty: doc.specialty,
        scheduled_time: time,
        status: 'scheduled',
        room_number: doc.room_number
      };
      MOCK_APPOINTMENTS.push(newAppt);
      return newAppt;
    }
  },

  getPrescriptions: async (patientId: string): Promise<Prescription[]> => {
    try {
      let response;
      try {
        response = await fetchWithTimeout(`${BACKEND_URL}/prescriptions`);
      } catch {
        response = await fetchWithTimeout(`${ANDROID_EMULATOR_URL}/prescriptions`);
      }

      if (response.ok) {
        const prescriptions = await response.json();
        const userRx = prescriptions.filter((p: any) => p.patient_id === patientId);
        
        // Fetch detailed items
        let itemsResponse;
        try {
          itemsResponse = await fetchWithTimeout(`${BACKEND_URL}/prescription_items`);
        } catch {
          itemsResponse = await fetchWithTimeout(`${ANDROID_EMULATOR_URL}/prescription_items`);
        }

        let items: any[] = [];
        if (itemsResponse && itemsResponse.ok) {
          items = await itemsResponse.json();
        }

        // Fetch inventory
        let invResponse;
        try {
          invResponse = await fetchWithTimeout(`${BACKEND_URL}/medicine_inventory`);
        } catch {
          invResponse = await fetchWithTimeout(`${ANDROID_EMULATOR_URL}/medicine_inventory`);
        }

        let inventory: any[] = [];
        if (invResponse && invResponse.ok) {
          inventory = await invResponse.json();
        }

        const doctors = await api.getDoctors();

        return userRx.map((rx: any) => {
          const doc = doctors.find(d => d.id === rx.doctor_id);
          const rxItems = items.filter((i: any) => i.prescription_id === rx.id).map((i: any) => {
            const med = inventory.find((m: any) => m.id === i.medicine_id);
            return {
              medicine_name: med ? med.medicine_name : 'Prescribed Medication',
              dosage: i.dosage,
              quantity: i.quantity,
              inStock: med ? med.current_stock >= i.quantity : true
            };
          });

          return {
            id: rx.id,
            patient_name: 'Patient',
            doctor_name: doc ? doc.full_name : 'Doctor',
            status: rx.status,
            doctor_comments: rx.doctor_comments,
            items: rxItems.length > 0 ? rxItems : [{ medicine_name: 'Amoxicillin 500mg', dosage: '1 tablet twice a day', quantity: 10, inStock: true }]
          };
        });
      }
      return MOCK_PRESCRIPTIONS;
    } catch (err) {
      console.warn('API error getting prescriptions, using mock:', err);
      return MOCK_PRESCRIPTIONS;
    }
  }
};
