import { MapPin } from 'lucide-react';

interface DoctorCardProps {
  name: string;
  specialty: string;
  availability: string;
  room: string;
  avatar: string;
  nextSlot: string;
  onBook?: () => void;
}

export function DoctorCard({
  name,
  specialty,
  availability,
  room,
  avatar,
  nextSlot,
  onBook,
}: DoctorCardProps) {
  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    busy: 'bg-amber-100 text-amber-700',
    'off-duty': 'bg-red-100 text-red-500',
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-4 shadow-sm slide-up">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-bg flex items-center justify-center text-xl flex-shrink-0">
          {avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-text truncate">{name}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[availability] || statusColors['off-duty']}`}>
              {availability}
            </span>
          </div>

          <p className="text-xs text-text-secondary mb-1">{specialty}</p>

          <div className="flex items-center gap-3 text-[11px] text-text-muted">
            <span className="flex items-center gap-1">
              <MapPin size={10} className="text-primary" />
              Room {room}
            </span>
            <span>Next: {nextSlot}</span>
          </div>
        </div>

        {availability === 'available' && (
          <button
            onClick={onBook || (() => {})}
            className="flex-shrink-0 bg-primary hover:bg-primary-dark text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors"
          >
            Book
          </button>
        )}
      </div>
    </div>
  );
}
