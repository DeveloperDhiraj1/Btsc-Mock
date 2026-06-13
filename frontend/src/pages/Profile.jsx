import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { updateUserProfileImage } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import {
  Camera, Calendar, Mail, FileText, ArrowRight, Loader2,
  Trophy, BookOpen, CreditCard
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

export default function Profile() {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [myResults, setMyResults] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) setProfile(res.data.data);
      } catch (err) {
        dispatch(addToast({ message: 'Failed to sync profile', type: 'error' }));
      } finally { setLoading(false); }
    })();
    (async () => {
      try {
        const res = await api.get('/tests/results');
        if (res.data.success) setMyResults(res.data.data || []);
      } catch {}
    })();
  }, [dispatch]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const r = await api.post('/auth/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (r.data.success) {
        dispatch(updateUserProfileImage(r.data.url));
        setProfile((p) => ({ ...p, profileImage: r.data.url }));
        dispatch(addToast({ message: 'Avatar updated', type: 'success' }));
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        dispatch(updateUserProfileImage(reader.result));
        setProfile((p) => ({ ...p, profileImage: reader.result }));
        dispatch(addToast({ message: 'Avatar updated (local)', type: 'success' }));
      };
      reader.readAsDataURL(file);
    } finally { setUploading(false); }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-neon-cyan" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="!p-6 md:!p-8" hover={false}>
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-blue-purple blur-lg opacity-60" />
              <img
                src={profile?.profileImage}
                alt={profile?.name}
                className="relative h-28 w-28 rounded-2xl object-cover ring-2 ring-white/10"
              />
              <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-xl bg-gradient-blue-purple p-2 shadow-neon-blue transition hover:scale-110">
                <Camera className="h-4 w-4 text-white" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-3xl font-bold text-white">{profile?.name}</h1>
              <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-slate-400 md:justify-start">
                <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{profile?.email}</div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {new Date(profile?.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs">
                <span className="text-slate-400">Plan:</span>
                <span className={`font-bold ${profile?.subscriptionPlan?.planType === 'premium' ? 'text-amber-400' : 'text-slate-300'}`}>
                  {(profile?.subscriptionPlan?.planType || 'Free').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Avg accuracy', value: `${profile?.accuracy || 0}%`, icon: Trophy, color: 'text-emerald-400' },
          { label: 'Tests attempted', value: profile?.testsAttempted || 0, icon: BookOpen, color: 'text-neon-cyan' },
          { label: 'Subscription', value: profile?.subscriptionPlan?.planType || 'Free', icon: CreditCard, color: 'text-neon-purple', capitalize: true },
        ].map((s) => (
          <GlassCard key={s.label} className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
                <p className={`mt-2 font-display text-2xl font-bold ${s.color} ${s.capitalize ? 'capitalize' : ''}`}>{s.value}</p>
              </div>
              <s.icon className={`h-7 w-7 ${s.color} opacity-40`} />
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="!p-6" hover={false}>
        <div className="mb-5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-neon-cyan" />
          <h3 className="font-display text-lg font-semibold text-white">Scorecard history</h3>
        </div>
        {myResults.length > 0 ? (
          <div className="space-y-2">
            {myResults.map((r) => (
              <Link
                key={r._id}
                to={`/results/${r._id}`}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-neon-blue/30 hover:bg-white/[0.05]"
              >
                <div>
                  <p className="font-semibold text-white">{r.test?.title || 'Mock attempt'}</p>
                  <p className="text-xs text-slate-400">
                    Accuracy: <span className="text-emerald-400">{r.accuracy}%</span> · Score: {r.score}
                    {r.test?.totalMarks ? ` / ${r.test.totalMarks}` : ''}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">No scorecards yet. Start a mock to see history.</div>
        )}
      </GlassCard>
    </div>
  );
}
