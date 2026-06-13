import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { createSocket } from '../services/socket';
import { Trophy, Medal, Star, Loader2, Crown } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

const CATEGORIES = ['BTSC', 'SSC', 'Railway', 'BPSC', 'Polytechnic'];

export default function Leaderboard() {
  const [examCategory, setExamCategory] = useState('BTSC');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    socketRef.current = createSocket();
    socketRef.current.emit('join_leaderboard', { examCategory });
    socketRef.current.on('leaderboard_update', ({ examCategory: updatedCategory, rankings: updatedRankings }) => {
      if (updatedCategory === examCategory) {
        setRankings(updatedRankings);
        setLoading(false);
      }
    });
    const fallback = [
      { name: 'Amit Kumar Dev', score: 96.50, rank: 1 },
      { name: 'Rohan Singh', score: 88.00, rank: 2 },
      { name: 'Vikram Sinha', score: 84.75, rank: 3 },
      { name: 'Saba Parveen', score: 81.50, rank: 4 },
      { name: 'Dhiraj Kumar (You)', score: 78.00, rank: 5 }
    ];
    setTimeout(() => {
      setRankings((prev) => prev.length > 0 ? prev : fallback);
      setLoading(false);
    }, 600);
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [examCategory]);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          <span className="text-gradient">Topper</span> rankings
        </h1>
        <p className="mt-2 text-sm text-slate-400">Real-time leaderboard across active students.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setExamCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              examCategory === cat
                ? 'bg-gradient-blue-purple text-white shadow-neon-blue'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {top3.map((u, i) => {
            const styles = [
              { gradient: 'from-amber-400 to-orange-500', icon: Crown, label: '1st' },
              { gradient: 'from-slate-300 to-slate-500', icon: Medal, label: '2nd' },
              { gradient: 'from-orange-600 to-amber-800', icon: Medal, label: '3rd' }
            ][i];
            const Icon = styles.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className={`!p-5 ${i === 0 ? 'sm:-translate-y-2' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${styles.gradient} shadow-neon-blue`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-display text-xl font-bold text-white">{u.score.toFixed(2)}</span>
                  </div>
                  <p className="mt-4 font-display text-base font-bold text-white">{u.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{styles.label} place</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      <GlassCard className="!p-0 overflow-hidden" hover={false}>
        <div className="grid grid-cols-12 border-b border-white/5 bg-white/[0.02] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          <div className="col-span-2">Rank</div>
          <div className="col-span-7">Candidate</div>
          <div className="col-span-3 text-right">Score</div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-cyan" />
          </div>
        ) : rest.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No more rankings yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {rest.map((u, i) => {
              const isYou = u.name.includes('(You)');
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`grid grid-cols-12 items-center px-6 py-3 text-sm transition ${
                    isYou ? 'bg-neon-blue/10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="col-span-2 font-mono text-base font-bold text-slate-400">#{u.rank}</div>
                  <div className="col-span-7">
                    <span className={`font-semibold ${isYou ? 'text-neon-cyan' : 'text-white'}`}>{u.name}</span>
                  </div>
                  <div className="col-span-3 text-right font-mono font-bold text-white">{u.score.toFixed(2)}</div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard className="!p-5">
        <div className="flex items-start gap-3">
          <Star className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-display text-sm font-bold text-white">Rank calculation</p>
            <p className="mt-1 text-xs text-slate-400">
              Sorted by highest score. On ties, faster attempt time wins.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
