import { api } from './api';
import { Doctor, Appointment, Prescription } from '../types';

export interface RouterResponse {
  responseText: string;
  cardType?: 'appointment' | 'doctor' | 'prescription' | 'navigation' | 'suggested_appointments';
  cardData?: any;
}

export async function routeIntent(text: string, patientId: string): Promise<RouterResponse> {
  const query = text.toLowerCase();

  // 1. INTENT: Book Appointment / Schedule / Book doctor
  if (query.includes('book') || query.includes('schedule') || query.includes('appointment') || query.includes('doctor')) {
    // Check if a specific doctor is mentioned
    const doctors = await api.getDoctors();
    let matchedDoctor = doctors.find(d => 
      query.includes(d.full_name.toLowerCase()) || 
      query.includes(d.full_name.split(' ').pop()?.toLowerCase() || '') ||
      (d.specialty && query.includes(d.specialty.toLowerCase()))
    );

    if (matchedDoctor) {
      // Return doctor's available slots
      return {
        responseText: `I found ${matchedDoctor.full_name} (${matchedDoctor.specialty}) located in ${matchedDoctor.room_number}. What time works best for you? Here are their available slots:`,
        cardType: 'suggested_appointments',
        cardData: {
          doctor: matchedDoctor,
          slots: matchedDoctor.available_slots || ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
        }
      };
    } else {
      // General booking, return doctor profiles to pick
      return {
        responseText: "Which doctor or specialty would you like to schedule an appointment with? Here are our available specialists:",
        cardType: 'doctor',
        cardData: doctors
      };
    }
  }

  // 2. INTENT: Navigation / Map / Where is / Directions
  if (query.includes('where') || query.includes('find') || query.includes('room') || query.includes('map') || query.includes('navigate') || query.includes('location') || query.includes('pharmacy')) {
    let destination = 'Reception';
    let room = 'Main Lobby';
    let path = 'lobby';
    let description = 'Head straight from the entrance.';

    if (query.includes('pharmacy')) {
      destination = 'Pharmacy';
      room = 'Room 102';
      path = 'pharmacy';
      description = 'Walk down the main corridor, take the first left. The Pharmacy is on the right, next to Room 102.';
    } else if (query.includes('anita') || query.includes('desai') || query.includes('cardiology') || query.includes('302')) {
      destination = 'Dr. Anita Desai (Cardiology)';
      room = 'Room 302';
      path = 'cardiology';
      description = 'Take the elevator to the 3rd floor. Exit left and Room 302 is at the end of the hall.';
    } else if (query.includes('rajesh') || query.includes('patel') || query.includes('pediatrics') || query.includes('105')) {
      destination = 'Dr. Rajesh Patel (Pediatrics)';
      room = 'Room 105';
      path = 'pediatrics';
      description = 'Walk straight past reception, turn right, and Room 105 is the second door on your left.';
    } else if (query.includes('sarah') || query.includes('jenkins') || query.includes('dermatology') || query.includes('214')) {
      destination = 'Dr. Sarah Jenkins (Dermatology)';
      room = 'Room 214';
      path = 'dermatology';
      description = 'Take the stairs or elevator to the 2nd floor, turn right, and Room 214 is halfway down.';
    }

    return {
      responseText: `Here are the directions to the ${destination} in ${room}. I've loaded the wayfinding map for you:`,
      cardType: 'navigation',
      cardData: {
        destination,
        room,
        path,
        description,
        directions: [
          'Enter through main hospital entrance.',
          description,
          'Follow the glowing indicators on the floor/map.'
        ]
      }
    };
  }

  // 3. INTENT: Prescription Status
  if (query.includes('prescription') || query.includes('medicine') || query.includes('rx') || query.includes('pharmacy status') || query.includes('medication')) {
    const prescriptions = await api.getPrescriptions(patientId);
    
    if (prescriptions.length > 0) {
      const activeRx = prescriptions[0];
      let statusDesc = '';
      switch (activeRx.status) {
        case 'pushed_to_pharma':
          statusDesc = 'has been sent to the pharmacy and is currently being processed.';
          break;
        case 'alternative_requested':
          statusDesc = 'is undergoing alternative medicine approval because of inventory shortages.';
          break;
        case 'fulfilled':
          statusDesc = 'is ready! You can pick it up at the pharmacy counter now.';
          break;
        default:
          statusDesc = 'is currently pending check.';
      }

      return {
        responseText: `Your prescription for ${activeRx.items.map(i => i.medicine_name).join(', ')} from ${activeRx.doctor_name} ${statusDesc}`,
        cardType: 'prescription',
        cardData: activeRx
      };
    } else {
      return {
        responseText: "You don't have any active prescriptions in our system right now. If you just had an appointment, please check back in a few minutes.",
      };
    }
  }

  // 4. INTENT: Reschedule / Change Appointment
  if (query.includes('reschedule') || query.includes('change') || query.includes('postpone') || query.includes('cancel')) {
    const appts = await api.getAppointments(patientId);
    const activeAppt = appts.find(a => a.status === 'scheduled');

    if (activeAppt) {
      return {
        responseText: `I see your upcoming appointment with ${activeAppt.doctor_name} on ${new Date(activeAppt.scheduled_time).toLocaleString()}. Let's reschedule it. Here are the doctor's available times:`,
        cardType: 'suggested_appointments',
        cardData: {
          doctor: {
            id: activeAppt.doctor_id,
            full_name: activeAppt.doctor_name,
            specialty: activeAppt.specialty,
            room_number: activeAppt.room_number || 'Room 101'
          },
          slots: ['09:30 AM', '11:00 AM', '02:00 PM', '04:30 PM'],
          isRescheduling: true,
          oldAppointmentId: activeAppt.id
        }
      };
    } else {
      return {
        responseText: "I couldn't find any active upcoming appointments to reschedule. Would you like to book a new appointment?",
      };
    }
  }

  // 5. General Q&A fallback
  if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
    return {
      responseText: "Hello! I am MedConnect voice assistant. I can help you book appointments, find your way around the clinic, or check your prescription status. How can I help you today?"
    };
  }

  if (query.includes('thank') || query.includes('thanks') || query.includes('bye')) {
    return {
      responseText: "You're very welcome! Let me know if you need anything else. Have a wonderful day!"
    };
  }

  // Fallback default
  return {
    responseText: `I understand you said "${text}". I can help you book appointments, navigate the clinic, or check prescriptions. What would you like me to do?`
  };
}
