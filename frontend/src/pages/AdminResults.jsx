import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../store/slices/uiSlice';
import {
  ClipboardList, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight,
  X, CheckCircle2, XCircle, Clock, Award, Target
} from 'lucide-react';

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
      if (res.data.success) {
        setResults(res.data.data);
        setTotal(res.data.total);
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to load submissions', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResults(); }, [page]);

  const openDetail = async (resultId) => {
    setDetailLoading(true);
    setDetail({});
    try {
      const res = await api.get(`/tests/results/${resultId}`);
      if (res.data.success) setDetail(res.data.data);
    } catch (err) {
      dispatch(addToast({ message: 'Failed to load scorecard', type: 'error' }));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ['User', 'Email', 'Test', 'Category', 'Score', 'Accuracy', 'Time (s)', 'Submitted'];
    const rows = results.map(r => [
      r.user?.name || '—',
      r.user?.email || '—',
      r.test?.title || '—',
      r.test?.examCategory || '—',
      r.score,
      r.accuracy,
      r.timeSpent,
      new Date(r.createdAt).toISOString()
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions_page_${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = results.filter(r =>
    !search ||
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.test?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-rose-500">
          <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Exam Submissions
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              Browse every graded attempt, inspect AI analysis and export raw data.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold"
          >
            Export CSV
          </button>
          <button
            onClick={fetchResults}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-dark-200 dark:hover:bg-dark-100 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">{total} total submissions</span>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-450 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search by name, email, or test title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-white text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-sm text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            No submissions match the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-dark-250">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Candidate</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Test</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Score</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Accuracy</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Submitted</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-dark-300">
                {filtered.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50/50 dark:hover:bg-dark-250/30">
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={r.user?.profileImage || DEFAULT_AVATAR}
                          alt=""
                          onError={e => { e.target.src = DEFAULT_AVATAR; }}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="font-semibold text-sm text-gray-850 dark:text-white block">{r.user?.name || '—'}</span>
                          <span className="text-xs text-gray-400 block">{r.user?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-sm text-gray-800 dark:text-gray-200 block">{r.test?.title || '—'}</span>
                      <span className="text-xs text-gray-400">{r.test?.examCategory}</span>
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-850 dark:text-white">
                      {r.score} <span className="text-xs text-gray-400">/ {r.test?.totalMarks || '—'}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-sm font-bold ${r.accuracy >= 75 ? 'text-emerald-600' : r.accuracy >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {r.accuracy}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">{Math.round(r.timeSpent / 60)} min</td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => openDetail(r._id)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 text-xs font-bold"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-850 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold">Page {page} of {Math.ceil(total / 15)}</span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 bg-white dark:bg-dark-300 border border-gray-250 dark:border-gray-800 disabled:opacity-50 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page * 15 >= total}
                onClick={() => setPage(page + 1)}
                className="p-2 bg-white dark:bg-dark-300 border border-gray-250 dark:border-gray-800 disabled:opacity-50 rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div
            className="bg-white dark:bg-dark-300 max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-dark-300">
              <h3 className="font-extrabold text-gray-900 dark:text-white">Scorecard Details</h3>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
            ) : !detail._id ? (
              <div className="p-16 text-center text-sm text-gray-400">No scorecard data available.</div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Metric label="Score" value={detail.score} icon={<Award className="w-4 h-4" />} />
                  <Metric label="Accuracy" value={`${detail.accuracy}%`} icon={<Target className="w-4 h-4" />} />
                  <Metric label="Time" value={`${Math.round(detail.timeSpent / 60)}m`} icon={<Clock className="w-4 h-4" />} />
                  <Metric label="Answers" value={detail.answers?.length || 0} icon={<CheckCircle2 className="w-4 h-4" />} />
                </div>

                {detail.AIAnalysis && (
                  <div className="bg-gray-50 dark:bg-dark-250 p-5 rounded-2xl">
                    <h4 className="font-bold text-sm mb-3 text-gray-900 dark:text-white">AI Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-emerald-600 block mb-1">Strengths</span>
                        <ul className="list-disc pl-4 text-gray-600 dark:text-gray-400 space-y-0.5">
                          {(detail.AIAnalysis.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold text-rose-600 block mb-1">Weaknesses</span>
                        <ul className="list-disc pl-4 text-gray-600 dark:text-gray-400 space-y-0.5">
                          {(detail.AIAnalysis.weaknesses || []).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-semibold text-indigo-600 block mb-1">Time Management</span>
                        <p className="text-gray-600 dark:text-gray-400">{detail.AIAnalysis.timeManagement}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-semibold text-amber-600 block mb-1">Study Plan</span>
                        <p className="text-gray-600 dark:text-gray-400">{detail.AIAnalysis.studyPlanSuggestion}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-sm mb-3 text-gray-900 dark:text-white">Answer Sheet</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(detail.answers || []).map((a, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs ${
                          a.isCorrect
                            ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-800'
                            : a.selectedOption === null
                            ? 'border-gray-200 bg-gray-50 dark:bg-dark-250 dark:border-gray-800'
                            : 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">Q{idx + 1}: </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {a.questionId?.question || 'Question removed'}
                            </span>
                          </div>
                          {a.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-2 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 ml-2 flex-shrink-0" />
                          )}
                        </div>
                        {a.questionId?.options && (
                          <div className="mt-2 text-[11px] text-gray-500">
                            Selected: {a.selectedOption !== null ? a.questionId.options[a.selectedOption] : 'Skipped'} ·
                            Correct: {a.questionId.options[a.questionId.correctAnswer]}
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

function Metric({ label, value, icon }) {
  return (
    <div className="bg-gray-50 dark:bg-dark-250 p-4 rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <span className="text-lg font-black text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
