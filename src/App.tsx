import { useEffect, useState } from 'react';
import { allowedGoogleDomain, isValidDomain, supabase } from './lib/supabase';
import { useAuthStore } from './store/useAuthStore';
import { useToastStore } from './store/useToastStore';
import { useTimeStore } from './store/useTimeStore';
import AmbientBackground from './components/3d/AmbientBackground';
import NavBar from './components/ui/NavBar';
import ToastContainer from './components/ui/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import VolunteerPage from './pages/VolunteerPage';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon } from 'lucide-react';

function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: '#050505' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            boxShadow: '0 20px 40px rgba(14,165,233,0.3)',
          }}
        >
          <Hexagon size={28} className="text-white" fill="white" />
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)' }}
        />
      </motion.div>
    </div>
  );
}

export default function App() {
  const { profile, loading, initialized, setLoading, fetchProfile } = useAuthStore();
  const { addToast } = useToastStore();
  const { syncTime } = useTimeStore();
  const [currentPage, setCurrentPage] = useState('discovery');

  useEffect(() => {
    syncTime();

    const handleAuthorizedSession = async (email: string | undefined, userId: string) => {
      if (!email || !isValidDomain(email)) {
        await supabase.auth.signOut();
        setLoading(false);
        useAuthStore.setState({ profile: null, initialized: true });
        addToast({
          type: 'error',
          title: 'BITS Goa Account Required',
          message: `Please sign in with your @${allowedGoogleDomain} Google account.`,
        });
        return;
      }

      await fetchProfile(userId);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          await handleAuthorizedSession(session.user.email, session.user.id);
        } else {
          setLoading(false);
          useAuthStore.setState({ profile: null, initialized: true });
        }
      })();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthorizedSession(session.user.email, session.user.id);
      } else {
        setLoading(false);
        useAuthStore.setState({ initialized: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [addToast, fetchProfile, setLoading, syncTime]);

  useEffect(() => {
    if (profile) {
      if (profile.role === 'operator') {
        setCurrentPage('scanner');
      } else {
        setCurrentPage('discovery');
      }
    }
  }, [profile?.id]);

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  const renderPage = () => {
    if (!profile) return <Login />;
    switch (currentPage) {
      case 'discovery': return <Dashboard />;
      case 'scanner': return <Scanner />;
      case 'volunteer': return <VolunteerPage />;
      default: return <Dashboard />;
    }
  };

  if (!initialized || loading) return <LoadingScreen />;

  return (
    <div className="relative min-h-screen" style={{ background: '#050505' }}>
      <AmbientBackground />

      {profile && (
        <NavBar currentPage={currentPage} onNavigate={setCurrentPage} />
      )}

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={profile ? currentPage : 'login'}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      <ToastContainer />
    </div>
  );
}
