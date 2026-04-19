import { BOOKING_HOURS, buildTimeSlot, formatHour, isPastTimeSlot } from '../../lib/roomBooking';

interface RoomAvailabilityTimelineProps {
  selectedDate: string;
  bookedSlots: string[];
  selectedSlot: string;
  onSelectSlot: (timeSlot: string) => void;
}

export default function RoomAvailabilityTimeline({
  selectedDate,
  bookedSlots,
  selectedSlot,
  onSelectSlot,
}: RoomAvailabilityTimelineProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { label: 'Available', color: 'rgba(14,165,233,0.18)', border: 'rgba(14,165,233,0.35)' },
          { label: 'Booked', color: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.35)' },
          { label: 'Past', color: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' },
          { label: 'Selected', color: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.35)' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-white/50">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: item.color, border: `1px solid ${item.border}` }}
            />
            {item.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {BOOKING_HOURS.map((hour) => {
          const timeSlot = buildTimeSlot(hour);
          const isBooked = bookedSlots.includes(timeSlot);
          const isPast = isPastTimeSlot(selectedDate, timeSlot);
          const isSelected = selectedSlot === timeSlot;
          const isDisabled = isBooked || isPast;

          return (
            <button
              key={timeSlot}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectSlot(timeSlot)}
              className="rounded-2xl px-4 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed"
              style={{
                background: isSelected
                  ? 'rgba(16,185,129,0.18)'
                  : isBooked
                    ? 'rgba(239,68,68,0.14)'
                    : isPast
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(14,165,233,0.12)',
                border: `1px solid ${
                  isSelected
                    ? 'rgba(16,185,129,0.4)'
                    : isBooked
                      ? 'rgba(239,68,68,0.32)'
                      : isPast
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(14,165,233,0.25)'
                }`,
                opacity: isPast ? 0.45 : 1,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white text-sm font-semibold">{formatHour(hour)} - {formatHour(hour + 1)}</p>
                  <p className="text-white/40 text-xs mt-1">
                    {isBooked ? 'Already reserved' : isPast ? 'Unavailable now' : 'Open for 1 hour'}
                  </p>
                </div>
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: isSelected
                      ? 'rgba(16,185,129,0.16)'
                      : 'rgba(255,255,255,0.06)',
                    color: isSelected ? '#6ee7b7' : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {isSelected ? 'Selected' : isBooked ? 'Booked' : isPast ? 'Past' : '1 hr'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
