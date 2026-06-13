import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Trophy, Clock, Sparkles, ChevronDown, ChevronUp, Loader2,
  Bookmark, ArrowLeft
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';

export default function ResultPage() {
  const { resultId } = useParams();
  const dispatch = useDispatch();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedList, setBookmarkedList] = useState([]);
  const [expandedQ, setExpandedQ] = useState(null);
  const [aiExplanations, setAiExplanations] = useState({});
  const [aiExplaining, setAiExplaining] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/tests/results/${resultId}`);
        if (res.data.success) setResult(res.data.data);
      } catch (err) {
        dispatch(addToast({ message: err?.response?.data?.message || 'Error retrieving scorecard', type: 'error' }));
      } finally { setLoading(false); }
    })();
    (async () => {
      try {
        const res = await api.get('/auth/bookmarks');
        if (res.data.success) setBookmarkedList(res.data.data.map((b) => b._id || b));
      } catch {}
    })();
  }, [resultId, dispatch]);

  const handleToggleBookmark = async (qId) => {
    const isB = bookmarkedList.includes(qId);
    try {
      if (isB) {
        await api.delete(`/auth/bookmarks/${qId}`);
        setBookmarkedList((p) => p.filter((id) => id !== qId));
        dispatch(addToast({ message: 'Removed', type: 'success' }));
      } else {
        await api.post('/auth/bookmarks', { questionId: qId });
        setBookmarkedList((p) => [...p, qId]);
        dispatch(addToast({ message: 'Bookmarked', type: 'success' }));
      }
    } catch {
      dispatch(addToast({ message: 'Bookmark failed', type: 'error' }));
    }
  };

  const handleFetchExplanation = async (question, options, correctIdx, selectedIdx, qId) => {
    if (aiExplanations[qId]) {
      setExpandedQ(expandedQ === qId ? null : qId);
      return;
    }
    setExpandedQ(qId);
    setAiExplaining((p) => ({ ...p, [qId]: true }));
    try {
      const res = await api.post('/ai/generate-explanation', {
        questionText: question, options, correctAnswerIndex: correctIdx, selectedOptionIndex: selectedIdx
      });
      if (res.data.success) setAiExplanations((p) => ({ ...p, [qId]: res.data.data }));
    } catch {
      dispatch(addToast({ message: 'AI explanation failed', type: 'error' }));
    } finally {
      setAiExplaining((p) => ({ ...p, [qId]: false }));
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-neon-cyan" /></div>;
  }

  if (!result) {
    return <GlassCard className="!p-20 text-center" hover={false}><p className="text-sm text-slate-500">Scorecard not found.</p></GlassCard>;
  }

  const correct = result.answers?.filter((a) => a.isCorrect).length || 0;
  const skipped = result.answers?.filter((a) => a.selectedOption === null).length || 0;
  const incorrect = (result.answers?.length || 0) - correct - skipped;
  const chartData = [
    { name: 'Correct', value: correct, color: '#10b981' },
    { name: 'Incorrect', value: incorrect, color: '#f43f5e' },
    { name: 'Skipped', value: skipped, color: '#64748b' }
  ].filter((c) => c.value > 0);

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative overflow-hidden rounded-2xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-neon-blue/15 to-neon-purple/15" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-neon-blue">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white">Mock Scorecard</h1>
                <p className="mt-1 text-sm text-slate-300">Detailed evaluation & AI analysis.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Pill label="Score" value={result.score} accent="text-neon-cyan" />
              <Pill label="Accuracy" value={`${result.accuracy}%`} accent="text-emerald-400" />
              <Pill label="Time" value={`${Math.round(result.timeSpent / 60)}m`} accent="text-amber-400" icon={Clock} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Distribution + AI */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="!p-6" hover={false}>
          <h3 className="mb-4 font-display text-lg font-semibold text-white">Response distribution</h3>
          {chartData.length > 0 ? (
            <div className="relative h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value">
                    {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15,18,38,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-bold text-white">{result.answers?.length || 0}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Questions</span>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">No answers recorded.</div>
          )}
          <div className="mt-5 flex justify-center gap-5 border-t border-white/5 pt-4 text-xs">
            <Legend color="bg-emerald-500" label={`Correct (${correct})`} />
            <Legend color="bg-rose-500" label={`Incorrect (${incorrect})`} />
            <Legend color="bg-slate-500" label={`Skipped (${skipped})`} />
          </div>
        </GlassCard>

        <GlassCard className="!p-6" hover={false}>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-neon-purple" />
            <h3 className="font-display text-lg font-semibold text-white">AI performance audit</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Strengths</p>
              <ul className="space-y-0.5 pl-4 text-slate-300 list-disc">
                {(result.AIAnalysis?.strengths || ['Solid baseline accuracy']).map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">Weaknesses</p>
              <ul className="space-y-0.5 pl-4 text-slate-300 list-disc">
                {(result.AIAnalysis?.weaknesses || ['Numerical reasoning']).map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Time management</p>
              <p className="text-xs text-slate-300">{result.AIAnalysis?.timeManagement}</p>
            </div>
            <div className="rounded-xl border border-neon-purple/30 bg-neon-purple/10 p-3 text-xs text-slate-200">
              <strong className="text-neon-purple">Study tip:</strong> {result.AIAnalysis?.studyPlanSuggestion}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Question review */}
      {result.answers?.length > 0 && (
        <GlassCard className="!p-6" hover={false}>
          <h3 className="mb-5 font-display text-lg font-semibold text-white">Question review</h3>
          <div className="space-y-4">
            {result.answers.map((ans, idx) => {
              const qId = ans.questionId?._id || ans.questionId;
              const isCorrect = ans.isCorrect;
              const isSkipped = ans.selectedOption === null;
              return (
                <div key={idx} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                      <button
                        onClick={() => handleToggleBookmark(qId)}
                        className={`flex items-center gap-1 text-[10px] font-bold transition ${
                          bookmarkedList.includes(qId) ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Bookmark className={`h-3 w-3 ${bookmarkedList.includes(qId) ? 'fill-amber-400' : ''}`} />
                        {bookmarkedList.includes(qId) ? 'Saved' : 'Bookmark'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSkipped ? (
                        <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Skipped</span>
                      ) : isCorrect ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">Correct</span>
                      ) : (
                        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400">Incorrect</span>
                      )}
                      <span className="text-[10px] text-slate-500">{ans.timeSpent}s</span>
                    </div>
                  </div>

                  <p className="mb-3 text-sm font-semibold text-white">{ans.questionId?.question}</p>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {(ans.questionId?.options || []).map((opt, oi) => {
                      const isSel = ans.selectedOption === oi;
                      const isCorrectOpt = (ans.questionId?.correctAnswer ?? -1) === oi;
                      let cls = 'border-white/5 bg-white/[0.02] text-slate-300';
                      if (isSel && isCorrect) cls = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
                      else if (isSel && !isCorrect) cls = 'border-rose-500/40 bg-rose-500/10 text-rose-200';
                      else if (isCorrectOpt) cls = 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300';
                      return (
                        <div key={oi} className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${cls}`}>
                          <span className="flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-bold ring-1 ring-white/10">
                            {String.fromCharCode(65 + oi)}
                          </span>
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleFetchExplanation(
                      ans.questionId?.question || '',
                      ans.questionId?.options || [],
                      ans.questionId?.correctAnswer ?? 0,
                      ans.selectedOption,
                      qId
                    )}
                    className="mt-3 flex items-center gap-1.5 text-xs font-bold text-neon-purple transition hover:text-neon-cyan"
                  >
                    <Sparkles className="h-3 w-3" />
                    {expandedQ === qId ? 'Close AI explanation' : 'Ask AI for explanation'}
                    {expandedQ === qId ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {expandedQ === qId && (
                    <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs leading-relaxed text-slate-300">
                      {aiExplaining[qId] ? (
                        <div className="flex items-center gap-2 text-neon-cyan">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gemini compiling solution...
                        </div>
                      ) : (
                        <div className="whitespace-pre-line">{aiExplanations[qId] || 'No explanation available.'}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      <div className="flex flex-wrap gap-3">
        <GradientButton as={Link} to="/dashboard">Back to dashboard</GradientButton>
        <GradientButton as={Link} to="/leaderboard" variant="ghost">Check rankings</GradientButton>
      </div>
    </div>
  );
}

function Pill({ label, value, accent, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-1 flex items-center gap-1.5 font-display text-lg font-bold ${accent}`}>
        {Icon && <Icon className="h-4 w-4" />}
        {value}
      </p>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-400">
      <div className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </div>
  );
}
