import type { ChatMessage } from '../hooks/useChat';
import { AppointmentCard } from './AppointmentCard';
import { DoctorCard } from './DoctorCard';

interface ChatBubbleProps {
  message: ChatMessage;
}

interface AppointmentCardData {
  type: 'appointment_card';
  doctor: {
    id: string;
    name: string;
    specialty: string;
    room: string;
    avatar: string;
    nextSlot: string;
  };
  suggestedTime: string;
}

interface DoctorListData {
  type: 'doctor_list';
  doctors: {
    id: string;
    name: string;
    specialty: string;
    availability: string;
    room: string;
    avatar: string;
    nextSlot: string;
  }[];
}

interface AppointmentListData {
  type: 'appointment_list';
  appointments: {
    id: string;
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
    room: string;
    status: string;
    type: string;
  }[];
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const data = message.data as AppointmentCardData | DoctorListData | AppointmentListData | undefined;

  return (
    <div className={`flex flex-col mb-5 slide-up ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Sender label for assistant */}
      {!isUser && (
        <div className="flex items-center gap-1.5 mb-1.5 ml-1">
          <div className="w-4 h-4 rounded bg-primary-bg flex items-center justify-center">
            <span className="text-[8px] text-primary font-bold">+</span>
          </div>
          <span className="text-[11px] font-semibold text-primary tracking-wide">HEALTH ASSISTANT</span>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3.5 text-[15px] leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-bg-secondary text-text rounded-bl-md border border-border-light'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>

        {/* Suggested actions inside bot bubble */}
        {data && data.type === 'appointment_card' && !isUser && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">SUGGESTED ACTIONS:</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-3 py-1.5 bg-primary-bg text-primary text-xs font-medium rounded-full cursor-pointer hover:bg-primary-bg-hover transition-colors">
                Confirm Booking
              </span>
              <span className="px-3 py-1.5 bg-primary-bg text-primary text-xs font-medium rounded-full cursor-pointer hover:bg-primary-bg-hover transition-colors">
                Reschedule
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Rich data cards */}
      {data && !isUser && (
        <div className="mt-2 space-y-2 max-w-[85%] w-full">
          {data.type === 'appointment_card' && (
            <AppointmentCard
              doctorName={data.doctor.name}
              specialty={data.doctor.specialty}
              time={data.suggestedTime}
              room={data.doctor.room}
              avatar={data.doctor.avatar}
            />
          )}

          {data.type === 'doctor_list' &&
            data.doctors.slice(0, 3).map((doc) => (
              <DoctorCard
                key={doc.id}
                name={doc.name}
                specialty={doc.specialty}
                availability={doc.availability}
                room={doc.room}
                avatar={doc.avatar}
                nextSlot={doc.nextSlot}
              />
            ))}

          {data.type === 'appointment_list' &&
            data.appointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                doctorName={apt.doctorName}
                specialty={apt.specialty}
                time={`${apt.date} at ${apt.time}`}
                room={apt.room}
                avatar="👨‍⚕️"
              />
            ))}
        </div>
      )}

      {/* Timestamp */}
      <p className={`text-[10px] text-text-muted mt-1.5 ${isUser ? 'mr-1' : 'ml-1'}`}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
