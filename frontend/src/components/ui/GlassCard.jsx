import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, ...rest }) {
  const base = 'relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6';
  const bg = { backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)' };
  if (!hover) {
    return (
      <div className={`${base} ${className}`} style={bg} {...rest}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 30px 60px -20px rgba(2,6,23,0.85)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className={`${base} ${className}`}
      style={bg}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
