import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-ink-900" />
      <div className="absolute inset-0 bg-mesh-dark opacity-90" />
      <div className="absolute inset-0 bg-grid-fade bg-grid opacity-[0.25] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-neon-blue/25 blur-[120px] animate-float-slow" />
      <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-neon-purple/25 blur-[120px] animate-float-fast" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-neon-cyan/15 blur-[120px] animate-float-slow" />
    </div>
  );
}
