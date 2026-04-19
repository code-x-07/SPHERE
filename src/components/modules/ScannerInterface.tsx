import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, CheckCircle2, XCircle, Hash } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

type ScanStatus = 'idle' | 'scanning' | 'valid' | 'invalid' | 'already_scanned';

export default function ScannerInterface() {
  const { profile } = useAuthStore();
  const [cameraAllowed, setCameraAllowed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [manualHash, setManualHash] = useState('');
  const [scannedCode, setScannedCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResetting = useRef(false);

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraAllowed(true);
      setStatus('scanning');
    } catch {
      setCameraAllowed(false);
    }
  }, []);

  useEffect(() => {
    requestCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [requestCamera]);

  async function validateTicket(hash: string) {
    if (!hash.trim() || isResetting.current) return;
    isResetting.current = true;

    const validHashes = ['TICKET-001', 'TICKET-002', 'TICKET-003', 'EVT-VALID-XK91'];
    const alreadyScanned = ['TICKET-USED'];
    let newStatus: ScanStatus;

    if (alreadyScanned.includes(hash.toUpperCase())) {
      newStatus = 'already_scanned';
    } else if (validHashes.includes(hash.toUpperCase()) || hash.length >= 8) {
      newStatus = 'valid';
    } else {
      newStatus = 'invalid';
    }

    setStatus(newStatus);
    setScannedCode(hash);

    if (newStatus === 'valid' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    } else if (newStatus === 'invalid' && navigator.vibrate) {
      navigator.vibrate([300]);
    }

    if (profile) {
      await supabase.from('scan_logs').insert({
        ticket_hash: hash,
        operator_id: profile.id,
        status: newStatus === 'already_scanned' ? 'already_scanned' : newStatus === 'valid' ? 'valid' : 'invalid',
      });
    }

    scanTimeoutRef.current = setTimeout(() => {
      setStatus('scanning');
      setScannedCode('');
      setManualHash('');
      isResetting.current = false;
    }, 900);
  }

  function simulateScan() {
    const samples = ['TICKET-001', 'TICKET-USED', 'BAD', 'EVT-VALID-XK91'];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    validateTicket(pick);
  }

  const overlayConfig = {
    idle: null,
    scanning: null,
    valid: { bg: 'rgba(16,185,129,0.92)', icon: <CheckCircle2 size={72} className="text-white" />, label: 'ACCESS GRANTED' },
    invalid: { bg: 'rgba(239,68,68,0.92)', icon: <XCircle size={72} className="text-white" />, label: 'ACCESS DENIED' },
    already_scanned: { bg: 'rgba(251,191,36,0.9)', icon: <XCircle size={72} className="text-white" />, label: 'ALREADY SCANNED' },
  };

  const overlay = overlayConfig[status];

  return (
    <div className="relative w-full h-full flex flex-col" style={{ minHeight: '100vh', background: '#000' }}>
      {cameraAllowed === false ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <CameraOff size={36} className="text-red-400" />
          </div>
          <div className="text-center">
            <h3 className="text-white font-bold text-lg mb-1" style={{ letterSpacing: '-0.02em' }}>Camera Access Denied</h3>
            <p className="text-white/40 text-sm">Enter ticket hash manually</p>
          </div>

          <div className="w-full max-w-sm">
            <div
              className="flex gap-2 p-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center pl-3">
                <Hash size={15} className="text-white/40" />
              </div>
              <input
                value={manualHash}
                onChange={(e) => setManualHash(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && validateTicket(manualHash)}
                placeholder="Enter Hash (e.g. TICKET-001)"
                className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none py-3 font-mono"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => validateTicket(manualHash)}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
              >
                Validate
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {scannedCode && overlay && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm p-4 rounded-xl flex items-center gap-3"
                style={{
                  background: status === 'valid' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${status === 'valid' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}
              >
                {overlay.icon && <div className="scale-50 -m-3">{overlay.icon}</div>}
                <div>
                  <p className="text-white font-bold text-sm">{overlay.label}</p>
                  <p className="text-white/40 text-xs font-mono">{scannedCode}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ position: 'absolute', inset: 0 }}
            muted
            playsInline
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="mb-6 text-center">
              <h3 className="text-white font-bold text-xl tracking-tight drop-shadow-lg">QR Scanner</h3>
              <p className="text-white/60 text-sm mt-1 drop-shadow">Point camera at ticket QR code</p>
            </div>

            <div className="relative" style={{ width: 240, height: 240 }}>
              <div className="absolute inset-0 rounded-2xl" style={{ border: '2px solid rgba(255,255,255,0.3)' }} />
              {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                <div
                  key={i}
                  className={`absolute w-8 h-8 ${pos}`}
                  style={{
                    borderTop: i < 2 ? '3px solid #0ea5e9' : 'none',
                    borderBottom: i >= 2 ? '3px solid #0ea5e9' : 'none',
                    borderLeft: i % 2 === 0 ? '3px solid #0ea5e9' : 'none',
                    borderRight: i % 2 === 1 ? '3px solid #0ea5e9' : 'none',
                    borderRadius: i === 0 ? '12px 0 0 0' : i === 1 ? '0 12px 0 0' : i === 2 ? '0 0 0 12px' : '0 0 12px 0',
                  }}
                />
              ))}
              {status === 'scanning' && (
                <motion.div
                  animate={{ y: [0, 200, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-2 right-2 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)', top: 8 }}
                />
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={simulateScan}
              className="mt-8 px-8 py-3 rounded-xl font-semibold text-white text-sm flex items-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Camera size={16} />
              Simulate Scan (Demo)
            </motion.button>
          </div>

          <AnimatePresence>
            {overlay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
                style={{ background: overlay.bg, backdropFilter: 'blur(4px)' }}
              >
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {overlay.icon}
                </motion.div>
                <p className="text-white font-black text-3xl tracking-widest">{overlay.label}</p>
                <p className="text-white/70 font-mono text-sm">{scannedCode}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
