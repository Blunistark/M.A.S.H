import { Calendar, MapPin, Check, RefreshCw } from 'lucide-react';

interface AppointmentCardProps {
  doctorName: string;
  specialty: string;
  time: string;
  room: string;
  avatar: string;
  onConfirm?: () => void;
  onReschedule?: () => void;
}

export function AppointmentCard({
  doctorName,
  specialty,
  time,
  room,
  avatar,
  onConfirm,
  onReschedule,
}: AppointmentCardProps) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 shadow-sm slide-up">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-primary-bg flex items-center justify-center text-2xl">
          {avatar}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text">{doctorName}</p>
          <p className="text-xs text-text-secondary">{specialty}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-primary" />
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-primary" />
          <span>Room {room}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onConfirm || (() => {})}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium py-2.5 rounded-xl transition-colors"
        >
          <Check size={14} />
          Confirm
        </button>
        <button
          onClick={onReschedule || (() => {})}
          className="flex-1 flex items-center justify-center gap-1.5 bg-bg-secondary hover:bg-border-light text-text-secondary text-xs font-medium py-2.5 rounded-xl border border-border transition-colors"
        >
          <RefreshCw size={14} />
          Reschedule
        </button>
      </div>
    </div>
  );
}
