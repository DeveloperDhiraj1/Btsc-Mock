import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, ShieldAlert, Cpu, Trophy, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Home() {
  const exams = [
    { name: 'BTSC (Bihar Technical)', desc: 'Lab Assistant recruitment exams' },
    { name: 'SSC JE (Civil/Mech/Elec)', desc: 'Central technical & engineering mocks' },
    { name: 'Railway RRB (JE/SSE)', desc: 'Railway recruitment board patterns' },
    { name: 'BPSC (Technical/AE)', desc: 'Bihar Public Service Commission AE syllabus' },
    { name: 'Polytechnic Entrance', desc: 'State board entrance exam test series' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-sky-600 via-primary-600 to-transparent opacity-90" />
      <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/15 p-1 shadow-lg shadow-slate-950/20 overflow-hidden">
            <img src={logo} alt="StudyNexus logo" className="h-12 w-12 rounded-xl object-cover" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300">StudyNexus</p>
            <h1 className="text-lg font-bold">Next-generation exam prep</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-slate-200 hover:text-white transition-colors">
            Login
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-slate-950/15 transition-transform hover:-translate-y-0.5"
          >
            Join Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-100">
              <Brain className="w-4 h-4 text-cyan-300" />
              AI-Driven Exam Strategy
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
                Make Your Exam Preparation Smarter & Faster.
              </h2>
              <p className="max-w-2xl text-lg text-slate-200/90 leading-8">
                Your Complete Exam Preparation Platform
                Prepare for BTSC, SSC, Railway, and BPSC with Mock Tests, AI Insights, Detailed Analytics, Study Materials, and Real Exam-Like Practice.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 transition"
              >
                Start Free Mock
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-slate-100 hover:border-white/40 hover:bg-white/15 transition"
              >
                Student Login
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)]">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Coverage</p>
                <h3 className="mt-4 text-2xl font-semibold">BTSC, SSC, RRB, BPSC and Polytechnic</h3>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)]">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Live Insights</p>
                <h3 className="mt-4 text-2xl font-semibold">Live leaderboard and performance tracker</h3>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)]">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Fast Review</p>
                <h3 className="mt-4 text-2xl font-semibold">AI explanations after each test</h3>
              </div>
            </div>
          </div>

          <div className="relative rounded-[32px] border border-white/10 bg-slate-900/70 p-8 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute -left-10 bottom-10 h-28 w-28 rounded-full bg-primary-500/20 blur-3xl" />
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-slate-200">
                <div className="grid h-12 w-12 place-items-center rounded-3xl bg-white/10 text-cyan-300">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Smart Mock Engine</p>
                  <h3 className="text-xl font-bold">Daily practice with exact exam feel</h3>
                </div>
              </div>

              <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Mock Attempts</span>
                  <span className="font-semibold text-white">1K+</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>AI Review Sessions</span>
                  <span className="font-semibold text-white">1K</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Verified Users</span>
                  <span className="font-semibold text-white">1.5K</span>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-950/90 p-5 border border-slate-800">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Featured Exam</p>
                <h4 className="mt-3 text-2xl font-semibold">BTSC JE Full Mock</h4>
                <p className="mt-2 text-sm text-slate-300">AI-backed questions, timed mode, and instant topic analysis.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-primary-500/10 p-4 text-slate-100">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Duration</p>
                    <p className="mt-2 font-semibold">120 mins</p>
                  </div>
                  <div className="rounded-2xl bg-cyan-500/10 p-4 text-slate-100">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Questions</p>
                    <p className="mt-2 font-semibold">100</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24 rounded-[40px] border border-white/10 bg-slate-900/70 p-10 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Supported Exam Series</p>
            <h2 className="mt-4 text-4xl font-bold text-white">Your perfect practice hub</h2>
            <p className="mt-4 text-slate-300 leading-7">
              Score improvement, topic mastery, and exam-day confidence — all in  one Platform. Choose your test series and start improving from day one.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((ex, index) => (
              <div key={index} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-left shadow-xl shadow-slate-950/20 transition hover:-translate-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Exam</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">{ex.name}</h3>
                  </div>
                  <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{ex.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-slate-950/80 py-8 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>© 2026 StudyNexus — Competitive exam prep for Bihar and national technical recruitment.</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <Link to="/about" className="hover:text-white transition">About</Link>
            <Link to="/terms" className="hover:text-white transition">Terms</Link>
            <Link to="/contact" className="hover:text-white transition">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
