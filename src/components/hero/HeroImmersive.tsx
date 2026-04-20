import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
import GrainOverlay from '../core/GrainOverlay';
import RevealChars from '../motion/RevealChars';
import MagneticButton from '../ui/MagneticButton';
import { CAMPUS_IMAGE } from '../../lib/campusVisuals';

gsap.registerPlugin(ScrollTrigger);

interface HeroImmersiveProps {
  eventCount: number;
  activeMode: 'events' | 'rooms' | null;
  nextEventTitle?: string;
  onEnterEvents: () => void;
  onEnterRooms: () => void;
}

export default function HeroImmersive({
  eventCount,
  activeMode,
  nextEventTitle,
  onEnterEvents,
  onEnterRooms,
}: HeroImmersiveProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to('[data-parallax="orb"]', {
        yPercent: -16,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          scrub: true,
          start: 'top top',
          end: 'bottom top',
        },
      });

      gsap.to('[data-parallax="copy"]', {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          scrub: true,
          start: 'top top',
          end: 'bottom top',
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden rounded-[40px] border border-white/8 bg-white/[0.02] px-4 py-8 md:px-8 md:py-10">
      <GrainOverlay opacity={0.22} />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 12% 18%, rgba(220,196,163,0.14), transparent 22%), radial-gradient(circle at 84% 16%, rgba(127,79,86,0.16), transparent 20%), radial-gradient(circle at 56% 88%, rgba(142,160,125,0.12), transparent 22%)',
        }}
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div data-parallax="copy" className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75 }}
            className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl"
          >
            <Sparkles size={14} className="text-[#dcc4a3]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              BITS Goa campus platform
            </span>
          </motion.div>

          <div className="space-y-4">
            <p className="text-white/35 text-sm font-medium">Events, rooms, scanning, and student access in one place</p>
            <h1 className="max-w-4xl text-5xl font-bold leading-[0.9] text-white md:text-7xl">
              <RevealChars text="Made for BITS Goa," />
              <br />
              <span style={{ color: '#dcc4a3' }}>
                <RevealChars text="not for a template." delay={0.12} />
              </span>
              <br />
              <RevealChars text="Run campus life with clarity." delay={0.24} />
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/62 md:text-lg">
              Sphere should feel grounded, local, and useful. Browse campus events, claim passes,
              unlock operator mode, and move into room booking without the site looking like an AI demo.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <MagneticButton size="lg" onClick={onEnterEvents}>
              <span className="flex items-center gap-2">
                Browse Events
                <ArrowRight size={16} />
              </span>
            </MagneticButton>
            <MagneticButton size="lg" variant="ghost" onClick={onEnterRooms}>
              Book Rooms
            </MagneticButton>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="premium-stat p-5">
              <p className="text-white/30 text-[11px] uppercase tracking-[0.26em]">On the calendar</p>
              <p className="mt-3 text-4xl font-bold text-white">{eventCount}</p>
            </div>
            <div className="premium-stat p-5">
              <p className="text-white/30 text-[11px] uppercase tracking-[0.26em]">Next event</p>
              <p className="mt-3 text-lg font-semibold text-white">{nextEventTitle || 'Nothing scheduled yet'}</p>
            </div>
            <div className="premium-stat p-5">
              <p className="text-white/30 text-[11px] uppercase tracking-[0.26em]">Open section</p>
              <p className="mt-3 text-lg font-semibold" style={{ color: '#dcc4a3' }}>
                {activeMode ? activeMode.toUpperCase() : 'CHOOSE ONE'}
              </p>
            </div>
          </div>
        </div>

        <div data-parallax="orb" className="relative h-[460px] lg:h-[620px]">
          <div className="absolute inset-0 overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div
              className="absolute inset-0 scale-[1.03]"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(7,7,7,0.08), rgba(7,7,7,0.66)), linear-gradient(135deg, rgba(216,190,158,0.12), transparent 40%), url(${CAMPUS_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, transparent 24%, rgba(8,8,9,0.24) 48%, rgba(8,8,9,0.78) 100%)',
              }}
            />
          </div>

          <div className="absolute -left-2 top-8 z-10 max-w-[240px] rounded-[30px] border border-white/12 bg-[#171314]/58 px-5 py-4 backdrop-blur-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#dcc4a3]">Campus-facing design</p>
            <p className="mt-3 text-sm leading-6 text-white/68">
              A calmer hero, real imagery, and motion that feels like a product instead of a WebGL experiment.
            </p>
          </div>

          <div className="absolute bottom-8 right-2 z-10 max-w-[260px] rounded-[30px] border border-white/12 bg-[#171314]/62 px-5 py-4 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dcc4a3]/16 bg-[#dcc4a3]/10">
                <MapPin size={16} className="text-[#e6d3ba]" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">BITS Pilani, Goa Campus</p>
                <p className="text-white/45 text-xs mt-1">Ground the product in the place it actually belongs to.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
