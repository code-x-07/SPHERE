import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase, isValidDomain } from '../lib/supabase';
import { useToastStore } from '../store/useToastStore';
import MagneticButton from '../components/ui/MagneticButton';

export default function Login() {
  const { addToast } = useToastStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [domainError, setDomainError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDomainError(false);

    if (!isValidDomain(email)) {
      setDomainError(true);
      addToast({
        type: 'error',
        title: 'Unauthorized Domain',
        message: 'Only university email addresses are permitted. Public email providers are blocked.',
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
            if (signUpError) {
              addToast({ type: 'error', title: 'Login Failed', message: signUpError.message });
            } else if (signUpData.user) {
              const role = email.startsWith('admin@') ? 'admin'
                : email.startsWith('operator@') ? 'operator'
                : 'student';
              await supabase.from('profiles').upsert({
                id: signUpData.user.id,
                email,
                full_name: fullName || email.split('@')[0],
                role,
              });
              addToast({ type: 'success', title: 'Account Created!', message: 'Welcome to SPHERE.' });
            }
          } else {
            addToast({ type: 'error', title: 'Login Failed', message: error.message });
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          addToast({ type: 'error', title: 'Sign Up Failed', message: error.message });
        } else if (data.user) {
          const role = email.startsWith('admin@') ? 'admin'
            : email.startsWith('operator@') ? 'operator'
            : 'student';
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: fullName || email.split('@')[0],
            role,
          });
          addToast({ type: 'success', title: 'Account Created!', message: 'Welcome to SPHERE.' });
        }
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
          <h1
            className="text-white text-3xl font-bold"
            style={{ letterSpacing: '-0.03em' }}
          >
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
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setDomainError(false); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 relative"
                style={{
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.35)',
                }}
              >
                {mode === m && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.3)' }}
                  />
                )}
                <span className="relative z-10 capitalize">{m === 'signup' ? 'Create Account' : 'Sign In'}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <label className="block text-white/45 text-xs mb-1.5 font-medium">Full Name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-white/45 text-xs mb-1.5 font-medium">University Email</label>
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setDomainError(false); }}
                required
                type="email"
                placeholder="you@university.edu"
                className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none px-4 py-3 rounded-xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${domainError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: domainError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
                }}
              />
              <AnimatePresence>
                {domainError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1.5 mt-2"
                  >
                    <AlertCircle size={12} className="text-red-400" />
                    <span className="text-red-400 text-xs">Public email providers are not permitted on this platform.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-white/45 text-xs mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-transparent text-white text-sm placeholder-white/20 outline-none px-4 py-3 pr-12 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <MagneticButton type="submit" disabled={loading} size="lg" className="w-full justify-center mt-2">
              <span className="flex items-center gap-2">
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <ArrowRight size={16} />
                  </motion.div>
                ) : (
                  <ArrowRight size={16} />
                )}
                {mode === 'login' ? 'Sign In to SPHERE' : 'Create Account'}
              </span>
            </MagneticButton>
          </form>

          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/20 text-xs text-center leading-relaxed">
              Access restricted to verified university email domains only.
              <br />Alumni and personal emails are blocked by policy.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          {[
            { label: 'Demo Student', email: 'student@university.edu', pass: 'demo1234' },
            { label: 'Demo Admin', email: 'admin@university.edu', pass: 'demo1234' },
            { label: 'Demo Operator', email: 'operator@university.edu', pass: 'demo1234' },
          ].map((demo) => (
            <motion.button
              key={demo.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setEmail(demo.email); setPassword(demo.pass); setMode('login'); }}
              className="flex-1 py-2 rounded-lg text-[10px] font-medium text-white/30 hover:text-white/60 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {demo.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
