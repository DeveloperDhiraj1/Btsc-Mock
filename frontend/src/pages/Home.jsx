import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Brain, Sparkles, BookOpenCheck, Video, GraduationCap,
  LineChart, Bot, ShieldCheck, Star, Quote
} from 'lucide-react';
import logo from '../assets/logo.png';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import AIBrainOrb from '../components/ui/AIBrainOrb';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

const stats = [
  { value: 1000, suffix: '+', label: 'Active Students' },
  { value: 500, suffix: '+', label: 'Mock Tests' },
  { value: 5000, suffix: '+', label: 'AI Review Sessions' },
  { value: 98, suffix: '%', label: 'User Satisfaction' },
];

const features = [
  {
    icon: Brain,
    title: 'AI Mock Tests',
    desc: 'Adaptive question sets that match your weak topics in real-time.',
    gradient: 'from-neon-blue to-neon-violet',
  },
  {
    icon: BookOpenCheck,
    title: 'AI Notes Generator',
    desc: 'Topic summaries, flashcards, and revision notes generated on demand.',
    gradient: 'from-neon-purple to-neon-pink',
  },
  {
    icon: Video,
    title: 'Live Classes',
    desc: 'Daily live sessions with top mentors covering BTSC, SSC, RRB & BPSC.',
    gradient: 'from-neon-cyan to-neon-blue',
  },
  {
    icon: GraduationCap,
    title: 'Video Tutorials',
    desc: 'Curated micro-lessons under 10 minutes, organized topic-by-topic.',
    gradient: 'from-neon-violet to-neon-cyan',
  },
  {
    icon: LineChart,
    title: 'Performance Analytics',
    desc: 'Accuracy trends, time-per-question, percentile, and weak-topic heatmaps.',
    gradient: 'from-neon-pink to-neon-purple',
  },
  {
    icon: Bot,
    title: 'AI Tutor Assistant',
    desc: 'Ask anything, get instant doubt-clearing with worked solutions.',
    gradient: 'from-neon-blue to-neon-cyan',
  },
];

