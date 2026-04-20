import { useEffect, useMemo, useState } from 'react';
import { Building2, ClipboardList, ShieldCheck } from 'lucide-react';
import { supabase, type Booking, type Room } from '../../lib/supabase';
import { REFERENCE_ROOMS } from '../../lib/roomBooking';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import RoomAdminPanel from './RoomAdminPanel';
import RoomBookingPanel from './RoomBookingPanel';
import RoomBookingsList from './RoomBookingsList';
import RoomListBrowser from './RoomListBrowser';
import './room-booking-reference.css';

type RoomDiscoveryTab = 'rooms' | 'mybookings' | 'admin';

type BookingWithRoom = Booking & {
  room?: Room;
  user_email?: string;
};

const tabs = [
  { id: 'rooms' as const, label: 'Browse Rooms', icon: Building2 },
  { id: 'mybookings' as const, label: 'My Bookings', icon: ClipboardList },
  { id: 'admin' as const, label: 'Admin Panel', icon: ShieldCheck },
];

export default function RoomBookingDiscovery() {
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [myBookings, setMyBookings] = useState<BookingWithRoom[]>([]);
  const [adminBookings, setAdminBookings] = useState<BookingWithRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [activeTab, setActiveTab] = useState<RoomDiscoveryTab>('rooms');

  const availableTabs = useMemo(
    () => tabs.filter((tab) => (tab.id === 'admin' ? profile?.role === 'admin' : true)),
    [profile?.role]
  );

  async function seedReferenceRoomsIfNeeded(existingRooms: Room[]) {
    if (profile?.role !== 'admin') return false;

    const existingNames = new Set(
      existingRooms.map((room) => room.name.trim().toLowerCase())
    );

    const missingRooms = REFERENCE_ROOMS.filter(
      (room) => !existingNames.has(room.name.trim().toLowerCase())
    );

    if (missingRooms.length === 0) {
      return false;
    }

    const { error } = await supabase.from('rooms').insert(
      missingRooms.map((room) => ({
        ...room,
        available: true,
      }))
    );

    if (!error) {
      addToast({
        type: 'success',
        title: 'Reference rooms loaded',
        message: `${missingRooms.length} room${missingRooms.length === 1 ? '' : 's'} added from the room-booking template.`,
      });
      return true;
    }

    addToast({
      type: 'error',
      title: 'Room seeding failed',
      message: error.message,
    });
    return false;
  }

  async function fetchRoomData() {
    setLoadingRooms(true);

    const roomQuery = supabase.from('rooms').select('*').order('name');
    const bookingQuery = profile
      ? supabase
          .from('bookings')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as Booking[] });

    const adminBookingQuery =
      profile?.role === 'admin'
        ? supabase.from('bookings').select('*').order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as Booking[] });

    const [roomResponse, bookingResponse, adminResponse] = await Promise.all([
      roomQuery,
      bookingQuery,
      adminBookingQuery,
    ]);

    let resolvedRooms = (roomResponse.data as Room[]) || [];
    const seeded = await seedReferenceRoomsIfNeeded(resolvedRooms);

    if (seeded) {
      const { data: reseededRooms } = await supabase.from('rooms').select('*').order('name');
      resolvedRooms = (reseededRooms as Room[]) || [];
    }

    const roomById = new Map(resolvedRooms.map((room) => [room.id, room]));

    const resolvedMyBookings = ((bookingResponse.data as Booking[]) || []).map((booking) => ({
      ...booking,
      room: roomById.get(booking.room_id),
      user_email: profile?.email,
    }));

    let resolvedAdminBookings: BookingWithRoom[] = [];

    if (profile?.role === 'admin') {
      const allBookings = (adminResponse.data as Booking[]) || [];
      const uniqueUserIds = Array.from(new Set(allBookings.map((booking) => booking.user_id)));
      const { data: profilesData } =
        uniqueUserIds.length > 0
          ? await supabase.from('profiles').select('id, email').in('id', uniqueUserIds)
          : { data: [] };

      const emailById = new Map(
        ((profilesData || []) as { id: string; email: string }[]).map((item) => [
          item.id,
          item.email,
        ])
      );

      resolvedAdminBookings = allBookings.map((booking) => ({
        ...booking,
        room: roomById.get(booking.room_id),
        user_email: emailById.get(booking.user_id),
      }));
    }

    setRooms(resolvedRooms);
    setMyBookings(resolvedMyBookings);
    setAdminBookings(resolvedAdminBookings);
    setLoadingRooms(false);
  }

  useEffect(() => {
    fetchRoomData();
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    if (activeTab === 'admin' && profile?.role !== 'admin') {
      setActiveTab('rooms');
    }
  }, [activeTab, profile?.role]);

  async function cancelBooking(booking: BookingWithRoom) {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);

    if (!error) {
      addToast({
        type: 'success',
        title: 'Booking cancelled',
        message: booking.room?.name || 'Room booking cancelled',
      });
      await fetchRoomData();
      return;
    }

    addToast({
      type: 'error',
      title: 'Cancellation failed',
      message: error.message,
    });
  }

  async function updateAdminBookingStatus(
    booking: BookingWithRoom,
    status: 'approved' | 'rejected'
  ) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', booking.id);

    if (!error) {
      addToast({
        type: 'success',
        title: status === 'approved' ? 'Booking approved' : 'Booking rejected',
        message: booking.room?.name || booking.id,
      });
      await fetchRoomData();
      return;
    }

    addToast({
      type: 'error',
      title: 'Update failed',
      message: error.message,
    });
  }

  return (
    <div className="rb-shell">
      <div className="rb-surface rb-header">
        <div>
          <h2>Sphere - Room Booking</h2>
          <p>Reserve rooms, review bookings, and manage approvals in one flow.</p>
        </div>

        <div className="rb-nav">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedRoom(null);
                  setActiveTab(tab.id);
                }}
                className={`rb-nav-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rb-panel">
        {activeTab === 'rooms' &&
          (selectedRoom ? (
            <RoomBookingPanel
              room={selectedRoom}
              onBack={() => setSelectedRoom(null)}
              onBookingSuccess={async () => {
                setSelectedRoom(null);
                setActiveTab('mybookings');
                await fetchRoomData();
              }}
            />
          ) : (
            <RoomListBrowser rooms={rooms} loading={loadingRooms} onSelectRoom={setSelectedRoom} />
          ))}

        {activeTab === 'mybookings' && (
          <RoomBookingsList
            bookings={myBookings}
            onCancelBooking={cancelBooking}
            onBrowseRooms={() => setActiveTab('rooms')}
          />
        )}

        {activeTab === 'admin' && profile?.role === 'admin' && (
          <RoomAdminPanel
            bookings={adminBookings}
            rooms={rooms}
            onUpdateStatus={updateAdminBookingStatus}
            onRoomsChanged={fetchRoomData}
          />
        )}
      </div>
    </div>
  );
}
