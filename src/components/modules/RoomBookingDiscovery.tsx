import { useEffect, useMemo, useState } from 'react';
import { Building2, ClipboardList, ShieldCheck } from 'lucide-react';
import { supabase, type Booking, type Room } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import GlassCard from '../ui/GlassCard';
import RoomAdminPanel from './RoomAdminPanel';
import RoomBookingPanel from './RoomBookingPanel';
import RoomBookingsList from './RoomBookingsList';
import RoomListBrowser from './RoomListBrowser';

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

  async function fetchRoomData() {
    setLoadingRooms(true);

    const roomQuery = supabase.from('rooms').select('*').order('name');
    const bookingQuery = profile
      ? supabase
          .from('bookings')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] as Booking[] });

    const adminBookingQuery = profile?.role === 'admin'
      ? supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(40)
      : Promise.resolve({ data: [] as Booking[] });

    const [roomResponse, bookingResponse, adminResponse] = await Promise.all([
      roomQuery,
      bookingQuery,
      adminBookingQuery,
    ]);

    const resolvedRooms = (roomResponse.data as Room[]) || [];
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
      const { data: profilesData } = uniqueUserIds.length > 0
        ? await supabase.from('profiles').select('id, email').in('id', uniqueUserIds)
        : { data: [] };
      const emailById = new Map(
        ((profilesData || []) as { id: string; email: string }[]).map((item) => [item.id, item.email])
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
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id);

    if (!error) {
      addToast({
        type: 'success',
        title: 'Booking cancelled',
        message: booking.room?.name || 'Room booking cancelled',
      });
      await fetchRoomData();
    } else {
      addToast({
        type: 'error',
        title: 'Cancellation failed',
        message: error.message,
      });
    }
  }

  async function updateAdminBookingStatus(
    booking: BookingWithRoom,
    status: 'approved' | 'rejected'
  ) {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', booking.id);

    if (!error) {
      addToast({
        type: 'success',
        title: status === 'approved' ? 'Booking approved' : 'Booking rejected',
        message: booking.room?.name || booking.id,
      });
      await fetchRoomData();
    } else {
      addToast({
        type: 'error',
        title: 'Update failed',
        message: error.message,
      });
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard className="overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-4">
            <span className="premium-label">Spatial room layer</span>
            <div>
              <p className="text-white text-4xl font-bold">Book campus rooms as a guided journey.</p>
              <p className="text-white/52 text-sm md:text-base mt-4 max-w-2xl leading-7">
                Browse room inventory, pivot into availability, then transition into approvals and booking memory
                without falling back into plain utilities.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedRoom(null);
                    setActiveTab(tab.id);
                  }}
                  className="inline-flex items-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(103,232,249,0.16), rgba(37,99,235,0.18))'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                    border: `1px solid ${isActive ? 'rgba(103,232,249,0.24)' : 'rgba(255,255,255,0.08)'}`,
                    color: isActive ? '#a5f3fc' : 'rgba(255,255,255,0.72)',
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {activeTab === 'rooms' && (
        selectedRoom ? (
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
          <RoomListBrowser
            rooms={rooms}
            loading={loadingRooms}
            onSelectRoom={setSelectedRoom}
          />
        )
      )}

      {activeTab === 'mybookings' && (
        <RoomBookingsList bookings={myBookings} onCancelBooking={cancelBooking} />
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
  );
}
