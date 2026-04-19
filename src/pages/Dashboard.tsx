import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Orbit, Sparkles } from 'lucide-react';
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

  const nextEvent = events[0];

  return (
    <div className="min-h-screen pt-28 pb-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <GlassCard className="overflow-hidden md:p-8" glow glowColor="rgba(103,232,249,0.18)">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <span className="premium-label">
                  <Sparkles size={12} />
                  Sphere Discovery Layer
                </span>
                <div>
                  <p className="text-white/35 text-sm font-medium mb-2">Welcome back</p>
                  <h1 className="text-white text-4xl md:text-5xl font-bold">
                    {profile?.full_name || profile?.email?.split('@')[0] || 'Student'}
                  </h1>
                  <p className="text-white/55 text-sm md:text-base mt-4 max-w-2xl leading-relaxed">
                    A premium campus control surface for events, rooms, operators, and volunteer flows.
                    Start with a booking path, then move through a focused workspace instead of generic cards.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="premium-stat p-4">
                    <p className="text-white/30 text-[11px] uppercase tracking-[0.24em]">Upcoming Events</p>
                    <p className="text-white text-3xl font-bold mt-3">{events.length}</p>
                  </div>
                  <div className="premium-stat p-4">
                    <p className="text-white/30 text-[11px] uppercase tracking-[0.24em]">Next Checkpoint</p>
                    <p className="text-white text-lg font-semibold mt-3">{nextEvent ? 'Live Soon' : 'Idle'}</p>
                    <p className="text-white/45 text-xs mt-1">{nextEvent ? nextEvent.title : 'Create or join an event to begin'}</p>
                  </div>
                  <div className="premium-stat p-4">
                    <p className="text-white/30 text-[11px] uppercase tracking-[0.24em]">Mode Memory</p>
                    <p className="text-white text-lg font-semibold mt-3">{discoveryMode ? discoveryMode.toUpperCase() : 'NONE'}</p>
                    <p className="text-white/45 text-xs mt-1">Your last workspace reopens automatically.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 content-start">
                <div className="premium-stat p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                      <Orbit size={18} className="text-cyan-200" />
                    </div>
                    <div>
                      <p className="text-white text-lg font-semibold">Command Hub</p>
                      <p className="text-white/40 text-sm">Discovery stays ambient while each workspace becomes focused.</p>
                    </div>
                  </div>
                </div>
                <div className="premium-stat p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
                      <CalendarDays size={18} className="text-amber-200" />
                    </div>
                    <div>
                      <p className="text-white text-lg font-semibold">Next Event Pulse</p>
                      <p className="text-white/45 text-sm mt-1">
                        {nextEvent
                          ? `${nextEvent.title} at ${nextEvent.venue}`
                          : 'No live event pulse yet. Create one from the admin workspace.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
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
