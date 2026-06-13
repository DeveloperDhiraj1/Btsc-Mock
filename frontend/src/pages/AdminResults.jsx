import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import {
  ClipboardList, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight,
  X, CheckCircle2, XCircle, Clock, Award, Target
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/mock-cloud/image/upload/v1/default-avatar.png';

export default function AdminResults() {
  const dispatch = useDispatch();
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tests/admin/results?page=${page}&limit=15`);
      if (res.data.success) { setResults(res.data.data); setTotal(res.data.total); }
    } catch { dispatch(addToast({ message: 'Failed to load submissions', type: 'error' })); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchResults(); }, [page]);

  const openDetail = async (resultId) => {
    setDetailLoading(true); setDetail({});
    try {
      const res = await api.get(`/tests/results/${resultId}`);
      if (res.data.success) setDetail(res.data.data);
    } catch { dispatch(addToast({ message: 'Failed', type: 'error' })); setDetail(null); }
    finally { setDetailLoading(false); }
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ['User', 'Email', 'Test', 'Category', 'Score', 'Accuracy', 'Time (s)', 'Submitted'];
    const rows = results.map((r) => [
      r.user?.name || '—', r.user?.email || '—', r.test?.title || '—',
      r.test?.examCategory || '—', r.score, r.accuracy, r.timeSpent, new Date(r.createdAt).toISOString()
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `submissions_page_${page}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = results.filter((r) =>
    !search
    || r.user?.name?.toLowerCase().includes(search.toLowerCase())
    || r.user?.email?.toLowerCase().includes(search.toLowerCase())
    || r.test?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-neon-purple/15 p-3 text-neon-purple">
            <ClipboardList className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Exam <span className="text-gradient">submissions</span></h1>
            <p className="mt-1 text-sm text-slate-400">Browse graded attempts and export data.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5">Export CSV</button>
          <button onClick={fetchResults} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.08]">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <GlassCard className="!p-0 overflow-hidden" hover={false}>
        <div className="flex flex-col gap-3 border-b border-white/5 p-4 md:flex-row md:items-center md:justify-between">
          <span className="text-xs font-semibold text-slate-500">{total} total submissions</span>
          <div className="relative md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, test..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15" />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-cyan" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-600" /> No submissions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left">Candidate</th>
                  <th className="px-6 py-3 text-left">Test</th>
                  <th className="px-6 py-3 text-left">Score</th>
                  <th className="px-6 py-3 text-left">Accuracy</th>
                  <th className="px-6 py-3 text-left">Time</th>
                  <th className="px-6 py-3 text-left">Submitted</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((r) => (
                  <tr key={r._id} className="text-slate-300 hover:bg-white/[0.03]">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <img src={r.user?.profileImage || DEFAULT_AVATAR} alt="" onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                          className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10" />
                        <div>
                          <p className="font-semibold text-white">{r.user?.name || '—'}</p>
                          <p className="text-xs text-slate-500">{r.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-white">{r.test?.title || '—'}</p>
                      <p className="text-xs text-slate-500">{r.test?.examCategory}</p>
                    </td>
                    <td className="px-6 py-3 font-bold text-white">{r.score} <span className="text-xs text-slate-500">/ {r.test?.totalMarks || '—'}</span></td>
                    <td className="px-6 py-3">
                      <span className={`font-bold ${
                        r.accuracy >= 75 ? 'text-emerald-400' : r.accuracy >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>{r.accuracy}%</span>
                    </td>
                    <td className="px-6 py-3 text-xs">{Math.round(r.timeSpent / 60)}m</td>
                    <td className="px-6 py-3 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => openDetail(r._id)} className="text-xs font-bold text-neon-cyan hover:text-neon-blue">View →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div className="flex items-center justify-between border-t border-white/5 p-4 text-xs">
            <span className="font-semibold text-slate-500">Page {page} of {Math.ceil(total / 15)}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled={page * 15 >= total} onClick={() => setPage(page + 1)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-ink-900/95 p-6">
              <h3 className="font-display text-lg font-bold text-white">Scorecard details</h3>
              <button onClick={() => setDetail(null)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            {detailLoading ? (
              <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-cyan" /></div>
            ) : !detail._id ? (
              <div className="py-16 text-center text-sm text-slate-500">No data.</div>
            ) : (
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Score" value={detail.score} icon={Award} />
                  <Metric label="Accuracy" value={`${detail.accuracy}%`} icon={Target} />
                  <Metric label="Time" value={`${Math.round(detail.timeSpent / 60)}m`} icon={Clock} />
                  <Metric label="Answers" value={detail.answers?.length || 0} icon={CheckCircle2} />
                </div>

                {detail.AIAnalysis && (
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <h4 className="mb-3 font-bold text-white">AI analysis</h4>
                    <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">Strengths</p>
                        <ul className="space-y-0.5 pl-4 text-slate-300 list-disc">
                          {(detail.AIAnalysis.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400">Weaknesses</p>
                        <ul className="space-y-0.5 pl-4 text-slate-300 list-disc">
                          {(detail.AIAnalysis.weaknesses || []).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div className="md:col-span-2">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-neon-cyan">Time management</p>
                        <p className="text-slate-300">{detail.AIAnalysis.timeManagement}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">Study plan</p>
                        <p className="text-slate-300">{detail.AIAnalysis.studyPlanSuggestion}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="mb-3 font-bold text-white">Answer sheet</h4>
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {(detail.answers || []).map((a, idx) => (
                      <div key={idx} className={`rounded-xl border p-3 text-xs ${
                        a.isCorrect ? 'border-emerald-500/20 bg-emerald-500/5'
                        : a.selectedOption === null ? 'border-white/5 bg-white/[0.02]'
                        : 'border-rose-500/20 bg-rose-500/5'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="font-semibold text-white">Q{idx + 1}: </span>
                            <span className="text-slate-300">{a.questionId?.question || 'Removed'}</span>
                          </div>
                          {a.isCorrect ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-400" />}
                        </div>
                        {a.questionId?.options && (
                          <div className="mt-2 text-[10px] text-slate-500">
                            Selected: <span className="text-slate-300">{a.selectedOption !== null ? a.questionId.options[a.selectedOption] : 'Skipped'}</span>
                            <span className="mx-1.5">·</span>
                            Correct: <span className="text-emerald-400">{a.questionId.options[a.questionId.correctAnswer]}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</span>
        <Icon className="h-3.5 w-3.5 text-slate-500" />
      </div>
      <span className="font-display text-lg font-bold text-white">{value}</span>
    </div>
  );
}
