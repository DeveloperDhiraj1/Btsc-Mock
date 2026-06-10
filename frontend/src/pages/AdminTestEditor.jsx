import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../store/slices/uiSlice';
import {
  Sliders, Loader2, Save, Trash2, ArrowLeft, Plus, X,
  Search, CheckCircle2, BookOpen
} from 'lucide-react';

export default function AdminTestEditor() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    duration: 60,
    negativeMarking: 0.25,
    examCategory: 'BTSC',
    totalMarks: 100,
    isActive: true
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
          title: t.title,
          duration: t.duration,
          negativeMarking: t.negativeMarking,
          examCategory: t.examCategory,
          totalMarks: t.totalMarks,
          isActive: t.isActive
        });
        setSelectedIds(new Set(t.questions.map(q => q._id)));
        setDirty(false);
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to load test template', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (filterCat) params.append('examType', filterCat);
      const res = await api.get(`/questions?${params.toString()}`);
      if (res.data.success) setAllQuestions(res.data.data);
    } catch (err) {
      dispatch(addToast({ message: 'Failed to load question pool', type: 'error' }));
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => { fetchTest(); }, [testId]);
  useEffect(() => { if (pickerOpen) fetchAllQuestions(); }, [pickerOpen, filterCat]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/tests/${testId}`, form);
      if (res.data.success) {
        dispatch(addToast({ message: 'Test template updated', type: 'success' }));
        fetchTest();
      }
    } catch (err) {
      dispatch(addToast({ message: 'Save failed', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuestions = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/tests/${testId}/assign-questions`, {
        questionIds: Array.from(selectedIds)
      });
      if (res.data.success) {
        dispatch(addToast({ message: `${selectedIds.size} questions assigned`, type: 'success' }));
        setPickerOpen(false);
        fetchTest();
      }
    } catch (err) {
      dispatch(addToast({ message: 'Assignment failed', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this test template? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/tests/${testId}`);
      if (res.data.success) {
        dispatch(addToast({ message: 'Test deleted', type: 'success' }));
        navigate('/admin');
      }
    } catch (err) {
      dispatch(addToast({ message: 'Delete failed', type: 'error' }));
    }
  };

  const removeQuestionFromTest = (qid) => {
    const newSet = new Set(selectedIds);
    newSet.delete(qid);
    setSelectedIds(newSet);
    setTest(prev => ({ ...prev, questions: prev.questions.filter(q => q._id !== qid) }));
    setDirty(true);
  };

  const toggleSelected = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
    setDirty(true);
  };

  const filteredPool = allQuestions.filter(q =>
    !search ||
    q.question.toLowerCase().includes(search.toLowerCase()) ||
    q.subject?.toLowerCase().includes(search.toLowerCase()) ||
    q.topic?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-rose-500" /></div>
    );
  }
  if (!test) return <div className="p-10 text-center text-gray-400">Test not found.</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center space-x-2 text-sm font-semibold text-gray-500 hover:text-rose-500"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Hub</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-rose-500">
          <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl">
            <Sliders className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Edit Test Template
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{test.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-white text-sm"
          />
        </div>

        <Field label="Duration (mins)" type="number" value={form.duration} onChange={v => setForm({ ...form, duration: parseInt(v) || 0 })} />
        <Field label="Total Marks" type="number" value={form.totalMarks} onChange={v => setForm({ ...form, totalMarks: parseInt(v) || 0 })} />

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Negative Marking</label>
          <select
            value={form.negativeMarking}
            onChange={e => setForm({ ...form, negativeMarking: parseFloat(e.target.value) })}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-white text-sm"
          >
            <option value="0.25">-0.25</option>
            <option value="0.33">-0.33</option>
            <option value="0">No negative</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Exam Category</label>
          <select
            value={form.examCategory}
            onChange={e => setForm({ ...form, examCategory: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-white text-sm"
          >
            <option value="BTSC">BTSC JE</option>
            <option value="SSC">SSC JE</option>
            <option value="BPSC">BPSC AE</option>
            <option value="Railway">Railway RRB</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-center space-x-3">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={e => setForm({ ...form, isActive: e.target.checked })}
            className="w-4 h-4 accent-rose-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
            Test is active (visible to students)
          </label>
        </div>
      </div>

      {/* Questions list */}
      <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-gray-900 dark:text-white">Assigned Questions ({test.questions.length})</h3>
              {dirty && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Unsaved
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Pick which questions appear in this exam.</p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <button
                onClick={handleSaveQuestions}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
              >
                {saving ? 'Saving…' : 'Persist'}
              </button>
            )}
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Manage Questions</span>
            </button>
          </div>
        </div>

        {test.questions.length === 0 ? (
          <div className="p-16 text-center text-sm text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            No questions assigned yet. Click "Manage Questions" to pick from the bank.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {test.questions.map((q, idx) => (
              <li key={q._id} className="p-5 flex justify-between items-start hover:bg-gray-50/50 dark:hover:bg-dark-250/30">
                <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-gray-400">Q{idx + 1}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{q.examType}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-400">{q.subject} · {q.topic}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold capitalize bg-amber-100 dark:bg-amber-900/20 text-amber-700">{q.difficulty}</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{q.question}</p>
                </div>
                <button
                  onClick={() => removeQuestionFromTest(q._id)}
                  className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  title="Remove from test"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {test.questions.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
            <button
              onClick={handleSaveQuestions}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
            >
              {saving ? 'Saving…' : 'Persist Question List'}
            </button>
          </div>
        )}
      </div>

      {/* Question Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPickerOpen(false)}>
          <div
            className="bg-white dark:bg-dark-300 max-w-4xl w-full max-h-[90vh] flex flex-col rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white">Pick Questions</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedIds.size} selected</p>
              </div>
              <button onClick={() => setPickerOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-450 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-white text-sm"
                />
              </div>
              <select
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl dark:text-white text-sm"
              >
                <option value="">All Exam Types</option>
                <option value="BTSC">BTSC JE</option>
                <option value="SSC">SSC JE</option>
                <option value="BPSC">BPSC AE</option>
                <option value="Railway">Railway RRB</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {questionsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
              ) : filteredPool.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">No questions match.</div>
              ) : (
                <ul className="space-y-2">
                  {filteredPool.map(q => {
                    const checked = selectedIds.has(q._id);
                    return (
                      <li
                        key={q._id}
                        onClick={() => toggleSelected(q._id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          checked
                            ? 'border-rose-500/60 bg-rose-50/40 dark:bg-rose-950/10'
                            : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-250'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={checked} readOnly className="mt-1 accent-rose-500" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{q.examType}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-400">{q.subject} · {q.topic}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold capitalize bg-amber-100 dark:bg-amber-900/20 text-amber-700">{q.difficulty}</span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{q.question}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setPickerOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestions}
                disabled={saving}
                className="px-5 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
              >
                {saving ? 'Saving…' : `Assign ${selectedIds.size} Questions`}
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
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-white text-sm"
      />
    </div>
  );
}
