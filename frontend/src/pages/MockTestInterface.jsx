import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  startTestAttempt, submitTestAttempt, saveAnswer, selectQuestion, clearActiveTest
} from '../store/slices/testSlice';
import { addToast } from '../store/slices/uiSlice';
import { createSocket } from '../services/socket';
import {
  Loader2, AlertOctagon, HelpCircle, Check, ArrowRight, ArrowLeft,
  Bookmark, Clock, X, Maximize2
} from 'lucide-react';
import logo from '../assets/logo.png';

export default function MockTestInterface() {
  const { testId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeTest, activeAttemptAnswers, currentQuestionIndex, submitting } = useSelector((s) => s.test);
  const { user } = useSelector((s) => s.auth);

  const [remainingTime, setRemainingTime] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const socketRef = useRef(null);
  const containerRef = useRef(null);
  const questionStartTimeRef = useRef(Date.now());

  useEffect(() => {
    dispatch(startTestAttempt(testId));
    return () => {
      dispatch(clearActiveTest());
      if (socketRef.current) {
        socketRef.current.emit('leave_exam', { userId: user?.id, testId });
        socketRef.current.disconnect();
      }
    };
  }, [dispatch, testId, user?.id]);

  useEffect(() => {
    if (!activeTest) return;
    const enterFullscreen = async () => {
      try {
        if (containerRef.current?.requestFullscreen) await containerRef.current.requestFullscreen();
      } catch (err) {
        dispatch(addToast({ message: 'Please allow fullscreen mode to attempt this exam.', type: 'info' }));
      }
    };
    enterFullscreen();

    const preventCheatingKeys = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventCheatingKeys);
    document.addEventListener('copy', preventCheatingKeys);
    document.addEventListener('paste', preventCheatingKeys);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationCount((prev) => {
          const nextCount = prev + 1;
          if (socketRef.current) {
            socketRef.current.emit('proctor_violation', {
              userId: user?.id, testId, violationType: 'tab_switch', count: nextCount
            });
          }
          return nextCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', preventCheatingKeys);
      document.removeEventListener('copy', preventCheatingKeys);
      document.removeEventListener('paste', preventCheatingKeys);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [activeTest, testId, user?.id, dispatch]);

  useEffect(() => {
    if (!activeTest) return;
    setRemainingTime(activeTest.duration * 60);
    socketRef.current = createSocket();
    socketRef.current.emit('join_exam', { userId: user?.id, testId, duration: activeTest.duration });

    socketRef.current.on('timer_tick', ({ remaining }) => setRemainingTime(remaining));
    socketRef.current.on('force_submit_exam', () => {
      dispatch(addToast({ message: 'Exam auto-submitted due to proctor violations.', type: 'error' }));
      triggerSubmit();
    });
    socketRef.current.on('timer_expired', () => {
      dispatch(addToast({ message: 'Time expired! Submitting answers...', type: 'info' }));
      triggerSubmit();
    });
    socketRef.current.on('violation_alert', ({ message, count }) => {
      dispatch(addToast({ message, type: count >= 3 ? 'error' : 'info' }));
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [activeTest, testId, user?.id]);

  useEffect(() => {
    if (activeTest && activeAttemptAnswers.length > 0) {
      const q = activeTest.questions[currentQuestionIndex];
      const saved = activeAttemptAnswers.find((a) => a.questionId === q._id);
      setSelectedOpt(saved?.selectedOption !== null ? saved.selectedOption : null);
      questionStartTimeRef.current = Date.now();
    }
  }, [currentQuestionIndex, activeTest, activeAttemptAnswers]);

  const handleOptionSelect = (idx) => setSelectedOpt(idx);

  const handleSaveAndNext = () => {
    const q = activeTest.questions[currentQuestionIndex];
    const timeSpent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    dispatch(saveAnswer({ questionId: q._id, selectedOption: selectedOpt, timeSpent }));
    if (currentQuestionIndex < activeTest.questions.length - 1) {
      dispatch(selectQuestion(currentQuestionIndex + 1));
    }
  };

  const handleMarkForReview = () => {
    const q = activeTest.questions[currentQuestionIndex];
    const timeSpent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    dispatch(saveAnswer({
      questionId: q._id,
      selectedOption: selectedOpt !== null ? selectedOpt : -1,
      timeSpent
    }));
    if (currentQuestionIndex < activeTest.questions.length - 1) {
      dispatch(selectQuestion(currentQuestionIndex + 1));
    }
  };

  const handleClearResponse = () => {
    setSelectedOpt(null);
    const q = activeTest.questions[currentQuestionIndex];
    dispatch(saveAnswer({ questionId: q._id, selectedOption: null, timeSpent: 0 }));
  };

  const triggerSubmit = async () => {
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch (e) {}
    }
    const totalTimeSpent = (activeTest.duration * 60) - remainingTime;
    const action = await dispatch(submitTestAttempt({
      testId: activeTest._id,
      answers: activeAttemptAnswers,
      timeSpent: Math.max(1, totalTimeSpent)
    }));
    if (submitTestAttempt.fulfilled.match(action)) {
      dispatch(addToast({ message: 'Exam submitted successfully.', type: 'success' }));
      if (socketRef.current) {
        socketRef.current.emit('submit_score', {
          name: user?.name,
          score: action.payload.score,
          examCategory: activeTest.examCategory
        });
      }
      navigate(`/results/${action.payload._id}`);
    }
  };

  if (!activeTest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900">
        <Loader2 className="h-10 w-10 animate-spin text-neon-cyan" />
      </div>
    );
  }

  const currentQ = activeTest.questions[currentQuestionIndex];
  const answeredCount = activeAttemptAnswers.filter(
    (a) => a.selectedOption !== null && a.selectedOption !== -1
  ).length;
  const reviewCount = activeAttemptAnswers.filter((a) => a.selectedOption === -1).length;
  const progressPct = (answeredCount / activeTest.questions.length) * 100;

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="exam-fullscreen flex min-h-screen select-none flex-col bg-ink-900 text-slate-100"
    >
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logo} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">{activeTest.examCategory}</p>
              <h2 className="truncate font-display text-sm font-bold text-white md:text-base">
                {activeTest.title}
              </h2>
            </div>
          </div>

          {/* Timer */}
          <motion.div
            animate={remainingTime < 300 ? { scale: [1, 1.04, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 backdrop-blur-md ${
              remainingTime < 300
                ? 'border-rose-500/30 bg-rose-500/10'
                : 'border-white/10 bg-white/[0.04]'
            }`}
          >
            <Clock className={`h-4 w-4 ${remainingTime < 300 ? 'text-rose-400' : 'text-neon-cyan'}`} />
            <span className={`font-mono text-sm font-bold ${remainingTime < 300 ? 'text-rose-300' : 'text-white'}`}>
              {formatTimer(remainingTime)}
            </span>
          </motion.div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span className="hidden sm:inline">Submit</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
            className="h-full bg-gradient-blue-purple"
          />
        </div>

        {/* Violation banner */}
        <AnimatePresence>
          {violationCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-rose-500/30 bg-rose-500/10"
            >
              <div className="flex items-center gap-3 px-6 py-2 text-xs font-semibold text-rose-300">
                <AlertOctagon className="h-4 w-4 shrink-0" />
                <span>
                  Proctor violation detected · {violationCount} / 3 focus changes · auto-submit at 3
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Question */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6 md:p-10">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                <span className="font-mono text-xs font-bold text-neon-cyan">
                  Q {currentQuestionIndex + 1}
                </span>
                <span className="text-xs text-slate-500">of {activeTest.questions.length}</span>
              </div>
              <span className="text-xs text-slate-500">
                {currentQ.subject} · {currentQ.topic}
              </span>
            </div>

            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 space-y-6"
            >
              <h3 className="font-display text-xl font-semibold leading-relaxed text-white md:text-2xl">
                {currentQ.question}
              </h3>

              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOpt === idx;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleOptionSelect(idx)}
                      className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-neon-blue/60 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 shadow-neon-blue'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold transition ${
                          isSelected
                            ? 'bg-gradient-blue-purple text-white shadow-neon-blue'
                            : 'border border-white/10 bg-white/[0.04] text-slate-400 group-hover:text-white'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`text-sm ${isSelected ? 'font-semibold text-white' : 'text-slate-200'}`}>
                        {opt}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Action row */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-6">
              <div className="flex items-center gap-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => dispatch(selectQuestion(currentQuestionIndex - 1))}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClearResponse}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08]"
                >
                  Clear
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkForReview}
                  className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Review
                </button>
                <button
                  onClick={handleSaveAndNext}
                  className="flex items-center gap-2 rounded-xl bg-gradient-blue-purple px-5 py-2 text-xs font-bold text-white shadow-neon-blue transition hover:-translate-y-0.5"
                >
                  Save & Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Palette */}
        <aside className="w-full shrink-0 border-t border-white/5 bg-white/[0.02] p-6 backdrop-blur-md md:w-80 md:border-l md:border-t-0">
          <div className="mb-5 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-neon-cyan" />
            <h4 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
              Question Palette
            </h4>
          </div>

          {/* Stat chips */}
          <div className="mb-6 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-center">
              <p className="font-display text-lg font-bold text-emerald-400">{answeredCount}</p>
              <p className="text-[9px] uppercase tracking-[0.15em] text-emerald-400/70">Done</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-center">
              <p className="font-display text-lg font-bold text-amber-400">{reviewCount}</p>
              <p className="text-[9px] uppercase tracking-[0.15em] text-amber-400/70">Review</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="font-display text-lg font-bold text-slate-300">
                {activeTest.questions.length - answeredCount - reviewCount}
              </p>
              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400">Unseen</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {activeTest.questions.map((q, idx) => {
              const ans = activeAttemptAnswers.find((a) => a.questionId === q._id);
              const isSelected = currentQuestionIndex === idx;
              let bg = 'bg-white/[0.04] text-slate-500 border-white/10';
              if (ans?.selectedOption !== null && ans?.selectedOption !== undefined && ans?.selectedOption !== -1) {
                bg = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
              } else if (ans?.selectedOption === -1) {
                bg = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
              }
              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => dispatch(selectQuestion(idx))}
                  className={`relative h-9 w-9 rounded-lg border text-xs font-bold transition ${bg} ${
                    isSelected ? 'ring-2 ring-neon-cyan ring-offset-2 ring-offset-ink-900' : ''
                  }`}
                >
                  {idx + 1}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2 border-t border-white/5 pt-4 text-xs text-slate-400">
            <Legend color="bg-emerald-500" label="Answered" />
            <Legend color="bg-amber-500" label="Marked for review" />
            <Legend color="bg-white/20" label="Unvisited" />
          </div>
        </aside>
      </div>

      {/* Submit confirmation */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowSubmitConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
            >
              <div className="rounded-2xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-xl">
                <div className="mb-5 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/15">
                    <AlertOctagon className="h-7 w-7 text-rose-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">Submit your exam?</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    You've answered <strong className="text-white">{answeredCount}</strong> of {activeTest.questions.length}.
                    Once submitted, you cannot change your answers.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSubmitConfirm(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
                  >
                    Continue exam
                  </button>
                  <button
                    onClick={() => { setShowSubmitConfirm(false); triggerSubmit(); }}
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/30 hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Submit now'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}
