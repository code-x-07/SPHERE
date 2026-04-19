import { motion } from 'framer-motion';
import { Zap, Shield, Activity } from 'lucide-react';
import ScannerInterface from '../components/modules/ScannerInterface';

export default function Scanner() {
  return (
    <div className="min-h-screen pt-16 flex flex-col">
      <div className="absolute top-20 left-0 right-0 z-10 px-4 pointer-events-none">
        <div className="max-w-sm mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl mb-3"
            style={{
              background: 'rgba(5,5,5,0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-2">
              <Shield size={13} className="text-sky-400" />
              <span className="text-white/60 text-xs font-medium">Operator Mode</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-medium">Redis Live</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap size={11} className="text-amber-400" />
                <span className="text-amber-400 text-[10px]">&lt;50ms</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 relative">
        <ScannerInterface />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="absolute bottom-6 left-0 right-0 z-20 px-4 pointer-events-none"
      >
        <div className="max-w-sm mx-auto">
          <div
            className="flex items-center justify-around px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(5,5,5,0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {[
              { label: 'Scanned Today', value: '47', color: 'text-sky-400' },
              { label: 'Valid', value: '45', color: 'text-emerald-400' },
              { label: 'Invalid', value: '2', color: 'text-red-400' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-base font-bold ${s.color}`} style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
                <p className="text-white/30 text-[9px] mt-0.5">{s.label}</p>
              </div>
            ))}
            <div
              className="w-px h-8 self-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
            <div className="flex items-center gap-1.5">
              <Activity size={11} className="text-sky-400 animate-pulse" />
              <span className="text-white/40 text-[9px]">Live</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
