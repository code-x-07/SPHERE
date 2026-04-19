import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import GlassCard from '../components/ui/GlassCard';
import HeroSlider3D from '../components/3d/HeroSlider3D';
import DiscoveryModeSelector from '../components/modules/DiscoveryModeSelector';
import RoomBookingDiscovery from '../components/modules/RoomBookingDiscovery';
import type { Event } from '../lib/supabase';

export default function Dashboard() {
  const { profile } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [discoveryMode, setDiscoveryMode] = useState<'events' | 'rooms' | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [{ data: evData }] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }).limit(10),
    ]);
    setEvents((evData as Event[]) || []);
    setLoadingEvents(false);
  }

  const stats = [
    { label: 'Upcoming Events', value: events.length || '5', icon: Calendar, color: '#0ea5e9' },
    { label: 'Trending This Week', value: '8', icon: Sparkles, color: '#10b981' },
    { label: 'Seats Reserved', value: '124', icon: Ticket, color: '#f59e0b' },
    { label: 'Volunteer Openings', value: '18', icon: Users, color: '#8b5cf6' },
  ];

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
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <GlassCard padding="p-4" className="h-full">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30` }}
                      >
                        <Icon size={16} style={{ color: stat.color }} />
                      </div>
                      <p
                        className="text-white text-2xl font-bold"
                        style={{ letterSpacing: '-0.03em' }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-white/35 text-xs mt-0.5">{stat.label}</p>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-lg" style={{ letterSpacing: '-0.02em' }}>
                      Upcoming Events
                    </h2>
                    <span className="text-white/30 text-xs">Drag to explore</span>
                  </div>
                  {loadingEvents ? (
                    <div className="h-[460px] flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                    </div>
                  ) : (
                    <HeroSlider3D events={events} />
                  )}
                </motion.div>
              </div>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <GlassCard>
                    <h3 className="text-white font-semibold text-sm mb-3">Discovery Notes</h3>
                    <div className="space-y-2 text-sm text-white/55">
                      <p>Event booking keeps the original carousel flow and event exploration.</p>
                      <p>Room booking has been separated so it only appears when you choose that path above.</p>
                    </div>
                  </GlassCard>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <GlassCard>
                    <h3 className="text-white font-semibold text-sm mb-3">Quick Links</h3>
                    <div className="space-y-2 text-sm text-white/55">
                      <p>Volunteer tab for student applications.</p>
                      <p>Scanner tab for operator check-ins.</p>
                      <p>Switch back to Room Booking any time from the chooser above.</p>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>
            </div>
          </>
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
