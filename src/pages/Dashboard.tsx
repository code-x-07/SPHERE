import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import GlassCard from '../components/ui/GlassCard';
import DiscoveryModeSelector from '../components/modules/DiscoveryModeSelector';
import RoomBookingDiscovery from '../components/modules/RoomBookingDiscovery';
import type { Event } from '../lib/supabase';
import EventBookingDiscovery from '../components/modules/EventBookingDiscovery';

interface DashboardProps {
  onOpenScanner: () => void;
}

export default function Dashboard({ onOpenScanner }: DashboardProps) {
  const { profile } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [discoveryMode, setDiscoveryMode] = useState<'events' | 'rooms' | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.sessionStorage.getItem('sphere-discovery-mode');
    return stored === 'events' || stored === 'rooms' ? stored : null;
  });

  useEffect(() => {
    void fetchData();

    const channel = supabase
      .channel('sphere-events-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          void fetchData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (discoveryMode) {
      window.sessionStorage.setItem('sphere-discovery-mode', discoveryMode);
    } else {
      window.sessionStorage.removeItem('sphere-discovery-mode');
    }
  }, [discoveryMode]);

  async function fetchData() {
    const [{ data: evData }] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }),
    ]);
    setEvents((evData as Event[]) || []);
    setLoadingEvents(false);
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <p className="text-white/30 text-sm font-medium mb-1">Discovery workspace for</p>
          <h1
            className="text-white text-3xl font-bold"
            style={{ letterSpacing: '-0.03em' }}
          >
            {profile?.full_name || profile?.email?.split('@')[0] || 'Student'}
          </h1>
          <p className="text-white/45 text-sm mt-3 max-w-2xl">
            Choose your booking path first. Event booking keeps the existing discovery experience,
            while room booking opens the reference-style room browser and slot picker.
          </p>
        </motion.div>

        <div className="mb-8">
          <DiscoveryModeSelector mode={discoveryMode} onChange={setDiscoveryMode} />
        </div>

        {discoveryMode === 'events' && (
          <EventBookingDiscovery
            events={events}
            loading={loadingEvents}
            onRefresh={fetchData}
            onOpenScanner={onOpenScanner}
          />
        )}

        {discoveryMode === 'rooms' && (
          <div className="mt-2">
            <RoomBookingDiscovery />
          </div>
        )}

        {discoveryMode === null && (
          <GlassCard className="mt-2 text-center py-14" glow glowColor="rgba(14,165,233,0.22)">
            <div className="max-w-2xl mx-auto">
              <p className="text-white text-2xl font-bold" style={{ letterSpacing: '-0.03em' }}>
                Start with a booking type
              </p>
              <p className="text-white/45 text-sm mt-3">
                Pick Event Booking to continue through the existing discovery flow, or Room Booking
                to open the new room browser modeled on the reference project.
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
