import { useMemo, useState } from 'react';
import { Clock3, MapPin } from 'lucide-react';
import type { Booking, Room } from '../../lib/supabase';
import { formatBookingDate, slotToTimeRange } from '../../lib/roomBooking';
import GlassCard from '../ui/GlassCard';
import RoomManagementPanel from './RoomManagementPanel';

type BookingWithRoom = Booking & {
  room?: Room;
  user_email?: string;
};

interface RoomAdminPanelProps {
  bookings: BookingWithRoom[];
  rooms: Room[];
  onUpdateStatus: (
    booking: BookingWithRoom,
    status: 'approved' | 'rejected'
  ) => Promise<void>;
  onRoomsChanged: () => Promise<void>;
}

type AdminTab = 'pending' | 'approved' | 'rejected';
type AdminSection = 'approvals' | 'rooms';

export default function RoomAdminPanel({
  bookings,
  rooms,
  onUpdateStatus,
  onRoomsChanged,
}: RoomAdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('pending');
  const [section, setSection] = useState<AdminSection>('approvals');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => booking.status === tab),
    [bookings, tab]
  );

  async function handleUpdate(
    booking: BookingWithRoom,
    status: 'approved' | 'rejected'
  ) {
    setProcessingId(booking.id);
    await onUpdateStatus(booking, status);
    setProcessingId(null);
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white text-lg font-bold" style={{ letterSpacing: '-0.03em' }}>
              Admin Panel
            </p>
            <p className="text-white/45 text-sm">
              Review booking requests or manage the room inventory shown to students.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['approvals', 'rooms'] as AdminSection[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSection(item)}
                className="rounded-full px-4 py-2 text-xs font-semibold capitalize"
                style={{
                  background: section === item ? 'rgba(14,165,233,0.16)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${section === item ? 'rgba(14,165,233,0.28)' : 'rgba(255,255,255,0.08)'}`,
                  color: section === item ? '#7dd3fc' : 'rgba(255,255,255,0.7)',
                }}
              >
                {item === 'approvals' ? 'Booking Approvals' : 'Manage Rooms'}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {section === 'rooms' && (
        <RoomManagementPanel rooms={rooms} onRoomsChanged={onRoomsChanged} />
      )}

      {section === 'approvals' && (
        <>
          <GlassCard>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-white text-lg font-bold" style={{ letterSpacing: '-0.03em' }}>
                  Booking Approvals
                </p>
                <p className="text-white/45 text-sm">
                  {bookings.filter((booking) => booking.status === 'pending').length} pending requests
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
            {(['pending', 'approved', 'rejected'] as AdminTab[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className="rounded-full px-4 py-2 text-xs font-semibold capitalize"
                style={{
                  background: tab === item ? 'rgba(14,165,233,0.16)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${tab === item ? 'rgba(14,165,233,0.28)' : 'rgba(255,255,255,0.08)'}`,
                  color: tab === item ? '#7dd3fc' : 'rgba(255,255,255,0.7)',
                }}
              >
                {item} ({bookings.filter((booking) => booking.status === item).length})
              </button>
            ))}
          </div>
            </div>
          </GlassCard>

      {filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const range = slotToTimeRange(booking.time_slot);
            return (
              <GlassCard key={booking.id}>
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-white text-lg font-semibold">
                        {booking.room?.name || booking.room_id}
                      </p>
                      <div className="flex items-center gap-2 text-white/42 text-sm mt-2">
                        <MapPin size={14} />
                        {booking.room?.location || 'Campus space'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/58">
                      <div>
                        <p className="text-white/35 text-xs mb-1">Student</p>
                        <p>{booking.user_email || booking.user_id}</p>
                      </div>
                      <div>
                        <p className="text-white/35 text-xs mb-1">Time Slot</p>
                        <p>{formatBookingDate(booking.date)} · {range.start} - {range.end}</p>
                      </div>
                      <div>
                        <p className="text-white/35 text-xs mb-1">Purpose</p>
                        <p>{booking.purpose || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-white/35 text-xs mb-1">Requested</p>
                        <div className="inline-flex items-center gap-2">
                          <Clock3 size={13} />
                          {new Date(booking.created_at).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {tab === 'pending' && (
                    <div className="flex gap-2 self-start">
                      <button
                        type="button"
                        onClick={() => handleUpdate(booking, 'approved')}
                        disabled={processingId === booking.id}
                        className="rounded-2xl px-4 py-3 text-sm font-semibold"
                        style={{
                          background: 'rgba(16,185,129,0.14)',
                          border: '1px solid rgba(16,185,129,0.24)',
                          color: '#6ee7b7',
                        }}
                      >
                        {processingId === booking.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(booking, 'rejected')}
                        disabled={processingId === booking.id}
                        className="rounded-2xl px-4 py-3 text-sm font-semibold"
                        style={{
                          background: 'rgba(239,68,68,0.12)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: '#fca5a5',
                        }}
                      >
                        {processingId === booking.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <p className="text-white text-lg font-semibold">No {tab} bookings</p>
          <p className="text-white/45 text-sm mt-2">
            This section will populate as room booking requests move through review.
          </p>
        </GlassCard>
      )}
        </>
      )}
    </div>
  );
}
