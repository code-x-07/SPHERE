import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Orbit, Sparkles } from 'lucide-react';
import GrainOverlay from '../core/GrainOverlay';
import RevealChars from '../motion/RevealChars';
import HeroOrbScene from '../three/HeroOrbScene';
import MagneticButton from '../ui/MagneticButton';

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
            'radial-gradient(circle at 14% 18%, rgba(103,232,249,0.18), transparent 22%), radial-gradient(circle at 84% 16%, rgba(168,85,247,0.18), transparent 20%), radial-gradient(circle at 50% 88%, rgba(52,211,153,0.12), transparent 22%)',
        }}
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div data-parallax="copy" className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75 }}
            className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-200/12 bg-cyan-200/6 px-4 py-2 backdrop-blur-xl"
          >
            <Sparkles size={14} className="text-cyan-200" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
              Sphere Experience Layer
            </span>
          </motion.div>

          <div className="space-y-4">
            <p className="text-white/35 text-sm font-medium">Immersive campus control surface</p>
            <h1 className="max-w-4xl text-5xl font-bold leading-[0.9] text-white md:text-7xl">
              <RevealChars text="Events, operators" />
              <br />
              <span className="text-cyan-300">
                <RevealChars text="and rooms" delay={0.12} />
              </span>
              <br />
              <RevealChars text="as a cinematic journey." delay={0.24} />
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/62 md:text-lg">
              Sphere is no longer framed like a dashboard. It moves like a stage set: layered copy,
              spatial depth, and role-based flows that feel tactile rather than templated.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <MagneticButton size="lg" onClick={onEnterEvents}>
              <span className="flex items-center gap-2">
                Enter Event Layer
                <ArrowRight size={16} />
              </span>
            </MagneticButton>
            <MagneticButton size="lg" variant="ghost" onClick={onEnterRooms}>
              Explore Room Layer
            </MagneticButton>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="premium-stat p-5">
              <p className="text-white/30 text-[11px] uppercase tracking-[0.26em]">Live Events</p>
              <p className="mt-3 text-4xl font-bold text-white">{eventCount}</p>
            </div>
            <div className="premium-stat p-5">
              <p className="text-white/30 text-[11px] uppercase tracking-[0.26em]">Next Pulse</p>
              <p className="mt-3 text-lg font-semibold text-white">{nextEventTitle || 'No live pulse yet'}</p>
            </div>
            <div className="premium-stat p-5">
              <p className="text-white/30 text-[11px] uppercase tracking-[0.26em]">Active Mode</p>
              <p className="mt-3 text-lg font-semibold text-cyan-200">{activeMode ? activeMode.toUpperCase() : 'UNSET'}</p>
            </div>
          </div>
        </div>

        <div data-parallax="orb" className="relative h-[460px] lg:h-[620px]">
          <div className="absolute inset-0 rounded-[40px] border border-white/10 bg-white/[0.03] backdrop-blur-xl" />
          <div className="absolute -left-2 top-8 z-10 max-w-[230px] rounded-[30px] border border-cyan-300/12 bg-slate-950/28 px-5 py-4 backdrop-blur-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/75">Operator Gate</p>
            <p className="mt-3 text-sm leading-6 text-white/68">
              Event-bound scanning, fast feedback loops, and phone-first validation.
            </p>
          </div>
          <div className="absolute bottom-8 right-2 z-10 max-w-[220px] rounded-[30px] border border-emerald-300/10 bg-slate-950/28 px-5 py-4 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/16 bg-emerald-300/10">
                <Orbit size={16} className="text-emerald-200" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Spatial discovery</p>
                <p className="text-white/45 text-xs mt-1">3D orb placeholder ready for Spline swap-in.</p>
              </div>
            </div>
          </div>
          <HeroOrbScene />
        </div>
      </div>
    </section>
  );
}
