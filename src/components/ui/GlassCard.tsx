import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  glow?: boolean;
  glowColor?: string;
  padding?: string;
}

export default function GlassCard({
  children,
  glow = false,
  glowColor = 'rgba(14,165,233,0.15)',
  padding = 'p-6',
  className = '',
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      className={`rounded-2xl ${padding} ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: glow
          ? `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${glowColor}`
          : '0 20px 60px rgba(0,0,0,0.5)',
        ...rest.style,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
