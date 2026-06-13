import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import {
  BookOpen, Trophy, Compass, Sparkles, AlertTriangle, ArrowRight, Loader2,
  TrendingUp, Bot, Target, Clock
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import AnimatedCounter from '../components/ui/AnimatedCounter';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) setProfile(res.data.data);
      } catch (err) {
        dispatch(addToast({ message: 'Failed to sync dashboard profile', type: 'error' }));
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-neon-cyan" />
      </div>
    );
  }

  const accuracyData = profile?.scores?.map((item, idx) => ({
    name: `T${idx + 1}`,
    accuracy: item.accuracy || 0,
    score: item.score || 0
  })) || [];

  const weakTopics = profile?.weakTopics?.slice(0, 5) || [];
  const recentScores = profile?.scores?.slice(-4).reverse() || [];

  const accuracyRadial = [{ name: 'Accuracy', value: profile?.accuracy || 0, fill: '#a855f7' }];

  return (
    <div className="space-y-6">
      {/* Hero welcome */}
      <motion.div
        initial="hidden" animate="show" variants={fadeUp}
        className="relative overflow-hidden rounded-2xl border border-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 via-neon-purple/20 to-neon-pink/15" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-neon-purple/40 blur-3xl" />
        <div className="absolute -bottom-20 left-20 h-48 w-48 rounded-full bg-neon-blue/30 blur-3xl" />

        <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-neon-cyan" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-200">
                Personalized for you
              </span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
              Welcome back, <span className="text-gradient">{profile?.name?.split(' ')[0]}</span>
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              You've completed <strong className="text-white">{profile?.testsAttempted || 0}</strong> mock exams.
              Keep going — every attempt sharpens your accuracy.
            </p>
          </div>
          <GradientButton as={Link} to="/mock-tests">
            Start next mock <ArrowRight className="h-4 w-4" />
          </GradientButton>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Tests attempted',
            value: profile?.testsAttempted || 0,
            icon: BookOpen,
            gradient: 'from-neon-blue to-neon-violet',
            suffix: ''
          },
          {
            label: 'Avg accuracy',
            value: profile?.accuracy || 0,
            icon: Trophy,
            gradient: 'from-emerald-400 to-emerald-600',
            suffix: '%'
          },
          {
            label: 'Weak topics',
            value: weakTopics.length,
            icon: AlertTriangle,
            gradient: 'from-amber-400 to-rose-500',
            suffix: ''
          },
          {
            label: 'Plan',
            value: profile?.subscriptionPlan?.planType === 'premium' ? 'Pro' : 'Free',
            icon: Compass,
            gradient: 'from-neon-purple to-neon-pink',
            isText: true
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial="hidden" animate="show" custom={i} variants={fadeUp}
          >
            <GlassCard className="!p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold text-white">
                    {stat.isText
                      ? stat.value
                      : <AnimatedCounter to={stat.value} suffix={stat.suffix} />}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-neon-blue`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Accuracy chart */}
        <motion.div initial="hidden" animate="show" custom={1} variants={fadeUp} className="lg:col-span-2">
          <GlassCard className="!p-6" hover={false}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h3 className="font-display text-lg font-semibold text-white">Accuracy progression</h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">
                Last {accuracyData.length || 0} tests
              </span>
            </div>
            {accuracyData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accuracyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="accGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,18,38,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#accGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="Complete your first mock test to unlock analytics." />
            )}
          </GlassCard>
        </motion.div>

        {/* Radial accuracy */}
        <motion.div initial="hidden" animate="show" custom={2} variants={fadeUp}>
          <GlassCard className="!p-6" hover={false}>
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-neon-cyan" />
              <h3 className="font-display text-lg font-semibold text-white">Accuracy gauge</h3>
            </div>
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="65%" outerRadius="100%" data={accuracyRadial} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={20} background={{ fill: 'rgba(255,255,255,0.04)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="font-display text-4xl font-bold text-gradient">
                  <AnimatedCounter to={profile?.accuracy || 0} suffix="%" />
                </p>
                <p className="mt-1 text-xs text-slate-400">Average</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent tests */}
        <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp} className="lg:col-span-2">
          <GlassCard className="!p-6" hover={false}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">Recent attempts</h3>
              <Link to="/profile" className="text-xs font-semibold text-neon-cyan hover:text-neon-blue">
                View all →
              </Link>
            </div>
            {recentScores.length > 0 ? (
              <div className="space-y-2">
                {recentScores.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/10 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold ${
                        s.accuracy >= 75 ? 'bg-emerald-500/15 text-emerald-400'
                        : s.accuracy >= 50 ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {s.accuracy}%
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Mock #{idx + 1}</p>
                        <p className="text-xs text-slate-500">
                          {s.date ? new Date(s.date).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{s.score} <span className="text-xs text-slate-500">/ {s.maxScore}</span></p>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No attempts yet. Start your first mock to see history." />
            )}
          </GlassCard>
        </motion.div>

        {/* AI recommendations */}
        <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp}>
          <GlassCard className="!p-6 h-full" hover={false}>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-gradient-blue-purple blur-md opacity-60" />
                <div className="relative rounded-lg bg-ink-900 p-2 ring-1 ring-white/10">
                  <Bot className="h-4 w-4 text-neon-cyan" />
                </div>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">AI insights</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Powered by Gemini</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-neon-cyan">Focus area</p>
                <p className="text-slate-200">
                  Spend 30 min daily on <strong className="text-white">{weakTopics[0]?.topic || 'foundational topics'}</strong>.
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-neon-purple">Suggested mock</p>
                <p className="text-slate-200">Try a 60-min full mock to track pacing.</p>
              </div>
              <Link
                to="/notes"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 p-3 text-sm font-semibold text-white transition hover:from-neon-blue/20 hover:to-neon-purple/20"
              >
                Generate study notes
                <ArrowRight className="h-4 w-4 text-neon-cyan" />
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <motion.div initial="hidden" animate="show" custom={5} variants={fadeUp}>
          <GlassCard className="!p-6" hover={false}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <h3 className="font-display text-lg font-semibold text-white">Weak topic heatmap</h3>
              </div>
              <Link to="/notes" className="text-xs font-semibold text-neon-cyan hover:text-neon-blue">
                Practice all →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {weakTopics.map((t) => (
                <div
                  key={t.topic}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-rose-500/30 hover:bg-rose-500/[0.04]"
                >
                  <p className="truncate text-sm font-semibold text-white">{t.topic}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400">
                      {t.errorCount} errors
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-slate-400">
      <Sparkles className="h-8 w-8 text-slate-600" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
