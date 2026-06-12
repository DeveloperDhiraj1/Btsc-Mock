import React from 'react';
import { motion } from 'framer-motion';

export default function GradientButton({ children, as: Component = 'button', variant = 'primary', className = '', ...rest }) {
  const variants = {
    primary: 'text-white shadow-neon-blue',
    ghost: 'border border-white/15 bg-white/5 text-slate-100 backdrop-blur-md hover:border-white/30 hover:bg-white/10 shadow-none'
  };
  const isPrimary = variant === 'primary';
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      className="inline-block"
    >
      <Component
        className={`relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-shadow duration-300 ${variants[variant]} ${className}`}
        style={isPrimary ? { backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' } : undefined}
        {...rest}
      >
        {isPrimary && (
          <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 hover:opacity-100"
                style={{ boxShadow: '0 0 40px rgba(139,92,246,0.6), 0 0 80px rgba(59,130,246,0.3)' }} />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </Component>
    </motion.div>
  );
}
