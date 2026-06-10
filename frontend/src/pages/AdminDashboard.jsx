import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Plus,
  Sparkles,
  Loader2,
  Users,
  FileText,
  Trash2,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BookOpen,
  Cpu,
  Save
} from 'lucide-react';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Tabs: 'blueprints' | 'tests' | 'candidates'
  const [activeTab, setActiveTab] = useState('blueprints');

  // Stats State
  const [stats, setStats] = useState({ students: 0, questions: 0, tests: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Lists States
  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);

  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Test Generator Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualDuration, setManualDuration] = useState('60');
  const [manualCategory, setManualCategory] = useState('BTSC');
  const [manualPenalty, setManualPenalty] = useState('0.25');
  const [loading, setLoading] = useState(false);

  // AI Mock Generator Form State
  const [aiTitle, setAiTitle] = useState('');
  const [aiDuration, setAiDuration] = useState('60');
  const [aiCategory, setAiCategory] = useState('BTSC');
  const [aiSubject, setAiSubject] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState('5');
  const [aiCreating, setAiCreating] = useState(false);

  // AI Provider Settings State
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiOpenaiKey, setAiOpenaiKey] = useState('');
  const [aiOpenaiKeyMasked, setAiOpenaiKeyMasked] = useState('');
  const [aiOpenaiKeyConfigured, setAiOpenaiKeyConfigured] = useState(false);
  const [aiOpenaiModel, setAiOpenaiModel] = useState('gpt-4o-mini');
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);
  const [aiSettingsSaving, setAiSettingsSaving] = useState(false);

  const fetchAISettings = async () => {
    setAiSettingsLoading(true);
    try {
      const res = await api.get('/admin/ai-settings');
      if (res.data.success) {
        const d = res.data.data;
        setAiProvider(d.aiProvider || 'gemini');
        setAiOpenaiModel(d.openaiModel || 'gpt-4o-mini');
        setAiOpenaiKeyMasked(d.openaiKeyMasked || '');
        setAiOpenaiKeyConfigured(!!d.openaiKeyConfigured);
        setAiOpenaiKey('');
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to load AI settings', type: 'error' }));
    } finally {
      setAiSettingsLoading(false);
    }
  };

  const handleSaveAISettings = async (e) => {
    e.preventDefault();
    setAiSettingsSaving(true);
    try {
      const payload = { aiProvider, openaiModel: aiOpenaiModel };
      if (aiOpenaiKey.trim()) payload.openaiApiKey = aiOpenaiKey.trim();
      const res = await api.put('/admin/ai-settings', payload);
      if (res.data.success) {
        dispatch(addToast({ message: 'AI settings saved successfully', type: 'success' }));
        fetchAISettings();
      }
    } catch (err) {
      dispatch(addToast({ message: err?.response?.data?.message || 'Failed to save AI settings', type: 'error' }));
    } finally {
      setAiSettingsSaving(false);
    }
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/tests/admin/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch all tests
  const fetchTests = async () => {
    setTestsLoading(true);
    try {
      const res = await api.get('/tests');
      if (res.data.success) {
        setTests(res.data.data);
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to fetch test templates', type: 'error' }));
    } finally {
      setTestsLoading(false);
    }
  };

  // Fetch all candidates
  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setCandidates(res.data.data);
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to fetch candidate list', type: 'error' }));
    } finally {
      setCandidatesLoading(false);
    }
  };

  // Toggle Test Active Status
  const handleToggleTestStatus = async (testId) => {
    try {
      const res = await api.put(`/tests/${testId}/toggle`);
      if (res.data.success) {
        dispatch(addToast({ message: res.data.message, type: 'success' }));
        setTests(prev =>
          prev.map(t => (t._id === testId ? { ...t, isActive: res.data.data.isActive } : t))
        );
        fetchStats();
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to toggle test status', type: 'error' }));
    }
  };

  // Update Candidate Role (admin <-> student)
  const handleUpdateRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    try {
      const res = await api.put(`/auth/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        dispatch(addToast({ message: 'User role updated successfully', type: 'success' }));
        setCandidates(prev =>
          prev.map(c => (c._id === userId ? { ...c, role: newRole } : c))
        );
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to update user role', type: 'error' }));
    }
  };

  // Delete Candidate Account
  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        'WARNING: This will permanently delete this candidate account and all their exam logs. This action is irreversible. Continue?'
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(`/auth/users/${userId}`);
      if (res.data.success) {
        dispatch(addToast({ message: 'Candidate account deleted', type: 'success' }));
        setCandidates(prev => prev.filter(c => c._id !== userId));
        fetchStats();
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to delete candidate account', type: 'error' }));
    }
  };

  // Create Test Template
  const handleCreateManualTest = async (e) => {
    e.preventDefault();
    if (!manualTitle) return;

    setLoading(true);
    try {
      const res = await api.post('/tests', {
        title: manualTitle,
        duration: parseInt(manualDuration),
        examCategory: manualCategory,
        negativeMarking: parseFloat(manualPenalty),
        questions: [],
        totalMarks: 100
      });
      if (res.data.success) {
        dispatch(addToast({ message: 'Test template created successfully!', type: 'success' }));
        setManualTitle('');
        fetchStats();
        if (activeTab === 'tests') fetchTests();
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to create test template', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  // Generate AI Mock Test
  const handleCreateAITest = async (e) => {
    e.preventDefault();
    if (!aiTitle || !aiSubject || !aiTopic) {
      dispatch(addToast({ message: 'Please complete all AI form parameters', type: 'error' }));
      return;
    }

    setAiCreating(true);
    try {
      const res = await api.post('/ai/generate-mock', {
        title: aiTitle,
        duration: parseInt(aiDuration),
        examCategory: aiCategory,
        subject: aiSubject,
        topic: aiTopic,
        questionCount: parseInt(aiCount),
        difficulty: 'medium'
      });
      if (res.data.success) {
        dispatch(addToast({ message: 'AI Mock test generated and saved to database!', type: 'success' }));
        setAiTitle('');
        setAiSubject('');
        setAiTopic('');
        fetchStats();
        if (activeTab === 'tests') fetchTests();
      }
    } catch (err) {
      dispatch(addToast({ message: 'AI test generation failed', type: 'error' }));
    } finally {
      setAiCreating(false);
    }
  };

  // Initial mount load
  useEffect(() => {
    fetchStats();
  }, []);

  // Sync tab loading
  useEffect(() => {
    if (activeTab === 'tests') {
      fetchTests();
    } else if (activeTab === 'candidates') {
      fetchCandidates();
    } else if (activeTab === 'ai-provider') {
      fetchAISettings();
    }
  }, [activeTab]);

  // Filter candidates by search query
  const filteredCandidates = candidates.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="absolute -right-24 top-10 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -left-24 bottom-10 h-52 w-52 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-300">
              <ShieldCheck className="w-4 h-4" />
              Admin Command Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Smart exam operations for your entire student base.</h1>
            <p className="text-slate-300 leading-7">Monitor user activity, build test series faster, and manage candidate access with a polished admin experience designed for productivity.</p>
          </div>
          <button
            onClick={() => {
              fetchStats();
              if (activeTab === 'tests') fetchTests();
              if (activeTab === 'candidates') fetchCandidates();
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-white/10 transition hover:-translate-y-0.5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Dashboard
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {statsLoading ? (
          Array(3).fill(0).map((_, idx) => (
            <div key={idx} className="h-28 animate-pulse rounded-3xl bg-slate-800/80" />
          ))
        ) : (
          [
            { label: 'Registered Candidates', value: stats.students, icon: Users, color: 'bg-sky-500/10 text-sky-300' },
            { label: 'Active Question Pool', value: stats.questions, icon: BookOpen, color: 'bg-emerald-500/10 text-emerald-300' },
            { label: 'Mock Test Series', value: stats.tests, icon: FileText, color: 'bg-rose-500/10 text-rose-300' }
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-lg shadow-slate-950/20"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{stat.label}</p>
                  <h2 className="mt-3 text-3xl font-black text-white">{stat.value}</h2>
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-3xl ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-4 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('blueprints')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeTab === 'blueprints'
                ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Test Series Configurator
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeTab === 'tests'
                ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Manage Active Mocks
            </span>
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeTab === 'candidates'
                ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Users className="w-4 h-4" />
              Candidate Manager
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ai-provider')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeTab === 'ai-provider'
                ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              AI Provider
            </span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'blueprints' && (
            <motion.div
              key="blueprints"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Manual Builder */}
              <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-rose-550" />
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Create Test Template</h3>
                </div>

                <form onSubmit={handleCreateManualTest} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Test Title</label>
                    <input
                      type="text"
                      placeholder="e.g. BTSC JE CSE mock #4"
                      value={manualTitle}
                      onChange={e => setManualTitle(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:text-white transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Duration (mins)</label>
                      <input
                        type="number"
                        value={manualDuration}
                        onChange={e => setManualDuration(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:text-white transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Negative Penalty</label>
                      <select
                        value={manualPenalty}
                        onChange={e => setManualPenalty(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:text-white transition-all text-sm"
                      >
                        <option value="0.25">-0.25 marks</option>
                        <option value="0.33">-0.33 marks</option>
                        <option value="0.0">No negative marks</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Exam Category</label>
                    <select
                      value={manualCategory}
                      onChange={e => setManualCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:text-white transition-all text-sm"
                    >
                      <option value="BTSC">BTSC JE</option>
                      <option value="SSC">SSC JE</option>
                      <option value="BPSC">BPSC AE</option>
                      <option value="Railway">Railway RRB</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-rose-500/10"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Template</span>}
                  </button>
                </form>
              </div>

              {/* AI Mock Builder */}
              <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">AI Mock Test Architect</h3>
                </div>

                <form onSubmit={handleCreateAITest} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Test Title</label>
                    <input
                      type="text"
                      placeholder="e.g. AI Generated Fluid Mechanics Mock"
                      value={aiTitle}
                      onChange={e => setAiTitle(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Subject</label>
                      <input
                        type="text"
                        placeholder="e.g. Civil Engineering"
                        value={aiSubject}
                        onChange={e => setAiSubject(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Topic</label>
                      <input
                        type="text"
                        placeholder="e.g. Hydraulics"
                        value={aiTopic}
                        onChange={e => setAiTopic(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">MCQ Count</label>
                      <select
                        value={aiCount}
                        onChange={e => setAiCount(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                      >
                        <option value="5">5 Qs</option>
                        <option value="10">10 Qs</option>
                        <option value="20">20 Qs</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Duration</label>
                      <input
                        type="number"
                        value={aiDuration}
                        onChange={e => setAiDuration(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Category</label>
                      <select
                        value={aiCategory}
                        onChange={e => setAiCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                      >
                        <option value="BTSC">BTSC JE</option>
                        <option value="SSC">SSC JE</option>
                        <option value="BPSC">BPSC AE</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={aiCreating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500/50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    {aiCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Generate AI Mock Exam</span>}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'tests' && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                {testsLoading ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-16 space-y-4 rounded-3xl border border-slate-800 bg-slate-950/90">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                    <span className="text-slate-400">Fetching exam profiles...</span>
                  </div>
                ) : tests.length === 0 ? (
                  <div className="col-span-2 rounded-3xl border border-slate-800 bg-slate-950/90 p-12 text-center text-slate-400">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-500" />
                    <p className="font-semibold">No exam structures found.</p>
                    <p className="mt-2 text-sm text-slate-500">Create one using the Test Series Configurator.</p>
                  </div>
                ) : (
                  tests.map(test => (
                    <motion.div
                      layout
                      key={test._id}
                      className={`rounded-3xl border p-5 ${test.isActive ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-800 bg-slate-950/90'} shadow-xl shadow-slate-950/20`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{test.title}</h3>
                          <p className="mt-2 text-sm text-slate-400">Category: {test.examCategory}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${test.isActive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                          {test.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-3 rounded-3xl bg-slate-900/90 p-4 text-center text-slate-300">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-[0.3em]">Duration</p>
                          <p className="text-sm font-semibold text-white">{test.duration} min</p>
                        </div>
                        <div className="space-y-1 border-x border-slate-800 px-3">
                          <p className="text-[10px] uppercase tracking-[0.3em]">Negative</p>
                          <p className="text-sm font-semibold text-white">-{test.negativeMarking || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-[0.3em]">Questions</p>
                          <p className="text-sm font-semibold text-white">{test.questions?.length || 0}</p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">{test.isActive ? 'Live for students' : 'Hidden from student dashboard'}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/tests/${test._id}`)}
                            className="rounded-2xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                          >Edit</button>
                          <button
                            onClick={() => handleToggleTestStatus(test._id)}
                            className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${test.isActive ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                          >
                            {test.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'candidates' && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Registered Candidate Profiles</h2>
                  <p className="mt-1 text-sm text-slate-400">Manage users, roles, and performance metadata quickly.</p>
                </div>
                <div className="relative max-w-sm w-full md:w-80">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search candidates..."
                    className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-12 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25"
                  />
                </div>
              </div>

              {candidatesLoading ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-12 text-center text-slate-400">
                  <Users className="mx-auto mb-4 h-12 w-12 text-slate-500" />
                  <p className="font-semibold">No profiles match search parameters.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90">
                  <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-300">
                    <thead className="bg-slate-900 text-left text-xs uppercase tracking-[0.25em] text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Candidate</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Tests</th>
                        <th className="px-6 py-4">Accuracy</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-950">
                      {filteredCandidates.map(user => (
                        <tr key={user._id} className="hover:bg-slate-900/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.profileImage}
                                alt={user.name}
                                onError={e => { e.target.src = 'https://res.cloudinary.com/mock-cloud/image/upload/v1/default-avatar.png'; }}
                                className="h-10 w-10 rounded-2xl border border-slate-800 object-cover"
                              />
                              <div>
                                <p className="font-semibold text-white">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ${user.role === 'admin' ? 'bg-rose-500/15 text-rose-300' : 'bg-sky-500/15 text-sky-300'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white font-semibold">{user.testsAttempted || 0}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{user.accuracy ? `${user.accuracy}%` : '—'}</span>
                              {user.accuracy ? (
                                <span className="inline-block h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                                  <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${user.accuracy}%` }} />
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-3">
                            <button
                              onClick={() => handleUpdateRole(user._id, user.role)}
                              className="rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                            >Toggle</button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600"
                            >Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ai-provider' && (
            <motion.div
              key="ai-provider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 md:p-8 shadow-xl shadow-slate-950/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">AI Provider Control</h3>
                    <p className="text-xs text-slate-400">Switch between Gemini and OpenAI, or enable automatic fallback on rate-limit errors.</p>
                  </div>
                </div>

                {aiSettingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveAISettings} className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Active Provider</label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          { val: 'gemini', label: 'Gemini', desc: 'Google Gemini only' },
                          { val: 'openai', label: 'OpenAI', desc: 'GPT only' },
                          { val: 'fallback', label: 'Fallback', desc: 'Gemini → OpenAI on rate-limit' }
                        ].map(opt => (
                          <label
                            key={opt.val}
                            className={`cursor-pointer rounded-2xl border p-4 transition ${
                              aiProvider === opt.val
                                ? 'border-indigo-400 bg-indigo-500/10'
                                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="aiProvider"
                              value={opt.val}
                              checked={aiProvider === opt.val}
                              onChange={() => setAiProvider(opt.val)}
                              className="sr-only"
                            />
                            <div className="text-sm font-bold text-white">{opt.label}</div>
                            <div className="mt-1 text-xs text-slate-400">{opt.desc}</div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">OpenAI API Key</label>
                      <input
                        type="password"
                        value={aiOpenaiKey}
                        onChange={e => setAiOpenaiKey(e.target.value)}
                        placeholder={aiOpenaiKeyConfigured ? aiOpenaiKeyMasked + '  (leave blank to keep)' : 'sk-...'}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                      />
                      <p className={`text-xs ${aiOpenaiKeyConfigured ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {aiOpenaiKeyConfigured ? `Key configured (${aiOpenaiKeyMasked})` : 'No OpenAI key configured'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">OpenAI Model</label>
                      <select
                        value={aiOpenaiModel}
                        onChange={e => setAiOpenaiModel(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                      >
                        <option value="gpt-4o-mini">gpt-4o-mini (cheap & fast)</option>
                        <option value="gpt-4o">gpt-4o (balanced)</option>
                        <option value="gpt-4-turbo">gpt-4-turbo</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={aiSettingsSaving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {aiSettingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save AI Settings
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'blueprints' && (
            <motion.div
              key="blueprints"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Manual Builder */}
              <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-rose-550" />
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Create Test Template</h3>
                </div>

                <form onSubmit={handleCreateManualTest} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Test Title</label>
                    <input
                      type="text"
                      placeholder="e.g. BTSC JE CSE mock #4"
                      value={manualTitle}
                      onChange={e => setManualTitle(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:text-white transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Duration (mins)</label>
                      <input
                        type="number"
                        value={manualDuration}
                        onChange={e => setManualDuration(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:text-white transition-all text-sm"
                      /> 
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Negative Penalty</label>
                      <select
                        value={manualPenalty}
                        onChange={e => setManualPenalty(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:text-white transition-all text-sm"
                      >
                        <option value="0.25">-0.25 marks</option>
                        <option value="0.33">-0.33 marks</option>
                        <option value="0.0">No negative marks</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Exam Category</label>
                    <select
                      value={manualCategory}
                      onChange={e => setManualCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:text-white transition-all text-sm"
                    >
                      <option value="BTSC">BTSC JE</option>
                      <option value="SSC">SSC JE</option>
                      <option value="BPSC">BPSC AE</option>
                      <option value="Railway">Railway RRB</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-rose-500/10"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Template</span>}
                  </button>
                </form>
              </div>

              {/* AI Mock Builder */}
              <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">AI Mock Test Architect</h3>
                </div>

                <form onSubmit={handleCreateAITest} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Test Title</label>
                    <input
                      type="text"
                      placeholder="e.g. AI Generated Fluid Mechanics Mock"
                      value={aiTitle}
                      onChange={e => setAiTitle(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Subject</label>
                      <input
                        type="text"
                        placeholder="e.g. Civil Engineering"
                        value={aiSubject}
                        onChange={e => setAiSubject(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Topic</label>
                      <input
                        type="text"
                        placeholder="e.g. Hydraulics"
                        value={aiTopic}
                        onChange={e => setAiTopic(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">MCQ Count</label>
                      <select
                        value={aiCount}
                        onChange={e => setAiCount(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                      >
                        <option value="5">5 Qs</option>
                        <option value="10">10 Qs</option>
                        <option value="20">20 Qs</option>
                      </select>
                    </div>

                    <div className="col-span-1 space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Duration</label>
                      <input
                        type="number"
                        value={aiDuration}
                        onChange={e => setAiDuration(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                      />
                    </div>

                    <div className="col-span-1 space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Category</label>
                      <select
                        value={aiCategory}
                        onChange={e => setAiCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white transition-all text-sm"
                      >
                        <option value="BTSC">BTSC JE</option>
                        <option value="SSC">SSC JE</option>
                        <option value="BPSC">BPSC AE</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={aiCreating}
                    className="w-full bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-500/50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    {aiCreating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate AI Mock Exam</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'tests' && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Active Test Series Blueprints</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                    View active test statistics and enable/disable exams for students immediately.
                  </p>
                </div>
              </div>

              {testsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                  <span className="text-gray-500 text-sm font-medium">Fetching exam profiles...</span>
                </div>
              ) : tests.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="font-semibold text-sm">No exam structures found.</p>
                  <p className="text-xs text-gray-450 mt-1">Create one using the Test Series Configurator.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tests.map(test => (
                    <motion.div
                      layout
                      key={test._id}
                      className={`relative bg-gray-50 dark:bg-dark-250 p-5 md:p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                        test.isActive
                          ? 'border-emerald-550/30 bg-emerald-500/[0.01]'
                          : 'border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Title & Category Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-gray-850 dark:text-white text-base leading-snug">
                              {test.title}
                            </h4>
                            <span className="text-xs text-gray-500 mt-1 block">Category: {test.examCategory}</span>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                              test.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-gray-200 text-gray-650 dark:bg-dark-150 dark:text-gray-400'
                            }`}
                          >
                            {test.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Test details */}
                        <div className="grid grid-cols-3 gap-2 bg-white dark:bg-dark-300 p-3 rounded-xl border border-gray-150 dark:border-gray-800 text-center">
                          <div className="flex flex-col items-center">
                            <Clock className="w-3.5 h-3.5 text-gray-450 mb-1" />
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Duration</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {test.duration} min
                            </span>
                          </div>
                          <div className="flex flex-col items-center border-x border-gray-200 dark:border-gray-800">
                            <Award className="w-3.5 h-3.5 text-gray-450 mb-1" />
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Negative</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              -{test.negativeMarking || 0} Q
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <BookOpen className="w-3.5 h-3.5 text-gray-450 mb-1" />
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Questions</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {test.questions?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Toggle Switch */}
                      <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">
                          {test.isActive ? 'Allow student attempts' : 'Hide from active test lists'}
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/admin/tests/${test._id}`)}
                            className="font-bold text-xs py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleTestStatus(test._id)}
                            className="flex items-center space-x-2 font-bold text-xs py-1.5 px-3 rounded-lg bg-white hover:bg-gray-100 dark:bg-dark-200 dark:hover:bg-dark-100 border border-gray-200 dark:border-gray-850 text-gray-700 dark:text-gray-300 cursor-pointer transition-all"
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                test.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                              }`}
                            />
                            <span>{test.isActive ? 'Deactivate' : 'Activate'}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'candidates' && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Registered Candidate Profiles</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                    Modify database profiles, change administrative credentials, and manage registrations.
                  </p>
                </div>

                {/* Search box */}
                <div className="relative max-w-sm w-full">
                  <Search className="w-4 h-4 text-gray-450 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search candidate name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:text-white transition-all text-sm"
                  />
                </div>
              </div>

              {candidatesLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                  <span className="text-gray-500 text-sm font-medium">Loading database profiles...</span>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="font-semibold text-sm">No profiles match search parameters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-805">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-850">
                    <thead className="bg-gray-50 dark:bg-dark-250 text-left">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Joined Date
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tests Attempted
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Avg Accuracy
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-850 bg-white dark:bg-dark-300">
                      {filteredCandidates.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50/50 dark:hover:bg-dark-250/20 transition-all">
                          {/* Profile & info */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <img
                                src={user.profileImage}
                                alt={user.name}
                                className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-800"
                                onError={e => {
                                  e.target.src =
                                    'https://res.cloudinary.com/mock-cloud/image/upload/v1/default-avatar.png';
                                }}
                              />
                              <div>
                                <span className="font-semibold text-gray-850 dark:text-white block text-sm">
                                  {user.name}
                                </span>
                                <span className="text-xs text-gray-400 block">{user.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Joined Date */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>

                          {/* Role */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                user.role === 'admin'
                                  ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-455'
                                  : 'bg-blue-500/10 text-blue-650 dark:bg-blue-500/20 dark:text-blue-400'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>

                          {/* Attempted */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {user.testsAttempted || 0}
                          </td>

                          {/* Accuracy */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {user.accuracy ? `${user.accuracy}%` : '—'}
                              </span>
                              {user.accuracy ? (
                                <div className="w-16 bg-gray-200 dark:bg-dark-150 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full"
                                    style={{ width: `${user.accuracy}%` }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-3">
                            <button
                              onClick={() => handleUpdateRole(user._id, user.role)}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-350 cursor-pointer"
                            >
                              Toggle Role
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-rose-550 hover:text-rose-700 dark:text-rose-450 dark:hover:text-rose-350 cursor-pointer inline-flex items-center space-x-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
