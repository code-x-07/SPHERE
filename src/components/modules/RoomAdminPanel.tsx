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
  const [section, setSection] = useState<AdminSection>('approvals');
  const [tab, setTab] = useState<AdminTab>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending'),
    [bookings]
  );
  const approvedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'approved'),
    [bookings]
  );
  const rejectedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'rejected'),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    if (tab === 'approved') return approvedBookings;
    if (tab === 'rejected') return rejectedBookings;
    return pendingBookings;
  }, [approvedBookings, pendingBookings, rejectedBookings, tab]);

  async function handleUpdate(
    booking: BookingWithRoom,
    status: 'approved' | 'rejected'
  ) {
    setProcessingId(booking.id);
    await onUpdateStatus(booking, status);
    setProcessingId(null);
  }

  function renderBookingsList(list: BookingWithRoom[], status: AdminTab) {
    if (list.length === 0) {
      return (
        <GlassCard className="text-center py-12">
          <p className="text-white text-lg font-semibold">
            {status === 'pending'
              ? 'No pending booking requests.'
              : `No ${status} bookings.`}
          </p>
        </GlassCard>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((booking) => {
          const range = slotToTimeRange(booking.time_slot);

          return (
            <GlassCard key={booking.id}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-white text-lg font-semibold">
                      {booking.room?.name || booking.room_id}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-white/44">
                      <MapPin size={14} />
                      {booking.room?.location || 'Campus space'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm text-white/58 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs text-white/34">Student Email</p>
                      <p>{booking.user_email || booking.user_id}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-white/34">Time Slot</p>
                      <p>
                        {formatBookingDate(booking.date)} · {range.start} - {range.end}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-white/34">Purpose</p>
                      <p>{booking.purpose || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-white/34">Requested</p>
                      <div className="inline-flex items-center gap-2">
                        <Clock3 size={13} />
                        {new Date(booking.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>

                {status === 'pending' && (
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
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-wrap gap-2">
          {(['approvals', 'rooms'] as AdminSection[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSection(item)}
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                background: section === item ? 'rgba(14,165,233,0.16)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${section === item ? 'rgba(14,165,233,0.28)' : 'rgba(255,255,255,0.08)'}`,
                color: section === item ? '#7dd3fc' : 'rgba(255,255,255,0.72)',
              }}
            >
              {item === 'approvals' ? 'Booking Approvals' : 'Manage Rooms'}
            </button>
          ))}
        </div>
      </GlassCard>

      {section === 'rooms' && (
        <RoomManagementPanel rooms={rooms} onRoomsChanged={onRoomsChanged} />
      )}

      {section === 'approvals' && (
        <>
          <GlassCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-white text-lg font-bold" style={{ letterSpacing: '-0.03em' }}>
                  Booking Approvals
                </p>
                <p className="text-white/45 text-sm">{pendingBookings.length} Pending</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {([
                  { id: 'pending' as const, count: pendingBookings.length, label: 'Pending' },
                  { id: 'approved' as const, count: approvedBookings.length, label: 'Approved' },
                  { id: 'rejected' as const, count: rejectedBookings.length, label: 'Rejected' },
                ]).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className="rounded-full px-4 py-2 text-sm font-semibold"
                    style={{
                      background: tab === item.id ? 'rgba(14,165,233,0.16)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${tab === item.id ? 'rgba(14,165,233,0.28)' : 'rgba(255,255,255,0.08)'}`,
                      color: tab === item.id ? '#7dd3fc' : 'rgba(255,255,255,0.72)',
                    }}
                  >
                    {item.label} ({item.count})
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {renderBookingsList(filteredBookings, tab)}
        </>
      )}
    </div>
  );
}
