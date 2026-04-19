import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Building2, MessageSquare, TrendingUp, Clock, Star, ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import GlassCard from '../components/ui/GlassCard';
import HeroSlider3D from '../components/3d/HeroSlider3D';
import ChatBot from '../components/modules/ChatBot';
import type { Event, Booking } from '../lib/supabase';

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Dashboard() {
  const { profile } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [{ data: evData }, { data: bkData }] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }).limit(10),
      profile ? supabase.from('bookings').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] }),
    ]);
    setEvents((evData as Event[]) || []);
    setBookings((bkData as Booking[]) || []);
    setLoadingEvents(false);
  }

  const stats = [
    { label: 'Upcoming Events', value: events.length || '5', icon: Calendar, color: '#0ea5e9' },
    { label: 'Active Bookings', value: bookings.filter((b) => b.status === 'confirmed').length || '2', icon: Building2, color: '#10b981' },
    { label: 'Events This Month', value: '12', icon: TrendingUp, color: '#f59e0b' },
    { label: 'Hours Volunteered', value: '18', icon: Star, color: '#8b5cf6' },
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
          <p className="text-white/30 text-sm font-medium mb-1">Good to see you,</p>
          <h1
            className="text-white text-3xl font-bold"
            style={{ letterSpacing: '-0.03em' }}
          >
            {profile?.full_name || profile?.email?.split('@')[0] || 'Student'}
          </h1>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                custom={i}
                variants={statVariants}
                initial="hidden"
                animate="visible"
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

            {bookings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <GlassCard>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-sm">Recent Bookings</h3>
                    <Building2 size={15} className="text-white/30" />
                  </div>
                  <div className="space-y-2">
                    {bookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(14,165,233,0.12)' }}
                          >
                            <Building2 size={13} className="text-sky-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{b.room_id}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock size={10} className="text-white/30" />
                              <span className="text-white/30 text-[10px]">{b.date} · {b.time_slot}</span>
                            </div>
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: b.status === 'confirmed' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                            color: b.status === 'confirmed' ? '#34d399' : 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <GlassCard
                padding="p-0"
                className="overflow-hidden"
                style={{ height: showChat ? 520 : 'auto' }}
              >
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.25)' }}
                    >
                      <MessageSquare size={16} className="text-sky-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-semibold">Room Booking Assistant</p>
                      <p className="text-white/35 text-xs">Natural language booking</p>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: showChat ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight size={15} className="text-white/30" />
                  </motion.div>
                </button>

                {showChat && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ height: 452, borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <ChatBot />
                  </motion.div>
                )}
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <GlassCard>
                <h3 className="text-white font-semibold text-sm mb-3">Quick Links</h3>
                <div className="space-y-2">
                  {[
                    { label: 'My Room Bookings', sub: 'View all reservations', icon: Building2 },
                    { label: 'Event Calendar', sub: 'Full schedule view', icon: Calendar },
                    { label: 'My Volunteer History', sub: 'Past applications', icon: Star },
                  ].map((link) => {
                    const Icon = link.icon;
                    return (
                      <motion.button
                        key={link.label}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-left transition-colors hover:bg-white/[0.03]"
                        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <Icon size={14} className="text-white/35 shrink-0" />
                        <div>
                          <p className="text-white/70 text-xs font-medium">{link.label}</p>
                          <p className="text-white/25 text-[10px]">{link.sub}</p>
                        </div>
                        <ChevronRight size={12} className="text-white/20 ml-auto shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
