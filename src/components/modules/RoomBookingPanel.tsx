import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, MapPin } from 'lucide-react';
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
import GlassCard from '../ui/GlassCard';
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

  const selectedRange = useMemo(
    () => slotToTimeRange(selectedSlot),
    [selectedSlot]
  );

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
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Rooms
      </button>

      <GlassCard className="overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-6">
          <div>
            <div className="mb-6">
              <p
                className="text-white text-2xl font-bold"
                style={{ letterSpacing: '-0.03em' }}
              >
                Book {room.name}
              </p>
              <p className="text-white/50 text-sm mt-3 inline-flex items-center gap-2">
                <MapPin size={14} />
                {room.location || 'Location TBA'}
              </p>
            </div>

            {error && (
              <div
                className="rounded-2xl px-4 py-3 text-sm mb-5"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.22)',
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">
                  Select Date
                </span>
                <div className="mt-2 relative">
                  <CalendarDays
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <input
                    type="date"
                    value={date}
                    min={getLocalDateString()}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                </div>
              </label>

              <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-[0.18em] mb-3">
                  Room Availability for {date}
                </p>
                {loadingAvailability ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="rounded-2xl shimmer h-20"
                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                      />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">
                    Start Time
                  </span>
                  <input
                    type="time"
                    value={selectedRange.start || ''}
                    readOnly
                    className="w-full rounded-2xl px-4 py-3 mt-2 text-sm text-white outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                </label>

                <label className="block">
                  <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">
                    End Time
                  </span>
                  <input
                    type="time"
                    value={selectedRange.end || ''}
                    readOnly
                    className="w-full rounded-2xl px-4 py-3 mt-2 text-sm text-white outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">
                  Purpose (Optional)
                </span>
                <textarea
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  rows={3}
                  placeholder="What will you use this room for?"
                  className="w-full rounded-2xl px-4 py-3.5 mt-2 text-sm text-white outline-none resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold disabled:opacity-60"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.88))',
                  color: '#f0fdf4',
                }}
              >
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-3xl p-5"
              style={{
                background:
                  'linear-gradient(180deg, rgba(16,185,129,0.12), rgba(255,255,255,0.03))',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <p className="text-white text-lg font-semibold">Booking Summary</p>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <p><strong className="text-white">Room:</strong> {room.name}</p>
                <p><strong className="text-white">Date:</strong> {formatBookingDate(date)}</p>
                <p>
                  <strong className="text-white">Time:</strong>{' '}
                  {selectedRange.start && selectedRange.end
                    ? `${selectedRange.start} - ${selectedRange.end}`
                    : 'Choose a slot'}
                </p>
                {purpose.trim() && (
                  <p><strong className="text-white">Purpose:</strong> {purpose.trim()}</p>
                )}
              </div>
            </div>

            <GlassCard>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/55 text-sm">
                  <Clock3 size={14} />
                  Fixed 1-hour reservations
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm text-white/62">
                  <div>
                    <p className="text-white/35 text-xs uppercase tracking-[0.18em] mb-1">
                      Capacity
                    </p>
                    <p className="text-white font-semibold">{room.capacity} seats</p>
                  </div>
                  <div>
                    <p className="text-white/35 text-xs uppercase tracking-[0.18em] mb-1">
                      Amenities
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(room.amenities || []).map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: 'rgba(255,255,255,0.72)',
                          }}
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
