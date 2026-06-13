import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import {
  BarChart3, Loader2, RefreshCw, TrendingUp, Users, IndianRupee, Award, Activity
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

const PIE_COLORS = ['#3b82f6', '#a855f7', '#22d3ee', '#ec4899', '#f59e0b', '#10b981'];
const DEFAULT_AVATAR = 'https://res.cloudinary.com/mock-cloud/image/upload/v1/default-avatar.png';

const TOOLTIP_STYLE = {
  background: 'rgba(15,18,38,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff'
};

export default function AdminAnalytics() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tests/admin/analytics');
      if (res.data.success) setData(res.data.data);
    } catch { dispatch(addToast({ message: 'Failed to load analytics', type: 'error' })); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <Loader2 className="h-10 w-10 animate-spin text-neon-cyan" />
        <p className="text-sm text-slate-400">Crunching analytics...</p>
      </div>
    );
  }
  if (!data) return null;

  const userTrendData = data.userTrend.map((d) => ({ date: d._id.slice(5), users: d.count }));
  const subTrendData = data.submissionsTrend.map((d) => ({
    date: d._id.slice(5), submissions: d.count, accuracy: Math.round(d.avgAccuracy || 0)
  }));
  const categoryData = data.categoryBreakdown.map((c) => ({ name: c._id, tests: c.tests, active: c.active }));

  const kpis = [
    { label: 'Active subs', value: data.revenue.activeSubs, icon: Users, gradient: 'from-neon-blue to-neon-cyan' },
    { label: 'Revenue', value: `₹${data.revenue.total.toLocaleString('en-IN')}`, icon: IndianRupee, gradient: 'from-emerald-400 to-emerald-600' },
    { label: 'Top accuracy', value: data.topPerformers[0]?.accuracy ? `${data.topPerformers[0].accuracy}%` : '—', icon: Award, gradient: 'from-amber-400 to-orange-500' },
    { label: 'Submissions (30d)', value: data.submissionsTrend.reduce((s, d) => s + d.count, 0), icon: Activity, gradient: 'from-rose-500 to-neon-purple' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-neon-purple/15 p-3 text-neon-purple">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Platform <span className="text-gradient">analytics</span></h1>
            <p className="mt-1 text-sm text-slate-400">Real-time insights across registrations, attempts, revenue.</p>
          </div>
        </div>
        <button onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.08] md:self-auto">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <GlassCard key={k.label} className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{k.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-white">{k.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${k.gradient} shadow-neon-blue`}>
                <k.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="!p-6" hover={false}>
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-white">
            <TrendingUp className="h-4 w-4 text-emerald-400" /> New registrations (30d)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={userTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="!p-6" hover={false}>
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-white">
            <Activity className="h-4 w-4 text-rose-400" /> Submissions & accuracy (30d)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={subTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="submissions" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3, fill: '#f43f5e' }} />
              <Line type="monotone" dataKey="accuracy" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3, fill: '#a855f7' }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="!p-6" hover={false}>
          <h3 className="mb-4 font-display text-base font-bold text-white">Score distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="bucket" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="!p-6" hover={false}>
          <h3 className="mb-4 font-display text-base font-bold text-white">Exam category mix</h3>
          {categoryData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">No categories yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="tests" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={55} paddingAngle={3}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      <GlassCard className="!p-6" hover={false}>
        <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-white">
          <Award className="h-4 w-4 text-amber-400" /> Top 10 performers
        </h3>
        {data.topPerformers.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No candidate scores yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Candidate</th>
                  <th className="px-4 py-3 text-left">Tests</th>
                  <th className="px-4 py-3 text-left">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.topPerformers.map((u, i) => (
                  <tr key={u._id} className="text-slate-300 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-bold text-slate-500">#{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={u.profileImage || DEFAULT_AVATAR} alt="" onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                          className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10" />
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{u.testsAttempted}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">{u.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
