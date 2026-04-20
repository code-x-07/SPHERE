import { useMemo, useState } from 'react';
import type { Booking, Room } from '../../lib/supabase';
import { formatBookingDate, isPastTimeSlot, slotToTimeRange } from '../../lib/roomBooking';

type BookingWithRoom = Booking & {
  room?: Room;
};

interface RoomBookingsListProps {
  bookings: BookingWithRoom[];
  onCancelBooking: (booking: BookingWithRoom) => Promise<void>;
  onBrowseRooms?: () => void;
}

export default function RoomBookingsList({
  bookings,
  onCancelBooking,
  onBrowseRooms,
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
      <div className="rb-empty rb-panel">
        <div className="rb-filter-title">You don&apos;t have any bookings yet.</div>
        <p className="rb-muted">Browse available rooms to make your first booking.</p>
        {onBrowseRooms && (
          <div className="rb-actions" style={{ marginTop: '1rem' }}>
            <button type="button" onClick={onBrowseRooms} className="rb-primary-button">
              Browse Rooms
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="rb-surface rb-bookings-filter">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div className="rb-filter-title">My Bookings</div>
            <p className="rb-muted">
              Showing {visibleBookings.length} booking{visibleBookings.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowApprovedOnly((current) => !current)}
            className={`rb-tab-button ${showApprovedOnly ? 'active' : ''}`}
          >
            {showApprovedOnly ? 'Showing Approved Only' : 'Show Approved Bookings Only'}
          </button>
        </div>
      </div>

      {visibleBookings.length === 0 ? (
        <div className="rb-empty rb-panel">
          <div className="rb-filter-title">No approved bookings found.</div>
          <p className="rb-muted">Turn off the filter to see all booking statuses.</p>
          {onBrowseRooms && (
            <div className="rb-actions" style={{ marginTop: '1rem' }}>
              <button type="button" onClick={onBrowseRooms} className="rb-subtle-button">
                Browse Rooms
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rb-bookings-list">
          {visibleBookings.map((booking) => {
            const range = slotToTimeRange(booking.time_slot);
            const isUpcoming = !isPastTimeSlot(booking.date, booking.time_slot);
            const canCancel =
              isUpcoming && booking.status !== 'rejected' && booking.status !== 'cancelled';

            return (
              <article key={booking.id} className="rb-booking-card">
                <div className="rb-booking-card-header">
                  <div className="rb-booking-title">
                    <h3>{booking.room?.name || booking.room_id}</h3>
                    <div className="rb-badges" style={{ marginTop: '0.6rem' }}>
                      <span className={`rb-badge ${booking.status === 'approved' ? 'approved' : booking.status === 'pending' ? 'pending' : booking.status === 'rejected' ? 'rejected' : 'cancelled'}`}>
                        {getApprovalStatusDisplay(booking.status)}
                      </span>
                      <span className={`rb-badge ${isUpcoming ? 'upcoming' : 'past'}`}>
                        {isUpcoming ? 'Upcoming' : 'Past'}
                      </span>
                    </div>
                  </div>

                  {canCancel && (
                    <div>
                      {cancelConfirmId === booking.id ? (
                        <div className="rb-confirm">
                          <span>Are you sure?</span>
                          <button
                            type="button"
                            onClick={() => handleCancel(booking)}
                            disabled={cancellingId === booking.id}
                            className="rb-danger-button"
                          >
                            {cancellingId === booking.id ? 'Cancelling...' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelConfirmId(null)}
                            disabled={cancellingId === booking.id}
                            className="rb-subtle-button"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCancelConfirmId(booking.id)}
                          className="rb-danger-button"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="rb-detail-grid">
                  <div className="rb-detail-card">
                    <span>Location</span>
                    <p>{booking.room?.location || 'Campus space'}</p>
                  </div>
                  <div className="rb-detail-card">
                    <span>Time Slot</span>
                    <p>
                      {formatBookingDate(booking.date)} · {range.start} - {range.end}
                    </p>
                  </div>
                  <div className="rb-detail-card">
                    <span>Purpose</span>
                    <p>{booking.purpose || 'Not specified'}</p>
                  </div>
                  <div className="rb-detail-card">
                    <span>Booking ID</span>
                    <p>{booking.id}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
