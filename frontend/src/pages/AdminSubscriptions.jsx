import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import {
  Receipt, Loader2, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, IndianRupee
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import AnimatedCounter from '../components/ui/AnimatedCounter';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/mock-cloud/image/upload/v1/default-avatar.png';
const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'expired', label: 'Expired' },
  { key: 'failed', label: 'Failed' }
];

export default function AdminSubscriptions() {
  const dispatch = useDispatch();
  const [subs, setSubs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.append('status', status);
      const res = await api.get(`/payments/admin/subscriptions?${params}`);
      if (res.data.success) {
        setSubs(res.data.data); setSummary(res.data.summary || []); setTotal(res.data.total);
      }
    } catch { dispatch(addToast({ message: 'Failed to load', type: 'error' })); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchSubs(); }, [page, status]);

  const handleStatusUpdate = async (id, newStatus) => {
    const label = newStatus === 'active' ? 'activate' : 'expire';
    if (!window.confirm(`Are you sure you want to ${label} this subscription?`)) return;
    try {
      const res = await api.put(`/payments/admin/subscriptions/${id}`, { status: newStatus });
      if (res.data.success) { dispatch(addToast({ message: 'Updated', type: 'success' })); fetchSubs(); }
    } catch { dispatch(addToast({ message: 'Update failed', type: 'error' })); }
  };

  const statusPill = (s) => ({
    active: 'bg-emerald-500/15 text-emerald-400',
    pending: 'bg-amber-500/15 text-amber-400',
    expired: 'bg-slate-500/15 text-slate-400',
    failed: 'bg-rose-500/15 text-rose-400'
  }[s] || 'bg-slate-500/15 text-slate-400');

  const totals = summary.reduce((acc, s) => ({ count: acc.count + s.count, revenue: acc.revenue + s.revenue }), { count: 0, revenue: 0 });
  const activeStat = summary.find((s) => s._id === 'active') || { count: 0, revenue: 0 };
  const pendingStat = summary.find((s) => s._id === 'pending') || { count: 0, revenue: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-neon-purple/15 p-3 text-neon-purple">
            <Receipt className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Subscriptions & <span className="text-gradient">billing</span></h1>
            <p className="mt-1 text-sm text-slate-400">Review payments, manage plan activation.</p>
          </div>
        </div>
        <button onClick={fetchSubs} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.08]">
          <RefreshCw className="h-4 w-4" /> Sync
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={totals.count} icon={Receipt} gradient="from-neon-blue to-neon-cyan" />
        <StatCard label="Active subs" value={activeStat.count} icon={CheckCircle2} gradient="from-emerald-400 to-emerald-600" />
        <StatCard label="Pending" value={pendingStat.count} icon={Clock} gradient="from-amber-400 to-orange-500" />
        <StatCard label="Revenue (₹)" value={activeStat.revenue.toLocaleString('en-IN')} icon={IndianRupee} gradient="from-rose-500 to-neon-purple" rawValue />
      </div>

      <GlassCard className="!p-0 overflow-hidden" hover={false}>
        <div className="flex overflow-x-auto border-b border-white/5">
          {STATUS_TABS.map((t) => (
            <button key={t.key} onClick={() => { setStatus(t.key); setPage(1); }}
              className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
                status === t.key ? 'border-neon-purple text-neon-purple' : 'border-transparent text-slate-500 hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-cyan" /></div>
        ) : subs.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <Receipt className="mx-auto mb-3 h-10 w-10 text-slate-600" /> No subscriptions in this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Plan</th>
                  <th className="px-6 py-3 text-left">Order ID</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subs.map((s) => (
                  <tr key={s._id} className="text-slate-300 hover:bg-white/[0.03]">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <img src={s.user?.profileImage || DEFAULT_AVATAR} alt="" onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                          className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10" />
                        <div>
                          <p className="font-semibold text-white">{s.user?.name || '—'}</p>
                          <p className="text-xs text-slate-500">{s.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">{s.planName}</td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{s.orderId.slice(0, 20)}...</td>
                    <td className="px-6 py-3 font-bold text-white">₹{s.amount}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${statusPill(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-right text-xs font-bold space-x-3">
                      {s.status !== 'active' && (
                        <button onClick={() => handleStatusUpdate(s._id, 'active')} className="text-emerald-400 hover:text-emerald-300">Activate</button>
                      )}
                      {s.status === 'active' && (
                        <button onClick={() => handleStatusUpdate(s._id, 'expired')} className="text-rose-400 hover:text-rose-300">Expire</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 20 && (
          <div className="flex items-center justify-between border-t border-white/5 p-4 text-xs">
            <span className="font-semibold text-slate-500">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, gradient, rawValue }) {
  return (
    <GlassCard className="!p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {rawValue ? value : <AnimatedCounter to={Number(value) || 0} />}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-neon-blue`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </GlassCard>
  );
}
