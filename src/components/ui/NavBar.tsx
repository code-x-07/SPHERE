import { motion } from 'framer-motion';
import { LayoutDashboard, Users, LogOut, Hexagon } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface NavBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function NavBar({ currentPage, onNavigate }: NavBarProps) {
  const { profile, signOut } = useAuthStore();

  const navItems = [
    { id: 'discovery', label: 'Discovery', icon: LayoutDashboard, roles: ['student', 'admin'] },
    { id: 'volunteer', label: 'Volunteer', icon: Users, roles: ['student', 'admin'] },
  ];

  const visibleItems = navItems.filter(
    (item) => profile && item.roles.includes(profile.role)
  );

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        background: 'rgba(5,5,5,0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={() => onNavigate('discovery')}
        className="flex items-center gap-2.5 group"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
        >
          <Hexagon size={16} className="text-white" fill="white" />
        </div>
        <span
          className="text-white font-bold text-lg tracking-tight"
          style={{ letterSpacing: '-0.03em' }}
        >
          SPHERE
        </span>
      </button>

      <div className="flex items-center gap-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                background: isActive ? 'rgba(14,165,233,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(14,165,233,0.25)' : '1px solid transparent',
              }}
            >
              <Icon size={15} />
              <span className="hidden sm:block">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(14,165,233,0.06)' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {profile && (
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-white text-xs font-semibold leading-none">{profile.full_name || profile.email.split('@')[0]}</p>
              <p className="text-white/35 text-[10px] mt-0.5 capitalize">{profile.role}</p>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
            >
              {(profile.full_name || profile.email)[0].toUpperCase()}
            </div>
          </div>
        )}
        <motion.button
          onClick={signOut}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <LogOut size={14} />
        </motion.button>
      </div>
    </motion.nav>
  );
}
