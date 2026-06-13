import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTests } from '../store/slices/testSlice';
import { addToast } from '../store/slices/uiSlice';
import {
  Play, Clock, ShieldAlert, FileText, CheckCircle2, Filter, Search
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';

const CATEGORIES = ['BTSC', 'SSC', 'Railway', 'BPSC', 'Polytechnic'];

export default function MockTests() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const [search, setSearch] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tests, loading } = useSelector((state) => state.test);

  useEffect(() => { dispatch(fetchTests(selectedCategory)); }, [dispatch, selectedCategory]);

  const filtered = tests.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  const handleConfirmStart = () => {
    if (selectedTest) {
      const testId = selectedTest._id;
      setSelectedTest(null);
      dispatch(addToast({ message: 'Initializing secure proctored environment...', type: 'info' }));
      navigate(`/test/attempt/${testId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Exam <span className="text-gradient">series hub</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">Pick your exam stream and practice with proctored, AI-graded mocks.</p>
      </div>

      {/* Filter row */}
      <GlassCard className="!p-4" hover={false}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mock test titles..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-4 w-4 shrink-0 text-slate-500" />
            <CategoryChip active={selectedCategory === ''} onClick={() => setSelectedCategory('')}>
              All
            </CategoryChip>
            {CATEGORIES.map((cat) => (
              <CategoryChip key={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}>
                {cat}
              </CategoryChip>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-shimmer h-52 rounded-2xl border border-white/5" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((test, i) => (
            <motion.div
              key={test._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <GlassCard className="flex h-full flex-col !p-5">
                <div className="mb-4 flex items-start justify-between">
                  <span className="inline-flex rounded-full bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-neon-cyan ring-1 ring-neon-blue/30">
                    {test.examCategory}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400">
                    -{test.negativeMarking || 0}x
                  </span>
                </div>

                <h3 className="line-clamp-2 font-display text-lg font-semibold text-white">{test.title}</h3>

                <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {test.duration} min
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    {test.questions?.length || 0} MCQs
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTest(test)}
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-blue-purple py-2.5 text-sm font-bold text-white shadow-neon-blue transition hover:-translate-y-0.5"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Start test
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <GlassCard className="!p-16 text-center" hover={false}>
          <FileText className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-sm text-slate-400">No mock tests in this category yet.</p>
        </GlassCard>
      )}

      {/* Instructions modal */}
      <AnimatePresence>
        {selectedTest && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedTest(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4"
            >
              <div className="rounded-2xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-xl md:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/15 p-2.5 text-amber-400">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">Proctored Exam Rules</h3>
                </div>

                <p className="mb-4 text-sm text-slate-300">
                  Before you start <strong className="text-white">{selectedTest.title}</strong>, read the rules:
                </p>

                <ul className="space-y-3 text-sm text-slate-300">
                  {[
                    'Fullscreen is enforced — exiting counts as a violation.',
                    'Tab switches are logged. 3 violations = auto-submit.',
                    'Right-click, copy, and paste are disabled.',
                    'When time runs out, answers submit automatically.'
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedTest(null)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                  <GradientButton onClick={handleConfirmStart} className="!flex-1">
                    Accept & begin
                  </GradientButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-gradient-blue-purple text-white shadow-neon-blue'
          : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
      }`}
    >
      {children}
    </button>
  );
}
