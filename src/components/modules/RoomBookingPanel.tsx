import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase, type Room } from '../../lib/supabase';
import {
  formatBookingDate,
  getFirstAvailableSlot,
  getLocalDateString,
  isPastTimeSlot,
  slotToTimeRange,
} from '../../lib/roomBooking';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import RoomAvailabilityTimeline from './RoomAvailabilityTimeline';

interface AvailabilityRow {
  time_slot: string;
  status: string;
}

interface RoomBookingPanelProps {
  room: Room;
  onBack: () => void;
  onBookingSuccess: () => void;
}

export default function RoomBookingPanel({
  room,
  onBack,
  onBookingSuccess,
}: RoomBookingPanelProps) {
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();
  const [date, setDate] = useState(getLocalDateString());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [purpose, setPurpose] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function fetchAvailability() {
      setLoadingAvailability(true);
      setError('');

      const { data, error: rpcError } = await supabase.rpc('get_room_availability', {
        target_date: date,
        target_room_id: room.id,
      });

      if (!mounted) return;

      if (rpcError) {
        setBookedSlots([]);
        setError('We could not load room availability right now.');
      } else {
        const rows = ((data || []) as AvailabilityRow[]).filter(
          (entry) => entry.status === 'approved' || entry.status === 'pending'
        );
        setBookedSlots(rows.map((entry) => entry.time_slot));
      }

      setLoadingAvailability(false);
    }

    void fetchAvailability();

    return () => {
      mounted = false;
    };
  }, [date, room.id]);

  useEffect(() => {
    const suggestedSlot = getFirstAvailableSlot(date, bookedSlots);
    const isCurrentSlotUnavailable =
      !selectedSlot ||
      bookedSlots.includes(selectedSlot) ||
      isPastTimeSlot(date, selectedSlot);

    if (isCurrentSlotUnavailable) {
      setSelectedSlot(suggestedSlot);
    }
  }, [bookedSlots, date, selectedSlot]);

  const selectedRange = useMemo(() => slotToTimeRange(selectedSlot), [selectedSlot]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) {
      setError('You need to be signed in to book a room.');
      return;
    }

    if (!selectedSlot) {
      setError('Choose an available one-hour slot first.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('bookings').insert({
      room_id: room.id,
      user_id: profile.id,
      date,
      time_slot: selectedSlot,
      purpose: purpose.trim(),
      status: 'pending',
    });

    setSubmitting(false);

    if (insertError) {
      if (insertError.code === '23505') {
        setError('That slot was just taken. Pick another available hour and try again.');
      } else {
        setError(insertError.message);
      }
      return;
    }

    addToast({
      type: 'success',
      title: 'Request submitted',
      message: `${room.name} on ${formatBookingDate(date)} at ${selectedRange.start}`,
    });

    setPurpose('');
    onBookingSuccess();
  }

  return (
    <div>
      <button type="button" onClick={onBack} className="rb-subtle-button rb-back">
        <ArrowLeft size={15} />
        Back to Rooms
      </button>

      <div className="rb-booking-layout">
        <div className="rb-form-card">
          <h2>Book {room.name}</h2>
          <p className="rb-room-info">{room.location || 'Location not listed'}</p>

          {error && <div className="rb-alert error">{error}</div>}

          <form onSubmit={handleSubmit} className="rb-booking-form">
            <div className="rb-form-group">
              <label>Select Date</label>
              <input
                type="date"
                value={date}
                min={getLocalDateString()}
                onChange={(event) => setDate(event.target.value)}
                className="rb-input"
              />
            </div>

            <div className="rb-timeline-box">
              <div className="rb-field-label" style={{ marginBottom: '0.75rem' }}>
                Room Availability for {date}
              </div>

              {loadingAvailability ? (
                <div className="rb-loading-grid">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rb-shimmer" />
                  ))}
                </div>
              ) : (
                <RoomAvailabilityTimeline
                  selectedDate={date}
                  bookedSlots={bookedSlots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                />
              )}
            </div>

            <div className="rb-time-grid">
              <div className="rb-form-group">
                <label>Start Time</label>
                <input type="time" value={selectedRange.start || ''} readOnly className="rb-input" />
              </div>
              <div className="rb-form-group">
                <label>End Time</label>
                <input type="time" value={selectedRange.end || ''} readOnly className="rb-input" />
              </div>
            </div>

            <div className="rb-form-group">
              <label>Purpose (Optional)</label>
              <textarea
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                rows={4}
                placeholder="What will you use this room for?"
                className="rb-textarea"
              />
            </div>

            <button type="submit" disabled={submitting || !selectedSlot} className="rb-primary-button">
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>

        <div className="rb-summary">
          <h3>Booking Summary</h3>
          <p>
            <strong>Room:</strong> {room.name}
          </p>
          <p>
            <strong>Date:</strong> {formatBookingDate(date)}
          </p>
          <p>
            <strong>Time:</strong>{' '}
            {selectedRange.start && selectedRange.end
              ? `${selectedRange.start} - ${selectedRange.end}`
              : 'Choose a slot'}
          </p>
          {purpose.trim() && (
            <p>
              <strong>Purpose:</strong> {purpose.trim()}
            </p>
          )}

          <div className="rb-timeline-box" style={{ marginTop: '1rem' }}>
            <div className="rb-field-label" style={{ marginBottom: '0.5rem' }}>
              Room Details
            </div>
            <p className="rb-muted">
              <strong>Capacity:</strong> {room.capacity} seats
            </p>
            <div className="rb-tag-row" style={{ marginTop: '0.7rem' }}>
              {(room.amenities || []).map((amenity) => (
                <span key={amenity} className="rb-tag">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
