import { motion } from 'framer-motion';
import { Building2, CalendarRange, ChevronRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

type DiscoveryMode = 'events' | 'rooms' | null;

interface DiscoveryModeSelectorProps {
  mode: DiscoveryMode;
  onChange: (mode: Exclude<DiscoveryMode, null>) => void;
}

const modes = [
  {
    id: 'events' as const,
    title: 'Event Booking',
    subtitle: 'Stay on the current discovery flow for campus events and registrations.',
    accent: '#0ea5e9',
    icon: CalendarRange,
  },
  {
    id: 'rooms' as const,
    title: 'Room Booking',
    subtitle: 'Switch into the reference-style room browser, filters, timeline, and reservation flow.',
    accent: '#10b981',
    icon: Building2,
  },
];

export default function DiscoveryModeSelector({
  mode,
  onChange,
}: DiscoveryModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {modes.map((item, index) => {
        const Icon = item.icon;
        const isActive = mode === item.id;

        return (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onChange(item.id)}
            className="text-left"
          >
            <GlassCard
              glow={isActive}
              glowColor={`${item.accent}30`}
              className="h-full relative overflow-hidden"
              style={{
                border: isActive
                  ? `1px solid ${item.accent}55`
                  : '1px solid rgba(255,255,255,0.09)',
                background: isActive
                  ? `linear-gradient(135deg, ${item.accent}16, rgba(255,255,255,0.04))`
                  : 'rgba(255,255,255,0.04)',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-24 opacity-70"
                style={{
                  background: `radial-gradient(circle at top left, ${item.accent}30, transparent 62%)`,
                }}
              />
              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `${item.accent}18`,
                      border: `1px solid ${item.accent}35`,
                    }}
                  >
                    <Icon size={20} style={{ color: item.accent }} />
                  </div>
                  <div>
                    <p className="text-white text-xl font-bold" style={{ letterSpacing: '-0.03em' }}>
                      {item.title}
                    </p>
                    <p className="text-white/50 text-sm mt-2 max-w-xl">{item.subtitle}</p>
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isActive ? `${item.accent}20` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isActive ? `${item.accent}30` : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <ChevronRight
                    size={16}
                    style={{ color: isActive ? item.accent : 'rgba(255,255,255,0.45)' }}
                  />
                </div>
              </div>
            </GlassCard>
          </motion.button>
        );
      })}
    </div>
  );
}
