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
    <div>
      <div className="rb-legend">
        {[
          { label: 'Available', className: '', color: 'rgba(45,212,191,0.08)' },
          { label: 'Booked', className: '', color: 'rgba(239,68,68,0.12)' },
          { label: 'Past', className: '', color: 'rgba(255,255,255,0.08)' },
          { label: 'Selected', className: '', color: 'rgba(16,185,129,0.18)' },
        ].map((item) => (
          <span key={item.label} className="rb-legend-item">
            <span className="rb-legend-swatch" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="rb-timeline-grid">
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
              className={`rb-slot ${isBooked ? 'booked' : ''} ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
            >
              <div style={{ fontWeight: 700 }}>
                {formatHour(hour)} - {formatHour(hour + 1)}
              </div>
              <div className="rb-muted" style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                {isBooked ? 'Already reserved' : isPast ? 'Unavailable now' : 'Open for 1 hour'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
