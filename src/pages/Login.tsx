import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Hexagon, MapPin, Sparkles } from 'lucide-react';
import MagneticButton from '../components/ui/MagneticButton';
import { allowedGoogleDomain, supabase } from '../lib/supabase';
import { useToastStore } from '../store/useToastStore';
import GrainOverlay from '../components/core/GrainOverlay';
import RevealChars from '../components/motion/RevealChars';
import { CAMPUS_IMAGE } from '../lib/campusVisuals';

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.8 2.9l3 2.3c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.4-.2-2H12Z" />
      <path fill="#34A853" d="M12 21.5c2.6 0 4.7-.8 6.3-2.2l-3-2.3c-.8.5-1.9.9-3.3.9-2.5 0-4.7-1.7-5.5-4l-3.1 2.4c1.6 3.1 4.8 5.2 8.6 5.2Z" />
      <path fill="#4A90E2" d="M6.5 13.9c-.2-.5-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3.1-2.4A9.5 9.5 0 0 0 2.4 12c0 1.5.4 2.9 1 4.2l3.1-2.3Z" />
      <path fill="#FBBC05" d="M12 6.1c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.7 3.3 14.6 2.5 12 2.5c-3.8 0-7 2.1-8.6 5.2l3.1 2.4c.8-2.4 3-4 5.5-4Z" />
    </svg>
  );
}

export default function Login() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          scopes: 'email profile',
          queryParams: {
            hd: allowedGoogleDomain,
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        addToast({ type: 'error', title: 'Google Sign-In Failed', message: error.message });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 md:px-8">
      <GrainOverlay opacity={0.18} />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 12% 20%, rgba(220,196,163,0.14), transparent 20%), radial-gradient(circle at 86% 16%, rgba(127,79,86,0.12), transparent 22%), radial-gradient(circle at 56% 84%, rgba(142,160,125,0.1), transparent 24%)',
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-[88vh] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
            <Sparkles size={14} className="text-[#dcc4a3]" />
            <span className="text-[11px] uppercase tracking-[0.28em] text-white/74">BITS Goa student access</span>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-[22px]"
                style={{ background: 'linear-gradient(135deg, #e4c7a0, #b46f51)', boxShadow: '0 24px 60px rgba(180,111,81,0.24)' }}
              >
                <Hexagon size={24} className="text-white" fill="white" />
              </div>
              <div>
                <p className="text-white text-2xl font-bold">SPHERE</p>
                <p className="text-white/35 text-sm">Campus events and spaces, made for BITS Goa</p>
              </div>
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[0.9] text-white md:text-7xl">
              <RevealChars text="A better front door" />
              <br />
              <span style={{ color: '#dcc4a3' }}>
                <RevealChars text="for campus life." delay={0.12} />
              </span>
            </h1>

            <p className="max-w-2xl text-base leading-8 text-white/62 md:text-lg">
              Sign in with your BITS Goa Google account to browse events, claim gate passes,
              access operator mode, and move into room booking without jumping across tools.
            </p>
          </div>

          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
            <div className="premium-stat p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dcc4a3]/16 bg-[#dcc4a3]/10">
                  <MapPin size={16} className="text-[#e6d3ba]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">BITS-only access</p>
                  <p className="text-white/45 text-xs mt-1">Restricted to @{allowedGoogleDomain}</p>
                </div>
              </div>
            </div>
            <div className="premium-stat p-5">
              <p className="text-white/30 text-[11px] uppercase tracking-[0.26em]">What opens after login</p>
              <p className="mt-3 text-white/72 text-sm leading-6">
                Event passes, operator scanning, volunteer workflows, and room booking in one flow.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-h-[620px]"
        >
          <div className="absolute inset-x-6 top-0 bottom-0 rounded-[42px] border border-white/8 bg-white/[0.03] backdrop-blur-2xl" />
          <div className="absolute inset-[22px] overflow-hidden rounded-[38px] border border-white/8">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(12,12,13,0.12), rgba(12,12,13,0.72)), linear-gradient(135deg, rgba(220,196,163,0.08), transparent 40%), url(${CAMPUS_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>

          <div className="absolute right-0 top-8 z-10 max-w-[230px] rounded-[28px] border border-white/10 bg-[#151313]/40 px-5 py-4 backdrop-blur-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">Google access</p>
            <p className="mt-3 text-sm leading-6 text-white/66">
              Only students and staff using the BITS Goa domain can enter this platform.
            </p>
          </div>

          <div className="absolute left-0 bottom-10 z-10 max-w-[260px] rounded-[28px] border border-white/10 bg-[#151313]/40 px-5 py-4 backdrop-blur-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#dcc4a3]">Real campus tone</p>
            <p className="mt-3 text-sm leading-6 text-white/66">
              No floating orb, no tech-demo gimmick. Just a clearer product anchored in a real campus.
            </p>
          </div>

          <div className="absolute inset-x-12 bottom-8 z-20 rounded-[34px] border border-white/10 bg-slate-950/42 p-6 backdrop-blur-2xl">
            <div className="mb-6">
              <p className="text-white text-2xl font-semibold">Continue with BITS Google</p>
              <p className="text-white/45 text-sm mt-2 leading-relaxed">
                Access is reserved for students and staff using <span style={{ color: '#dcc4a3' }} className="font-medium">@{allowedGoogleDomain}</span>.
              </p>
            </div>

            <MagneticButton type="button" disabled={loading} size="lg" className="w-full justify-center" onClick={handleGoogleSignIn}>
              <span className="flex items-center gap-3">
                <GoogleMark />
                {loading ? 'Redirecting to Google...' : 'Continue With Google'}
                {!loading && <ArrowRight size={16} />}
              </span>
            </MagneticButton>

            <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/22 text-xs leading-relaxed">
                If Google sign-in opens but access is denied, enable the Google provider in Supabase and
                add this site to the allowed auth redirect URLs.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
