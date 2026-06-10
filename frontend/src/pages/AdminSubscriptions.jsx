import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../store/slices/uiSlice';
import {
  Receipt, Loader2, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, IndianRupee, AlertTriangle
} from 'lucide-react';

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
      const res = await api.get(`/payments/admin/subscriptions?${params.toString()}`);
      if (res.data.success) {
        setSubs(res.data.data);
        setSummary(res.data.summary || []);
        setTotal(res.data.total);
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to load subscriptions', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubs(); }, [page, status]);

  const handleStatusUpdate = async (id, newStatus) => {
    const label = newStatus === 'active' ? 'force-activate' : 'mark as expired';
    if (!window.confirm(`Are you sure you want to ${label} this subscription?`)) return;
    try {
      const res = await api.put(`/payments/admin/subscriptions/${id}`, { status: newStatus });
      if (res.data.success) {
        dispatch(addToast({ message: 'Subscription updated', type: 'success' }));
        fetchSubs();
      }
    } catch (err) {
      dispatch(addToast({ message: 'Update failed', type: 'error' }));
    }
  };

  const getStatusPill = (s) => {
    const map = {
      active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      expired: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
      failed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
    };
    return map[s] || 'bg-gray-200 text-gray-600';
  };

  const totals = summary.reduce((acc, s) => {
    acc.count += s.count;
    acc.revenue += s.revenue;
    return acc;
  }, { count: 0, revenue: 0 });
  const activeStat = summary.find(s => s._id === 'active') || { count: 0, revenue: 0 };
  const pendingStat = summary.find(s => s._id === 'pending') || { count: 0, revenue: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-rose-500">
          <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Subscriptions & Billing
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              Review payments, activate plans manually, and expire stale orders.
            </p>
          </div>
        </div>
        <button
          onClick={fetchSubs}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-dark-200 dark:hover:bg-dark-100 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={totals.count} icon={<Receipt />} color="indigo" />
        <StatCard label="Active Subs" value={activeStat.count} icon={<CheckCircle2 />} color="emerald" />
        <StatCard label="Pending" value={pendingStat.count} icon={<Clock />} color="amber" />
        <StatCard label="Revenue (₹)" value={activeStat.revenue.toLocaleString('en-IN')} icon={<IndianRupee />} color="rose" />
      </div>

      <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setStatus(t.key); setPage(1); }}
              className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                status === t.key
                  ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
        ) : subs.length === 0 ? (
          <div className="p-16 text-center text-sm text-gray-400">
            <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            No subscriptions found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-dark-250">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Plan</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Order ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Created</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-dark-300">
                {subs.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-dark-250/30">
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={s.user?.profileImage || DEFAULT_AVATAR}
                          alt=""
                          onError={e => { e.target.src = DEFAULT_AVATAR; }}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="font-semibold text-sm text-gray-850 dark:text-white block">{s.user?.name || '—'}</span>
                          <span className="text-xs text-gray-400 block">{s.user?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{s.planName}</td>
                    <td className="px-6 py-3 text-xs font-mono text-gray-500">{s.orderId.slice(0, 22)}...</td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-850 dark:text-white">₹{s.amount}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusPill(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-3 text-right text-xs font-semibold space-x-3">
                      {s.status !== 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(s._id, 'active')}
                          className="text-emerald-600 hover:text-emerald-800"
                        >
                          Activate
                        </button>
                      )}
                      {s.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(s._id, 'expired')}
                          className="text-rose-600 hover:text-rose-800"
                        >
                          Expire
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 20 && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-850 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 bg-white dark:bg-dark-300 border border-gray-250 dark:border-gray-800 disabled:opacity-50 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page * 20 >= total}
                onClick={() => setPage(page + 1)}
                className="p-2 bg-white dark:bg-dark-300 border border-gray-250 dark:border-gray-800 disabled:opacity-50 rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    rose: 'bg-rose-500/10 text-rose-500'
  };
  return (
    <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-5 rounded-3xl shadow-sm flex items-center justify-between">
      <div>
        <span className="text-[11px] font-semibold text-gray-400 uppercase block">{label}</span>
        <h3 className="text-xl md:text-2xl font-black mt-1 text-gray-850 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
    </div>
  );
}
