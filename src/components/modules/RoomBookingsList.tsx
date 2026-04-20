import { useMemo, useState } from 'react';
import { Clock3, MapPin } from 'lucide-react';
import type { Booking, Room } from '../../lib/supabase';
import { formatBookingDate, isPastTimeSlot, slotToTimeRange } from '../../lib/roomBooking';
import GlassCard from '../ui/GlassCard';

type BookingWithRoom = Booking & {
  room?: Room;
};

interface RoomBookingsListProps {
  bookings: BookingWithRoom[];
  onCancelBooking: (booking: BookingWithRoom) => Promise<void>;
}

export default function RoomBookingsList({
  bookings,
  onCancelBooking,
}: RoomBookingsListProps) {
  const [showApprovedOnly, setShowApprovedOnly] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => (showApprovedOnly ? booking.status === 'approved' : true)),
    [bookings, showApprovedOnly]
  );

  async function handleCancel(booking: BookingWithRoom) {
    setCancellingId(booking.id);
    await onCancelBooking(booking);
    setCancellingId(null);
    setCancelConfirmId(null);
  }

  function getApprovalStatusDisplay(status: Booking['status']) {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending Approval';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  if (bookings.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <p className="text-white text-lg font-semibold">You don&apos;t have any bookings yet.</p>
        <p className="text-white/45 text-sm mt-2">
          Browse available rooms to make your first booking.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white text-lg font-bold" style={{ letterSpacing: '-0.03em' }}>
              My Bookings
            </p>
            <p className="text-white/45 text-sm">
              Showing {visibleBookings.length} booking{visibleBookings.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowApprovedOnly((current) => !current)}
            className="rounded-full px-4 py-2 text-xs font-semibold self-start md:self-auto"
            style={{
              background: showApprovedOnly ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showApprovedOnly ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.08)'}`,
              color: showApprovedOnly ? '#6ee7b7' : 'rgba(255,255,255,0.72)',
            }}
          >
            {showApprovedOnly ? 'Showing Approved Only' : 'Show Approved Bookings Only'}
          </button>
        </div>
      </GlassCard>

      {visibleBookings.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-white text-lg font-semibold">No approved bookings found.</p>
          <p className="text-white/45 text-sm mt-2">
            Turn off the filter to see all booking statuses.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {visibleBookings.map((booking) => {
            const range = slotToTimeRange(booking.time_slot);
            const isUpcoming = !isPastTimeSlot(booking.date, booking.time_slot);
            const canCancel =
              isUpcoming &&
              booking.status !== 'rejected' &&
              booking.status !== 'cancelled';

            return (
              <GlassCard key={booking.id}>
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-white text-lg font-semibold">
                        {booking.room?.name || booking.room_id}
                      </p>
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{
                          background:
                            booking.status === 'approved'
                              ? 'rgba(16,185,129,0.14)'
                              : booking.status === 'pending'
                                ? 'rgba(245,158,11,0.14)'
                                : booking.status === 'rejected'
                                  ? 'rgba(239,68,68,0.14)'
                                  : 'rgba(255,255,255,0.08)',
                          color:
                            booking.status === 'approved'
                              ? '#6ee7b7'
                              : booking.status === 'pending'
                                ? '#fcd34d'
                                : booking.status === 'rejected'
                                  ? '#fca5a5'
                                  : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {getApprovalStatusDisplay(booking.status)}
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{
                          background: isUpcoming ? 'rgba(14,165,233,0.14)' : 'rgba(255,255,255,0.08)',
                          color: isUpcoming ? '#7dd3fc' : 'rgba(255,255,255,0.62)',
                        }}
                      >
                        {isUpcoming ? 'Upcoming' : 'Past'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-white/58">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        {booking.room?.location || 'Campus space'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 size={14} />
                        {formatBookingDate(booking.date)} · {range.start} - {range.end}
                      </div>
                      {booking.purpose && <p>{booking.purpose}</p>}
                      <p className="text-white/38 text-xs">Booking ID: {booking.id}</p>
                    </div>
                  </div>

                  {canCancel && (
                    <div className="self-start">
                      {cancelConfirmId === booking.id ? (
                        <div
                          className="rounded-2xl px-4 py-3 text-sm"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          <p className="text-white/75 mb-3">Are you sure?</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleCancel(booking)}
                              disabled={cancellingId === booking.id}
                              className="rounded-xl px-3 py-2 text-xs font-semibold"
                              style={{
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#fca5a5',
                              }}
                            >
                              {cancellingId === booking.id ? 'Cancelling...' : 'Yes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelConfirmId(null)}
                              disabled={cancellingId === booking.id}
                              className="rounded-xl px-3 py-2 text-xs font-semibold"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'rgba(255,255,255,0.76)',
                              }}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCancelConfirmId(booking.id)}
                          className="rounded-2xl px-4 py-3 text-sm font-semibold"
                          style={{
                            background: 'rgba(239,68,68,0.12)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#fca5a5',
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
