import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Hexagon } from 'lucide-react';
import MagneticButton from '../components/ui/MagneticButton';
import { allowedGoogleDomain, supabase } from '../lib/supabase';
import { useToastStore } from '../store/useToastStore';

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
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', boxShadow: '0 20px 40px rgba(14,165,233,0.3)' }}
          >
            <Hexagon size={28} className="text-white" fill="white" />
          </motion.div>
          <h1 className="text-white text-3xl font-bold" style={{ letterSpacing: '-0.03em' }}>
            SPHERE
          </h1>
          <p className="text-white/40 text-sm mt-1">Campus Event & Space Platform</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          }}
        >
          <div className="text-center mb-6">
            <p className="text-white text-xl font-semibold">Sign in with BITS Google</p>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">
              Access is limited to students and staff using
              <br />
              <span className="text-sky-300 font-medium">@{allowedGoogleDomain}</span>
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
            <p className="text-white/20 text-xs text-center leading-relaxed">
              If Google sign-in opens but access is denied, enable the Google provider in Supabase
              <br />
              and add this site to Supabase Auth redirect URLs.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
