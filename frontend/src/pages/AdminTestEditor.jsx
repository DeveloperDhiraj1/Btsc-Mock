import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import {
  Sliders, Loader2, Save, Trash2, ArrowLeft, Plus, X, Search, BookOpen
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

export default function AdminTestEditor() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', duration: 60, negativeMarking: 0.25, examCategory: 'BTSC', totalMarks: 100, isActive: true
  });

  const [allQuestions, setAllQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dirty, setDirty] = useState(false);

  const fetchTest = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tests/${testId}/full`);
      if (res.data.success) {
        const t = res.data.data;
        setTest(t);
        setForm({
          title: t.title, duration: t.duration, negativeMarking: t.negativeMarking,
          examCategory: t.examCategory, totalMarks: t.totalMarks, isActive: t.isActive
        });
        setSelectedIds(new Set(t.questions.map((q) => q._id)));
        setDirty(false);
      }
    } catch { dispatch(addToast({ message: 'Load failed', type: 'error' })); }
    finally { setLoading(false); }
  };

  const fetchAllQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (filterCat) params.append('examType', filterCat);
      const res = await api.get(`/questions?${params}`);
      if (res.data.success) setAllQuestions(res.data.data);
    } catch { dispatch(addToast({ message: 'Pool fetch failed', type: 'error' })); }
    finally { setQuestionsLoading(false); }
  };

  useEffect(() => { fetchTest(); }, [testId]);
  useEffect(() => { if (pickerOpen) fetchAllQuestions(); }, [pickerOpen, filterCat]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/tests/${testId}`, form);
      if (res.data.success) { dispatch(addToast({ message: 'Saved', type: 'success' })); fetchTest(); }
    } catch { dispatch(addToast({ message: 'Save failed', type: 'error' })); }
    finally { setSaving(false); }
  };

  const handleSaveQuestions = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/tests/${testId}/assign-questions`, { questionIds: Array.from(selectedIds) });
      if (res.data.success) {
        dispatch(addToast({ message: `${selectedIds.size} questions assigned`, type: 'success' }));
        setPickerOpen(false); fetchTest();
      }
    } catch { dispatch(addToast({ message: 'Assign failed', type: 'error' })); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this test template?')) return;
    try {
      const res = await api.delete(`/tests/${testId}`);
      if (res.data.success) { dispatch(addToast({ message: 'Deleted', type: 'success' })); navigate('/admin'); }
    } catch { dispatch(addToast({ message: 'Delete failed', type: 'error' })); }
  };

  const removeQuestionFromTest = (qid) => {
    const ns = new Set(selectedIds); ns.delete(qid);
    setSelectedIds(ns);
    setTest((p) => ({ ...p, questions: p.questions.filter((q) => q._id !== qid) }));
    setDirty(true);
  };

  const toggleSelected = (id) => {
    const ns = new Set(selectedIds);
    if (ns.has(id)) ns.delete(id); else ns.add(id);
    setSelectedIds(ns); setDirty(true);
  };

  const filteredPool = allQuestions.filter((q) =>
    !search
    || q.question.toLowerCase().includes(search.toLowerCase())
    || q.subject?.toLowerCase().includes(search.toLowerCase())
    || q.topic?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-neon-cyan" /></div>;
  if (!test) return <div className="py-12 text-center text-sm text-slate-500">Test not found.</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to admin hub
      </button>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-neon-purple/15 p-3 text-neon-purple">
            <Sliders className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Edit <span className="text-gradient">template</span></h1>
            <p className="mt-1 text-sm text-slate-400">{test.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-600">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <GlassCard className="!p-6" hover={false}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          </div>
          <Field label="Duration (min)" type="number" value={form.duration} onChange={(v) => setForm({ ...form, duration: parseInt(v) || 0 })} />
          <Field label="Total marks" type="number" value={form.totalMarks} onChange={(v) => setForm({ ...form, totalMarks: parseInt(v) || 0 })} />
          <Select label="Negative" value={form.negativeMarking} onChange={(v) => setForm({ ...form, negativeMarking: parseFloat(v) })} options={[
            { val: '0.25', label: '-0.25' }, { val: '0.33', label: '-0.33' }, { val: '0', label: 'None' }
          ]} />
          <Select label="Category" value={form.examCategory} onChange={(v) => setForm({ ...form, examCategory: v })} options={[
            { val: 'BTSC', label: 'BTSC' }, { val: 'SSC', label: 'SSC' }, { val: 'BPSC', label: 'BPSC' }, { val: 'Railway', label: 'Railway' }
          ]} />
          <label className="flex items-center gap-3 md:col-span-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 accent-neon-purple" />
            <span className="text-sm font-semibold text-slate-200">Test is active (visible to students)</span>
          </label>
        </div>
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden" hover={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-6">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-white">Assigned questions ({test.questions.length})</h3>
            {dirty && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">Unsaved</span>}
          </div>
          <div className="flex gap-2">
            {dirty && (
              <button onClick={handleSaveQuestions} disabled={saving} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Persist'}
              </button>
            )}
            <button onClick={() => setPickerOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-blue-purple px-3 py-1.5 text-xs font-bold text-white shadow-neon-blue">
              <Plus className="h-3.5 w-3.5" /> Manage
            </button>
          </div>
        </div>

        {test.questions.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-600" /> No questions assigned. Click Manage.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {test.questions.map((q, idx) => (
              <li key={q._id} className="flex items-start justify-between gap-3 p-5 transition hover:bg-white/[0.03]">
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Q{idx + 1}</span>
                    <Tag>{q.examType}</Tag>
                    <Tag>{q.subject} · {q.topic}</Tag>
                    <Tag accent="amber">{q.difficulty}</Tag>
                  </div>
                  <p className="text-sm text-white">{q.question}</p>
                </div>
                <button onClick={() => removeQuestionFromTest(q._id)} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setPickerOpen(false)}>
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div>
                <h3 className="font-display text-lg font-bold text-white">Pick questions</h3>
                <p className="text-xs text-slate-500">{selectedIds.size} selected</p>
              </div>
              <button onClick={() => setPickerOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 border-b border-white/5 p-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15" />
              </div>
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15">
                <option value="" className="bg-ink-900">All exam types</option>
                <option value="BTSC" className="bg-ink-900">BTSC</option>
                <option value="SSC" className="bg-ink-900">SSC</option>
                <option value="BPSC" className="bg-ink-900">BPSC</option>
                <option value="Railway" className="bg-ink-900">Railway</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {questionsLoading ? (
                <div className="py-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-cyan" /></div>
              ) : filteredPool.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">No matches.</div>
              ) : (
                <ul className="space-y-2">
                  {filteredPool.map((q) => {
                    const checked = selectedIds.has(q._id);
                    return (
                      <li key={q._id} onClick={() => toggleSelected(q._id)}
                        className={`cursor-pointer rounded-xl border p-3 transition ${
                          checked ? 'border-neon-purple/50 bg-neon-purple/10' : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]'
                        }`}>
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={checked} readOnly className="mt-1 h-4 w-4 accent-neon-purple" />
                          <div className="flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                              <Tag>{q.examType}</Tag>
                              <Tag>{q.subject} · {q.topic}</Tag>
                              <Tag accent="amber">{q.difficulty}</Tag>
                            </div>
                            <p className="truncate text-sm text-white">{q.question}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/5 p-4">
              <button onClick={() => setPickerOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleSaveQuestions} disabled={saving} className="rounded-xl bg-gradient-blue-purple px-5 py-2 text-sm font-bold text-white shadow-neon-blue hover:-translate-y-0.5 disabled:opacity-50">
                {saving ? 'Saving…' : `Assign ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, type = 'text', value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15" />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15">
        {options.map((o) => <option key={o.val} value={o.val} className="bg-ink-900">{o.label}</option>)}
      </select>
    </div>
  );
}

function Tag({ children, accent = 'cyan' }) {
  const colors = {
    cyan: 'bg-neon-blue/10 text-neon-cyan ring-neon-blue/20',
    amber: 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ring-1 ${colors[accent]}`}>
      {children}
    </span>
  );
}
