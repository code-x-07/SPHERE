import { useMemo, useState } from 'react';
import type { Booking, Room } from '../../lib/supabase';
import { formatBookingDate, slotToTimeRange } from '../../lib/roomBooking';
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

  return (
    <div>
      <div className="rb-surface rb-admin-topbar">
        <div className="rb-section-tabs">
          {(['approvals', 'rooms'] as AdminSection[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSection(item)}
              className={`rb-tab-button ${section === item ? 'active' : ''}`}
            >
              {item === 'approvals' ? 'Booking Approvals' : 'Manage Rooms'}
            </button>
          ))}
        </div>
      </div>

      {section === 'rooms' && (
        <RoomManagementPanel rooms={rooms} onRoomsChanged={onRoomsChanged} />
      )}

      {section === 'approvals' && (
        <div>
          <div className="rb-surface rb-admin-topbar">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div className="rb-filter-title">Booking Approvals</div>
                <p className="rb-muted">{pendingBookings.length} Pending</p>
              </div>

              <div className="rb-status-tabs">
                {([
                  { id: 'pending' as const, count: pendingBookings.length, label: 'Pending' },
                  { id: 'approved' as const, count: approvedBookings.length, label: 'Approved' },
                  { id: 'rejected' as const, count: rejectedBookings.length, label: 'Rejected' },
                ]).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`rb-tab-button ${tab === item.id ? 'active' : ''}`}
                  >
                    {item.label} ({item.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="rb-empty rb-panel">
              <div className="rb-filter-title">
                {tab === 'pending' ? 'No pending booking requests.' : `No ${tab} bookings.`}
              </div>
            </div>
          ) : (
            <div className="rb-admin-list">
              {filteredBookings.map((booking) => {
                const range = slotToTimeRange(booking.time_slot);

                return (
                  <article key={booking.id} className="rb-admin-card">
                    <div className="rb-admin-card-header">
                      <div>
                        <h3>{booking.room?.name || booking.room_id}</h3>
                        <p className="rb-muted" style={{ marginTop: '0.35rem' }}>
                          {booking.room?.location || 'Campus space'}
                        </p>
                      </div>

                      {tab === 'pending' && (
                        <div className="rb-actions">
                          <button
                            type="button"
                            onClick={() => handleUpdate(booking, 'approved')}
                            disabled={processingId === booking.id}
                            className="rb-success-button"
                          >
                            {processingId === booking.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(booking, 'rejected')}
                            disabled={processingId === booking.id}
                            className="rb-danger-button"
                          >
                            {processingId === booking.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="rb-detail-grid">
                      <div className="rb-detail-card">
                        <span>Student Email</span>
                        <p>{booking.user_email || booking.user_id}</p>
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
                        <span>Requested</span>
                        <p>{new Date(booking.created_at).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
