import React from 'react';
import { motion } from 'framer-motion';

// Pure-CSS / SVG "3D" AI brain orb — no Three.js required.
// Looks volumetric thanks to layered radial gradients and slow rotation.
export default function AIBrainOrb({ size = 380 }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-blue-purple blur-3xl opacity-40 animate-pulse-glow" />

      {/* Rotating orbit rings */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-6 rounded-full border border-neon-cyan/30" />
        <div className="absolute inset-12 rounded-full border border-neon-purple/30 rotate-45" />
        <div className="absolute inset-20 rounded-full border border-neon-blue/30 -rotate-12" />
        {/* Orbiting dots */}
        <div className="absolute left-1/2 -top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-neon-cyan shadow-neon-blue" />
        <div className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-neon-purple shadow-neon-purple" />
        <div className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rounded-full bg-neon-pink" />
      </motion.div>

      {/* Core orb */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-16 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, #60a5fa 0%, #6366f1 25%, #8b5cf6 55%, #1e1b4b 100%)',
          boxShadow:
            '0 0 80px rgba(99,102,241,0.6), inset -20px -30px 60px rgba(0,0,0,0.5), inset 20px 20px 60px rgba(167,139,250,0.4)',
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute left-[18%] top-[14%] h-1/3 w-1/3 rounded-full opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)' }}
        />
        {/* Neural lines */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-50">
          <defs>
            <linearGradient id="neuralStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#c4b5fd" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#neuralStroke)" strokeWidth="0.5">
            <path d="M20,50 Q50,10 80,50 T20,50" />
            <path d="M30,30 Q50,50 70,30" />
            <path d="M30,70 Q50,50 70,70" />
            <circle cx="20" cy="50" r="1.5" fill="#67e8f9" />
            <circle cx="80" cy="50" r="1.5" fill="#c4b5fd" />
            <circle cx="50" cy="20" r="1.5" fill="#f0abfc" />
            <circle cx="50" cy="80" r="1.5" fill="#67e8f9" />
            <circle cx="30" cy="30" r="1" fill="#fff" />
            <circle cx="70" cy="30" r="1" fill="#fff" />
            <circle cx="30" cy="70" r="1" fill="#fff" />
            <circle cx="70" cy="70" r="1" fill="#fff" />
          </g>
        </svg>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-white/80"
          style={{
            left: `${20 + i * 12}%`,
            top: `${15 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
