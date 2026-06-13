import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import {
  ShieldCheck, Plus, Sparkles, Loader2, Users, FileText, Search,
  RefreshCw, Sliders, BookOpen, Cpu, Save, Trash2, Clock, Award
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import AnimatedCounter from '../components/ui/AnimatedCounter';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('blueprints');
  const [stats, setStats] = useState({ students: 0, questions: 0, tests: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);

  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual form
  const [manualTitle, setManualTitle] = useState('');
  const [manualDuration, setManualDuration] = useState('60');
  const [manualCategory, setManualCategory] = useState('BTSC');
  const [manualPenalty, setManualPenalty] = useState('0.25');
  const [loading, setLoading] = useState(false);

  // AI form
  const [aiTitle, setAiTitle] = useState('');
  const [aiDuration, setAiDuration] = useState('60');
  const [aiCategory, setAiCategory] = useState('BTSC');
  const [aiSubject, setAiSubject] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState('5');
  const [aiCreating, setAiCreating] = useState(false);

  // AI provider
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
    } catch { dispatch(addToast({ message: 'Failed to load AI settings', type: 'error' })); }
    finally { setAiSettingsLoading(false); }
  };

  const handleSaveAISettings = async (e) => {
    e.preventDefault();
    setAiSettingsSaving(true);
    try {
      const payload = { aiProvider, openaiModel: aiOpenaiModel };
      if (aiOpenaiKey.trim()) payload.openaiApiKey = aiOpenaiKey.trim();
      const res = await api.put('/admin/ai-settings', payload);
      if (res.data.success) {
        dispatch(addToast({ message: 'AI settings saved', type: 'success' }));
        fetchAISettings();
      }
    } catch (err) {
      dispatch(addToast({ message: err?.response?.data?.message || 'Save failed', type: 'error' }));
    } finally { setAiSettingsSaving(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/tests/admin/stats');
      if (res.data.success) setStats(res.data.data);
    } catch {}
    finally { setStatsLoading(false); }
  };

  const fetchTests = async () => {
    setTestsLoading(true);
    try {
      const res = await api.get('/tests');
      if (res.data.success) setTests(res.data.data);
    } catch { dispatch(addToast({ message: 'Failed to fetch tests', type: 'error' })); }
    finally { setTestsLoading(false); }
  };

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) setCandidates(res.data.data);
    } catch { dispatch(addToast({ message: 'Failed to fetch users', type: 'error' })); }
    finally { setCandidatesLoading(false); }
  };

  const handleToggleTestStatus = async (testId) => {
    try {
      const res = await api.put(`/tests/${testId}/toggle`);
      if (res.data.success) {
        dispatch(addToast({ message: res.data.message, type: 'success' }));
        setTests((p) => p.map((t) => t._id === testId ? { ...t, isActive: res.data.data.isActive } : t));
        fetchStats();
      }
    } catch { dispatch(addToast({ message: 'Toggle failed', type: 'error' })); }
  };

  const handleUpdateRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Change role to ${newRole.toUpperCase()}?`)) return;
    try {
      const res = await api.put(`/auth/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        dispatch(addToast({ message: 'Role updated', type: 'success' }));
        setCandidates((p) => p.map((c) => c._id === userId ? { ...c, role: newRole } : c));
      }
    } catch { dispatch(addToast({ message: 'Role update failed', type: 'error' })); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this account permanently?')) return;
    try {
      const res = await api.delete(`/auth/users/${userId}`);
      if (res.data.success) {
        dispatch(addToast({ message: 'Deleted', type: 'success' }));
        setCandidates((p) => p.filter((c) => c._id !== userId));
        fetchStats();
      }
    } catch { dispatch(addToast({ message: 'Delete failed', type: 'error' })); }
  };

  const handleCreateManualTest = async (e) => {
    e.preventDefault();
    if (!manualTitle) return;
    setLoading(true);
    try {
      const res = await api.post('/tests', {
        title: manualTitle, duration: parseInt(manualDuration), examCategory: manualCategory,
        negativeMarking: parseFloat(manualPenalty), questions: [], totalMarks: 100
      });
      if (res.data.success) {
        dispatch(addToast({ message: 'Template created', type: 'success' }));
        setManualTitle('');
        fetchStats();
        if (activeTab === 'tests') fetchTests();
      }
    } catch { dispatch(addToast({ message: 'Create failed', type: 'error' })); }
    finally { setLoading(false); }
  };

  const handleCreateAITest = async (e) => {
    e.preventDefault();
    if (!aiTitle || !aiSubject || !aiTopic) {
      dispatch(addToast({ message: 'Complete all AI parameters', type: 'error' }));
      return;
    }
    setAiCreating(true);
    try {
      const res = await api.post('/ai/generate-mock', {
        title: aiTitle, duration: parseInt(aiDuration), examCategory: aiCategory,
        subject: aiSubject, topic: aiTopic, questionCount: parseInt(aiCount), difficulty: 'medium'
      });
      if (res.data.success) {
        dispatch(addToast({ message: 'AI mock test generated', type: 'success' }));
        setAiTitle(''); setAiSubject(''); setAiTopic('');
        fetchStats();
        if (activeTab === 'tests') fetchTests();
      }
    } catch { dispatch(addToast({ message: 'AI generation failed', type: 'error' })); }
    finally { setAiCreating(false); }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (activeTab === 'tests') fetchTests();
    else if (activeTab === 'candidates') fetchCandidates();
    else if (activeTab === 'ai-provider') fetchAISettings();
  }, [activeTab]);

  const filtered = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
    || c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS = [
    { id: 'blueprints', icon: Sliders, label: 'Builder' },
    { id: 'tests', icon: FileText, label: 'Active Mocks' },
    { id: 'candidates', icon: Users, label: 'Candidates' },
    { id: 'ai-provider', icon: Cpu, label: 'AI Provider' }
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/15 via-neon-purple/15 to-neon-blue/15" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
              <ShieldCheck className="h-3 w-3 text-rose-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-200">Admin Console</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-white md:text-4xl">
              Smart exam <span className="text-gradient">operations</span>
            </h1>
            <p className="mt-2 text-sm text-slate-300">Build mock tests, monitor candidates, configure AI providers.</p>
          </div>
          <button
            onClick={() => { fetchStats(); if (activeTab === 'tests') fetchTests(); if (activeTab === 'candidates') fetchCandidates(); }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08]"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {statsLoading
          ? [1, 2, 3].map((n) => <div key={n} className="skeleton-shimmer h-24 rounded-2xl border border-white/5" />)
          : [
              { label: 'Students', value: stats.students, icon: Users, gradient: 'from-neon-blue to-neon-cyan' },
              { label: 'Questions', value: stats.questions, icon: BookOpen, gradient: 'from-emerald-400 to-emerald-600' },
              { label: 'Mock series', value: stats.tests, icon: FileText, gradient: 'from-rose-500 to-neon-purple' }
            ].map((s) => (
              <GlassCard key={s.label} className="!p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
                    <p className="mt-2 font-display text-3xl font-bold text-white"><AnimatedCounter to={s.value} /></p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} shadow-neon-blue`}>
                    <s.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </GlassCard>
            ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === t.id ? 'bg-gradient-blue-purple text-white shadow-neon-blue' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'blueprints' && (
          <motion.div
            key="blueprints"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          >
            <GlassCard className="!p-6" hover={false}>
              <h3 className="mb-5 flex items-center gap-2 font-display text-base font-bold text-white">
                <Plus className="h-4 w-4 text-rose-400" /> Manual template
              </h3>
              <form onSubmit={handleCreateManualTest} className="space-y-4">
                <Field label="Test title" value={manualTitle} onChange={setManualTitle} placeholder="e.g. BTSC JE Mock #4" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Duration (min)" type="number" value={manualDuration} onChange={setManualDuration} />
                  <Select label="Penalty" value={manualPenalty} onChange={setManualPenalty} options={[
                    { val: '0.25', label: '-0.25' }, { val: '0.33', label: '-0.33' }, { val: '0.0', label: 'No negative' }
                  ]} />
                </div>
                <Select label="Category" value={manualCategory} onChange={setManualCategory} options={[
                  { val: 'BTSC', label: 'BTSC JE' }, { val: 'SSC', label: 'SSC JE' },
                  { val: 'BPSC', label: 'BPSC AE' }, { val: 'Railway', label: 'Railway RRB' }
                ]} />
                <GradientButton type="submit" disabled={loading} className="!w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create template'}
                </GradientButton>
              </form>
            </GlassCard>

            <GlassCard className="!p-6" hover={false}>
              <h3 className="mb-5 flex items-center gap-2 font-display text-base font-bold text-white">
                <Sparkles className="h-4 w-4 text-neon-purple" /> AI mock architect
              </h3>
              <form onSubmit={handleCreateAITest} className="space-y-4">
                <Field label="Test title" value={aiTitle} onChange={setAiTitle} placeholder="AI-Generated Fluid Mechanics" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Subject" value={aiSubject} onChange={setAiSubject} placeholder="Civil" />
                  <Field label="Topic" value={aiTopic} onChange={setAiTopic} placeholder="Hydraulics" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Select label="MCQs" value={aiCount} onChange={setAiCount} options={[
                    { val: '5', label: '5 Qs' }, { val: '10', label: '10 Qs' }, { val: '20', label: '20 Qs' }
                  ]} />
                  <Field label="Duration" type="number" value={aiDuration} onChange={setAiDuration} />
                  <Select label="Category" value={aiCategory} onChange={setAiCategory} options={[
                    { val: 'BTSC', label: 'BTSC' }, { val: 'SSC', label: 'SSC' }, { val: 'BPSC', label: 'BPSC' }
                  ]} />
                </div>
                <GradientButton type="submit" disabled={aiCreating} className="!w-full">
                  {aiCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Generate AI mock</>}
                </GradientButton>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'tests' && (
          <motion.div key="tests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {testsLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((n) => <div key={n} className="skeleton-shimmer h-48 rounded-2xl border border-white/5" />)}
              </div>
            ) : tests.length === 0 ? (
              <GlassCard className="!p-16 text-center" hover={false}>
                <BookOpen className="mx-auto h-12 w-12 text-slate-600" />
                <p className="mt-4 text-sm text-slate-400">No exam structures yet.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {tests.map((t) => (
                  <GlassCard key={t._id} className={`!p-5 ${t.isActive ? 'ring-1 ring-emerald-500/30' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-white">{t.title}</h3>
                        <p className="mt-1 text-xs text-slate-400">{t.examCategory}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
                        t.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.04] text-slate-400'
                      }`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                      <Stat icon={Clock} label="Duration" value={`${t.duration}m`} />
                      <Stat icon={Award} label="Negative" value={`-${t.negativeMarking || 0}`} />
                      <Stat icon={FileText} label="Qs" value={t.questions?.length || 0} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">{t.isActive ? 'Live' : 'Hidden'}</span>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/admin/tests/${t._id}`)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white hover:bg-white/[0.08]">Edit</button>
                        <button onClick={() => handleToggleTestStatus(t._id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                          t.isActive ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}>{t.isActive ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'candidates' && (
          <motion.div key="cands" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <GlassCard className="!p-4" hover={false}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidates by name or email..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15"
                />
              </div>
            </GlassCard>
            <GlassCard className="!p-0 overflow-hidden" hover={false}>
              {candidatesLoading ? (
                <div className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-cyan" /></div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">No profiles match.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="px-6 py-3 text-left">Candidate</th>
                        <th className="px-6 py-3 text-left">Joined</th>
                        <th className="px-6 py-3 text-left">Role</th>
                        <th className="px-6 py-3 text-left">Tests</th>
                        <th className="px-6 py-3 text-left">Accuracy</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filtered.map((u) => (
                        <tr key={u._id} className="text-slate-300 transition hover:bg-white/[0.03]">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <img src={u.profileImage} alt="" onError={(e) => { e.target.src = 'https://res.cloudinary.com/mock-cloud/image/upload/v1/default-avatar.png'; }}
                                className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/10" />
                              <div>
                                <p className="font-semibold text-white">{u.name}</p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${
                              u.role === 'admin' ? 'bg-rose-500/15 text-rose-300' : 'bg-neon-blue/15 text-neon-cyan'
                            }`}>{u.role}</span>
                          </td>
                          <td className="px-6 py-3 font-bold text-white">{u.testsAttempted || 0}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{u.accuracy ? `${u.accuracy}%` : '—'}</span>
                              {u.accuracy ? (
                                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                                  <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${u.accuracy}%` }} />
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right space-x-2">
                            <button onClick={() => handleUpdateRole(u._id, u.role)} className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-slate-200 hover:bg-white/[0.08]">Toggle</button>
                            <button onClick={() => handleDeleteUser(u._id)} className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/20">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'ai-provider' && (
          <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <GlassCard className="!p-6 md:!p-8" hover={false}>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-neon-purple/15 p-2.5 text-neon-purple">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">AI provider control</h3>
                  <p className="text-xs text-slate-400">Switch between Gemini and OpenAI, or enable fallback.</p>
                </div>
              </div>
              {aiSettingsLoading ? (
                <div className="py-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-purple" /></div>
              ) : (
                <form onSubmit={handleSaveAISettings} className="space-y-6">
                  <div>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Active provider</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { val: 'gemini', label: 'Gemini', desc: 'Google Gemini only' },
                        { val: 'openai', label: 'OpenAI', desc: 'GPT only' },
                        { val: 'fallback', label: 'Fallback', desc: 'Gemini → OpenAI' }
                      ].map((opt) => (
                        <label key={opt.val}
                          className={`cursor-pointer rounded-xl border p-4 transition ${
                            aiProvider === opt.val ? 'border-neon-purple/60 bg-neon-purple/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                          }`}>
                          <input type="radio" name="aiProvider" value={opt.val} checked={aiProvider === opt.val} onChange={() => setAiProvider(opt.val)} className="sr-only" />
                          <p className="font-bold text-white">{opt.label}</p>
                          <p className="mt-1 text-xs text-slate-400">{opt.desc}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">OpenAI API Key</label>
                    <input type="password" value={aiOpenaiKey} onChange={(e) => setAiOpenaiKey(e.target.value)}
                      placeholder={aiOpenaiKeyConfigured ? `${aiOpenaiKeyMasked} (leave blank to keep)` : 'sk-...'}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-neon-purple/60 focus:ring-2 focus:ring-neon-purple/15"
                    />
                    <p className={`text-xs ${aiOpenaiKeyConfigured ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {aiOpenaiKeyConfigured ? `Configured (${aiOpenaiKeyMasked})` : 'No key set'}
                    </p>
                  </div>
                  <Select label="OpenAI model" value={aiOpenaiModel} onChange={setAiOpenaiModel} options={[
                    { val: 'gpt-4o-mini', label: 'gpt-4o-mini (cheap)' },
                    { val: 'gpt-4o', label: 'gpt-4o (balanced)' },
                    { val: 'gpt-4-turbo', label: 'gpt-4-turbo' }
                  ]} />
                  <button type="submit" disabled={aiSettingsSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-blue-purple px-5 py-2.5 text-sm font-bold text-white shadow-neon-blue hover:-translate-y-0.5 disabled:opacity-50">
                    {aiSettingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save settings
                  </button>
                </form>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15" />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15">
        {options.map((o) => <option key={o.val} value={o.val} className="bg-ink-900">{o.label}</option>)}
      </select>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <Icon className="mx-auto h-3.5 w-3.5 text-slate-500" />
      <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="font-bold text-white">{value}</p>
    </div>
  );
}
