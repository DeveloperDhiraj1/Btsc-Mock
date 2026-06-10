import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../store/slices/uiSlice';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import {
  BarChart3, Loader2, RefreshCw, TrendingUp, Users,
  IndianRupee, Award, Activity
} from 'lucide-react';

const PIE_COLORS = ['#f43f5e', '#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6'];
const DEFAULT_AVATAR = 'https://res.cloudinary.com/mock-cloud/image/upload/v1/default-avatar.png';

export default function AdminAnalytics() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tests/admin/analytics');
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      dispatch(addToast({ message: 'Failed to load analytics', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
        <span className="text-gray-500 text-sm font-medium">Crunching analytics data...</span>
      </div>
    );
  }

  if (!data) return null;

  const userTrendData = data.userTrend.map(d => ({ date: d._id.slice(5), users: d.count }));
  const subTrendData = data.submissionsTrend.map(d => ({
    date: d._id.slice(5),
    submissions: d.count,
    accuracy: Math.round(d.avgAccuracy || 0)
  }));
  const categoryData = data.categoryBreakdown.map(c => ({
    name: c._id,
    tests: c.tests,
    active: c.active
  }));

  const kpis = [
    {
      label: 'Active Subscriptions',
      value: data.revenue.activeSubs,
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Total Revenue (INR)',
      value: `₹${data.revenue.total.toLocaleString('en-IN')}`,
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Top Accuracy',
      value: data.topPerformers[0]?.accuracy ? `${data.topPerformers[0].accuracy}%` : '—',
      icon: <Award className="w-5 h-5" />,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Total Submissions (30d)',
      value: data.submissionsTrend.reduce((s, d) => s + d.count, 0),
      icon: <Activity className="w-5 h-5" />,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-rose-500">
          <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Platform Analytics
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              Realtime insights across registrations, attempts, revenue and category mix.
            </p>
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-dark-200 dark:hover:bg-dark-100 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold transition-all self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-5 rounded-3xl shadow-sm flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase block">{kpi.label}</span>
              <h3 className="text-xl md:text-2xl font-black mt-1 text-gray-850 dark:text-white">{kpi.value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>{kpi.icon}</div>
          </div>
        ))}
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-extrabold text-gray-900 dark:text-white">New Registrations (30d)</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={userTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-rose-500" />
            <h3 className="font-extrabold text-gray-900 dark:text-white">Submissions & Avg Accuracy (30d)</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={subTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Line type="monotone" dataKey="submissions" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-gray-900 dark:text-white mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis dataKey="bucket" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-gray-900 dark:text-white mb-4">Exam Category Mix</h3>
          {categoryData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">No test categories yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="tests"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={55}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top performers */}
      <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm">
        <h3 className="font-extrabold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span>Top 10 Performers</span>
        </h3>
        {data.topPerformers.length === 0 ? (
          <div className="text-sm text-gray-400 py-8 text-center">No candidate scores recorded yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-dark-250">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-left">#</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-left">Candidate</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-left">Tests</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-left">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-dark-300">
                {data.topPerformers.map((u, i) => (
                  <tr key={u._id}>
                    <td className="px-6 py-3 text-sm font-bold text-gray-500">{i + 1}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-3">
                      <img
                        src={u.profileImage || DEFAULT_AVATAR}
                        alt={u.name}
                        onError={e => { e.target.src = DEFAULT_AVATAR; }}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                        <div>
                          <span className="font-semibold text-sm text-gray-850 dark:text-white block">{u.name}</span>
                          <span className="text-xs text-gray-400 block">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{u.testsAttempted}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-emerald-600">{u.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
