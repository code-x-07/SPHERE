import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import type { Event } from '../../lib/supabase';
import { CAMPUS_ALT_IMAGES, CAMPUS_IMAGE } from '../../lib/campusVisuals';

interface HeroSlider3DProps {
  events: Event[];
}

export default function HeroSlider3D({ events }: HeroSlider3DProps) {
  const [active, setActive] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const items = events.length > 0 ? events : DEMO_EVENTS;
  const total = items.length;
  const current = items[active];

  function goNext() {
    setActive((index) => (index + 1) % total);
  }

  function goPrev() {
    setActive((index) => (index - 1 + total) % total);
  }

  const imageKey = current.id || String(active);
  const fallbackImage = CAMPUS_ALT_IMAGES[active % CAMPUS_ALT_IMAGES.length] || CAMPUS_IMAGE;
  const currentImage = current.image_url && !failedImages[imageKey] ? current.image_url : fallbackImage;

  return (
    <div className="relative h-[460px] overflow-hidden rounded-[32px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id || active}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img
            src={currentImage}
            alt={current.title}
            className="h-full w-full object-cover"
            draggable={false}
            onError={() => {
              setFailedImages((existing) => (existing[imageKey] ? existing : { ...existing, [imageKey]: true }));
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(9,9,9,0.78) 0%, rgba(9,9,9,0.42) 42%, rgba(9,9,9,0.7) 100%), linear-gradient(180deg, rgba(9,9,9,0.08), rgba(9,9,9,0.72) 100%)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-[1] flex h-full flex-col justify-between p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#dcc4a3]">Upcoming on campus</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">
              Browse what is happening next without the fake 3D treatment.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 backdrop-blur-xl transition-transform duration-200 hover:scale-105"
            >
              <ChevronLeft size={18} className="text-white/72" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 backdrop-blur-xl transition-transform duration-200 hover:scale-105"
            >
              <ChevronRight size={18} className="text-white/72" />
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_240px] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">
              {new Date(current.event_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <h3 className="mt-3 text-4xl font-bold leading-[0.92] text-white md:text-5xl">
              {current.title}
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
              {current.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="premium-stat px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/42">
                  <MapPin size={12} className="text-[#dcc4a3]" />
                  Venue
                </div>
                <p className="mt-2 text-white font-semibold">{current.venue}</p>
              </div>
              <div className="premium-stat px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/42">
                  <Users size={12} className="text-[#dcc4a3]" />
                  Attendance
                </div>
                <p className="mt-2 text-white font-semibold">{current.registered}/{current.capacity}</p>
              </div>
              <div className="premium-stat px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/42">
                  <Calendar size={12} className="text-[#dcc4a3]" />
                  Date
                </div>
                <p className="mt-2 text-white font-semibold">
                  {new Date(current.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {items.slice(0, 4).map((event, index) => {
              const isActive = index === active;

              return (
                <button
                  key={event.id || index}
                  type="button"
                  onClick={() => setActive(index)}
                  className="block w-full text-left"
                >
                  <div
                    className="rounded-[22px] px-4 py-3 transition-all duration-250"
                    style={{
                      background: isActive ? 'rgba(255,248,240,0.12)' : 'rgba(0,0,0,0.18)',
                      border: isActive ? '1px solid rgba(220,196,163,0.28)' : '1px solid rgba(255,255,255,0.08)',
                      transform: isActive ? 'translateX(-10px)' : 'translateX(0)',
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/36">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-white">{event.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const DEMO_EVENTS: Event[] = [
  {
    id: '1',
    title: 'TechFest 2025',
    description: 'A week of builds, demos, and late-night conversations across campus.',
    venue: 'Open Auditorium',
    event_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    capacity: 500,
    registered: 312,
    image_url: CAMPUS_IMAGE,
    tags: ['Tech'],
    organizer_id: '',
    created_at: '',
  },
  {
    id: '2',
    title: 'Cultural Night 2025',
    description: 'Music, dance, and campus energy collected into one evening.',
    venue: 'Main Auditorium',
    event_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    capacity: 300,
    registered: 289,
    image_url: CAMPUS_ALT_IMAGES[0],
    tags: ['Culture'],
    organizer_id: '',
    created_at: '',
  },
  {
    id: '3',
    title: 'Research Symposium',
    description: 'Student and faculty research presented in a calmer academic setting.',
    venue: 'Seminar Hall 3',
    event_date: new Date(Date.now() + 21 * 86400000).toISOString(),
    capacity: 80,
    registered: 45,
    image_url: CAMPUS_ALT_IMAGES[1],
    tags: ['Research'],
    organizer_id: '',
    created_at: '',
  },
  {
    id: '4',
    title: 'Startup Pitch Night',
    description: 'Ideas, prototypes, and sharp feedback from people who actually build.',
    venue: 'Innovation Lab',
    event_date: new Date(Date.now() + 28 * 86400000).toISOString(),
    capacity: 100,
    registered: 67,
    image_url: CAMPUS_ALT_IMAGES[2],
    tags: ['Startup'],
    organizer_id: '',
    created_at: '',
  },
];