const testimonials = [
  {
    name: 'Priyanshu Singh',
    role: 'BTSC Aspirant',
    text: 'The AI weak-topic heatmap completely changed how I revise. Jumped from 58% to 84% accuracy in three weeks.',
    rating: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'SSC JE Civil',
    text: 'Mock tests feel exactly like the real exam. The timed mode + AI explanation after each question is a game-changer.',
    rating: 5,
  },
  {
    name: 'Anjali Kumari',
    role: 'BPSC AE',
    text: 'Live classes plus the AI tutor for late-night doubts — this is the only platform I needed for my prep.',
    rating: 5,
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-100">
      <AnimatedBackground />

      {/* NAV */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-blue-purple blur-md opacity-60" />
            <div className="relative rounded-2xl bg-ink-900/80 p-1.5 ring-1 ring-white/10">
              <img src={logo} alt="StudyNexus" className="h-10 w-10 rounded-xl object-cover" />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">StudyNexus</p>
            <h1 className="font-display text-base font-bold text-white">Platform</h1>
          </div>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 sm:gap-4"
        >
          <Link to="/login" className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:block">
            Login
          </Link>
          <GradientButton as={Link} to="/register">
            Get Started <ArrowRight className="h-4 w-4" />
          </GradientButton>
        </motion.nav>
      </header>

      {/* HERO */}
      <main className="relative z-10 mx-auto max-w-7xl px-6">
        <section className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <motion.div
              initial="hidden" animate="show" variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-neon-cyan" />
              <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-300">
                Powered by StudyNexus
              </span>
            </motion.div>

            <motion.h2
              initial="hidden" animate="show" custom={1} variants={fadeUp}
              className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
            >
              Make your exam prep{' '}
              <span className="text-gradient">smarter with StudyNexus</span>
            </motion.h2>

            <motion.p
              initial="hidden" animate="show" custom={2} variants={fadeUp}
              className="max-w-xl text-lg leading-8 text-slate-300"
            >
              The complete platform for BTSC, SSC, Railway, and BPSC aspirants —
              AI mock tests, instant explanations, performance analytics, and live classes,
              all in one premium dashboard.
            </motion.p>

            <motion.div
              initial="hidden" animate="show" custom={3} variants={fadeUp}
              className="flex flex-wrap items-center gap-4"
            >
              <GradientButton as={Link} to="/register">
                Start Free Mock Test <ArrowRight className="h-4 w-4" />
              </GradientButton>
              <GradientButton as={Link} to="/login" variant="ghost">
                Login
              </GradientButton>
            </motion.div>

            <motion.div
              initial="hidden" animate="show" custom={4} variants={fadeUp}
              className="flex items-center gap-6 pt-4 text-sm text-slate-400"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                No credit card required
              </div>
              <div className="hidden h-4 w-px bg-white/10 sm:block" />
              <div className="hidden items-center gap-2 sm:flex">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                4.9 / 5 from 12K+ students
              </div>
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto flex w-full max-w-md items-center justify-center"
          >
            <AIBrainOrb size={420} />

            {/* Floating info chips */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="absolute left-0 top-12 hidden lg:block"
            >
              <GlassCard className="!p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/20 p-2">
                    <LineChart className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Today's Accuracy</p>
                    <p className="font-semibold text-white">+12.4%</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.7 }}
              className="absolute -right-2 bottom-16 hidden lg:block"
            >
              <GlassCard className="!p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-neon-purple/20 p-2">
                    <Bot className="h-4 w-4 text-neon-purple" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">AI Tutor</p>
                    <p className="font-semibold text-white">Online</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </section>

        {/* STATS */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-100px' }}
          className="mb-24"
        >
          <GlassCard className="!p-8 sm:!p-10">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((s, i) => (
                <motion.div key={s.label} variants={fadeUp} custom={i} className="text-center">
                  <p className="font-display text-3xl font-bold text-gradient md:text-5xl">
                    <AnimatedCounter to={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400 md:text-sm">
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.section>

        {/* FEATURES */}
        <section className="mb-24">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-neon-cyan">Everything you need</p>
            <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
              An <span className="text-gradient">AI-native</span> learning platform
            </h2>
            <p className="mt-4 text-slate-300">
              Six powerful tools that work together to turn every minute of your prep into measurable progress.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }}
                custom={i} variants={fadeUp}
              >
                <GlassCard className="group h-full !p-7">
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} shadow-neon-blue`}>
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{f.desc}</p>
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-neon-cyan opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="mb-24">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-neon-purple">Loved by aspirants</p>
            <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
              Real students, <span className="text-gradient">real results</span>
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }}
                custom={i} variants={fadeUp}
              >
                <GlassCard className="h-full !p-7">
                  <Quote className="h-7 w-7 text-neon-purple/60" />
                  <p className="mt-4 text-sm leading-7 text-slate-200">"{t.text}"</p>
                  <div className="mt-6 flex items-center gap-1">
                    {[...Array(t.rating)].map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-blue-purple font-semibold text-white">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="mb-20"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 p-10 md:p-16">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 via-neon-purple/20 to-neon-pink/20" />
            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-neon-blue/30 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-neon-purple/30 blur-3xl" />
            <div className="relative text-center">
              <h2 className="font-display text-4xl font-bold md:text-5xl">
                Ready to <span className="text-gradient">level up?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Join thousands of students cracking BTSC, SSC, and Railway exams with AI-powered prep.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <GradientButton as={Link} to="/register">
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </GradientButton>
                <GradientButton as={Link} to="/mock-tests" variant="ghost">
                  Browse Mock Tests
                </GradientButton>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-sm text-slate-400 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} StudyNexus — Smart prep for competitive exams.</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/about" className="transition hover:text-white">About</Link>
            <Link to="/terms" className="transition hover:text-white">Terms</Link>
            <Link to="/contact" className="transition hover:text-white">Support</Link>
            <Link to="/privacy" className="transition hover:text-white">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
