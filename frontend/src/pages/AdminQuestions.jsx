import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import {
  Sparkles, FileSpreadsheet, ListPlus, Loader2, Trash2, ChevronLeft, ChevronRight,
  Pencil, X, Save
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';

export default function AdminQuestions() {
  const dispatch = useDispatch();
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [csvFile, setCsvFile] = useState(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  const [aiSubject, setAiSubject] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiCount, setAiCount] = useState('5');
  const [aiExamType, setAiExamType] = useState('BTSC');
  const [generatingAI, setGeneratingAI] = useState(false);

  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/questions?page=${page}&limit=10`);
      if (res.data.success) { setQuestions(res.data.data); setTotal(res.data.total); }
    } catch { dispatch(addToast({ message: 'Failed to fetch', type: 'error' })); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchQuestions(); }, [page]);

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) { dispatch(addToast({ message: 'Select a CSV first', type: 'error' })); return; }
    const formData = new FormData();
    formData.append('file', csvFile);
    setUploadingCsv(true);
    try {
      const res = await api.post('/questions/upload-csv', formData);
      if (res.data.success) {
        dispatch(addToast({ message: res.data.message || 'CSV imported', type: 'success' }));
        setCsvFile(null);
        setTimeout(fetchQuestions, 1000);
      }
    } catch (err) { dispatch(addToast({ message: err.response?.data?.message || 'Upload failed', type: 'error' })); }
    finally { setUploadingCsv(false); }
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    if (!aiSubject || !aiTopic) { dispatch(addToast({ message: 'Specify subject and topic', type: 'error' })); return; }
    setGeneratingAI(true);
    try {
      const res = await api.post('/ai/generate-questions', {
        subject: aiSubject, topic: aiTopic, difficulty: aiDifficulty,
        questionCount: parseInt(aiCount), examType: aiExamType, saveToDb: true
      });
      if (res.data.success) {
        dispatch(addToast({ message: `Saved ${aiCount} questions`, type: 'success' }));
        setAiSubject(''); setAiTopic('');
        fetchQuestions();
      }
    } catch { dispatch(addToast({ message: 'Generation failed', type: 'error' })); }
    finally { setGeneratingAI(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      const res = await api.delete(`/questions/${id}`);
      if (res.data.success) { dispatch(addToast({ message: 'Deleted', type: 'success' })); fetchQuestions(); }
    } catch { dispatch(addToast({ message: 'Delete failed', type: 'error' })); }
  };

  const openEdit = (q) => setEditing({
    _id: q._id,
    subject: q.subject || '', topic: q.topic || '',
    examType: q.examType || 'BTSC', difficulty: q.difficulty || 'medium',
    question: q.question || '',
    options: q.options && q.options.length === 4 ? [...q.options] : ['', '', '', ''],
    correctAnswer: q.correctAnswer ?? 0, explanation: q.explanation || ''
  });

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    try {
      const res = await api.put(`/questions/${editing._id}`, {
        ...editing, correctAnswer: parseInt(editing.correctAnswer), editedByAdmin: true
      });
      if (res.data.success) { dispatch(addToast({ message: 'Updated', type: 'success' })); setEditing(null); fetchQuestions(); }
    } catch { dispatch(addToast({ message: 'Update failed', type: 'error' })); }
    finally { setSavingEdit(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Question <span className="text-gradient">bank</span></h1>
        <p className="mt-2 text-sm text-slate-400">Manage platform-wide questions, import CSV, or use AI generator.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="!p-6" hover={false}>
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-white">
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Bulk CSV import
          </h3>
          <p className="mb-4 text-xs leading-relaxed text-slate-400">
            Columns: <strong className="text-slate-300">subject, topic, question, option1..4, correctAnswer (0-3), explanation, difficulty, examType</strong>
          </p>
          <form onSubmit={handleCsvUpload} className="space-y-4">
            <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} required
              className="w-full text-xs text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white/[0.06] file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-white hover:file:bg-white/[0.1]" />
            <button type="submit" disabled={uploadingCsv}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:opacity-50">
              {uploadingCsv ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Upload spreadsheet'}
            </button>
          </form>
        </GlassCard>

        <GlassCard className="!p-6" hover={false}>
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-white">
            <Sparkles className="h-4 w-4 text-neon-purple" /> AI builder
          </h3>
          <form onSubmit={handleAIGenerate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FieldSm label="Subject" value={aiSubject} onChange={setAiSubject} placeholder="Physics" />
              <FieldSm label="Topic" value={aiTopic} onChange={setAiTopic} placeholder="Gravity" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SelectSm label="Exam" value={aiExamType} onChange={setAiExamType} options={[
                { val: 'BTSC', label: 'BTSC' }, { val: 'SSC', label: 'SSC' }, { val: 'BPSC', label: 'BPSC' }
              ]} />
              <SelectSm label="Difficulty" value={aiDifficulty} onChange={setAiDifficulty} options={[
                { val: 'easy', label: 'Easy' }, { val: 'medium', label: 'Medium' }, { val: 'hard', label: 'Hard' }
              ]} />
              <SelectSm label="Count" value={aiCount} onChange={setAiCount} options={[
                { val: '5', label: '5 Qs' }, { val: '10', label: '10 Qs' }
              ]} />
            </div>
            <GradientButton type="submit" disabled={generatingAI} className="!w-full">
              {generatingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Compile AI questions'}
            </GradientButton>
          </form>
        </GlassCard>
      </div>

      <GlassCard className="!p-0 overflow-hidden" hover={false}>
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-white">
            <ListPlus className="h-4 w-4 text-neon-cyan" /> Question repository
          </h3>
          <span className="text-xs text-slate-500">{total} total</span>
        </div>
        {loading ? (
          <div className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-cyan" /></div>
        ) : questions.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">Empty bank. Upload CSV or build with AI.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left">Question</th>
                  <th className="px-6 py-3 text-left">Exam</th>
                  <th className="px-6 py-3 text-left">Subject</th>
                  <th className="px-6 py-3 text-left">Difficulty</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {questions.map((q) => (
                  <tr key={q._id} className="text-slate-300 hover:bg-white/[0.03]">
                    <td className="max-w-xs truncate px-6 py-3 font-medium text-white">{q.question}</td>
                    <td className="px-6 py-3 text-xs">{q.examType}</td>
                    <td className="px-6 py-3 text-xs">{q.subject} <span className="text-slate-500">· {q.topic}</span></td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${
                        q.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-400'
                        : q.difficulty === 'hard' ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-amber-500/15 text-amber-400'
                      }`}>{q.difficulty}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => openEdit(q)} className="mr-2 rounded-lg p-2 text-neon-cyan hover:bg-white/10">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(q._id)} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 10 && (
          <div className="flex items-center justify-between border-t border-white/5 p-4 text-xs">
            <span className="font-semibold text-slate-500">{questions.length} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled={page * 10 >= total} onClick={() => setPage(page + 1)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <form onSubmit={handleSaveEdit}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-ink-900/95 p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                <Pencil className="h-4 w-4 text-neon-cyan" /> Edit question
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                <FieldSm label="Subject" value={editing.subject} onChange={(v) => setEditing({ ...editing, subject: v })} />
                <FieldSm label="Topic" value={editing.topic} onChange={(v) => setEditing({ ...editing, topic: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectSm label="Exam" value={editing.examType} onChange={(v) => setEditing({ ...editing, examType: v })} options={[
                  { val: 'BTSC', label: 'BTSC' }, { val: 'SSC', label: 'SSC' }, { val: 'BPSC', label: 'BPSC' }, { val: 'Railway', label: 'Railway' }
                ]} />
                <SelectSm label="Difficulty" value={editing.difficulty} onChange={(v) => setEditing({ ...editing, difficulty: v })} options={[
                  { val: 'easy', label: 'Easy' }, { val: 'medium', label: 'Medium' }, { val: 'hard', label: 'Hard' }
                ]} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Question</label>
                <textarea value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} required rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Options (radio = correct)</label>
                {editing.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={parseInt(editing.correctAnswer) === idx}
                      onChange={() => setEditing({ ...editing, correctAnswer: idx })}
                      className="h-4 w-4 accent-emerald-500" />
                    <input type="text" value={opt} required placeholder={`Option ${idx + 1}`}
                      onChange={(e) => {
                        const next = [...editing.options]; next[idx] = e.target.value;
                        setEditing({ ...editing, options: next });
                      }}
                      className={`flex-1 rounded-xl border bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15 ${
                        parseInt(editing.correctAnswer) === idx ? 'border-emerald-500/50' : 'border-white/10'
                      }`} />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Explanation</label>
                <textarea value={editing.explanation} onChange={(e) => setEditing({ ...editing, explanation: e.target.value })} required rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15" />
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-white/5 bg-ink-900/95 p-4">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" disabled={savingEdit}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-blue-purple px-5 py-2 text-sm font-bold text-white shadow-neon-blue disabled:opacity-50">
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FieldSm({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15" />
    </div>
  );
}

function SelectSm({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15">
        {options.map((o) => <option key={o.val} value={o.val} className="bg-ink-900">{o.label}</option>)}
      </select>
    </div>
  );
}
