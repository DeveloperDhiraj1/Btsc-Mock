import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { BookOpen, Trophy, Compass, Sparkles, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setProfile(res.data.data);
        }
      } catch (err) {
        dispatch(addToast({ message: 'Failed to sync dashboard profile', type: 'error' }));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Parse charts data
  const accuracyData = profile?.scores?.map((item, idx) => ({
    name: `Test ${idx + 1}`,
    accuracy: item.accuracy || 0,
    score: item.score || 0
  })) || [];

  const weakTopicsData = profile?.weakTopics?.slice(0, 5).map(t => ({
    name: t.topic,
    errors: t.errorCount
  })) || [];

  // Color Palette for error bar chart
  const barColors = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'];

  return (
    <div className="space-y-8">
      
      {/* Upper Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg shadow-primary-500/10">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold">Welcome Back, {profile?.name}!</h2>
            <p className="text-primary-100 text-sm">
              Your preparation status is active. You have completed {profile?.testsAttempted || 0} full mock exams.
            </p>
          </div>
          <Link
            to="/mock-tests"
            className="mt-4 md:mt-0 inline-flex items-center space-x-2 bg-white text-primary-600 font-bold px-5 py-3 rounded-2xl text-sm hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>Attempt Next Mock</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Numerical Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Tests Attempted</span>
            <h3 className="text-3xl font-black mt-1">{profile?.testsAttempted || 0}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Average Accuracy</span>
            <h3 className="text-3xl font-black mt-1">{profile?.accuracy || 0}%</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Pass Status</span>
            <h3 className="text-lg font-bold mt-2 truncate capitalize">
              {profile?.subscriptionPlan?.planType || 'Free Account'}
            </h3>
          </div>
        </div>
      </div>

      {/* Analytics Charts and Maps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Accuracy Over Time Line */}
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm">
          <h3 className="text-lg font-bold mb-6">Accuracy Progression</h3>
          {accuracyData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0a7eff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0a7eff" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#0a7eff" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              Complete your first mock test to generate performance analytics trends.
            </div>
          )}
        </div>

        {/* Weak Topics Heatmap Bar */}
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-bold">Weak Topic Tracker</h3>
          </div>
          {weakTopicsData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weakTopicsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="errors" radius={[10, 10, 0, 0]}>
                    {weakTopicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              Keep practicing. Topics with frequent errors will appear here.
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendation Widget */}
      <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex-1 space-y-3">
          <h4 className="font-extrabold text-lg text-gray-800 dark:text-gray-200">AI Remedial Feedback</h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Based on your accuracy stats, you should focus 30 minutes daily reviewing <strong>Formula Notes</strong> on topics with over 2 errors.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link 
              to="/notes" 
              className="text-xs font-semibold text-primary-500 bg-primary-50 dark:bg-primary-950/20 px-3 py-1.5 rounded-lg hover:underline"
            >
              Generate AI Notes &rarr;
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
