import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleDarkMode, setSidebarOpen } from '../store/slices/uiSlice';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard, BookOpen, FileText, Trophy,
  CreditCard, User, LogOut, Sun, Moon, Menu, X, ShieldAlert,
  BarChart3, ClipboardList, Receipt, Search
} from 'lucide-react';
import logo from '../assets/logo.png';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/mock-cloud/image/upload/v1/default-avatar.png';

export default function DashboardLayout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const { darkMode, sidebarOpen } = useSelector((state) => state.ui);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Mock Tests', path: '/mock-tests', icon: <BookOpen className="w-5 h-5" /> },
    { name: 'Revision Notes', path: '/notes', icon: <FileText className="w-5 h-5" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { name: 'Pricing Plans', path: '/subscription', icon: <CreditCard className="w-5 h-5" /> },
    { name: 'My Profile', path: '/profile', icon: <User className="w-5 h-5" /> },
  ];

  const adminLinks = [
    { name: 'Admin Hub', path: '/admin', icon: <LayoutDashboard className="w-5 h-5 text-rose-500" /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="w-5 h-5 text-rose-500" /> },
    { name: 'Manage Questions', path: '/admin/questions', icon: <ShieldAlert className="w-5 h-5 text-rose-500" /> },
    { name: 'Submissions', path: '/admin/results', icon: <ClipboardList className="w-5 h-5 text-rose-500" /> },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: <Receipt className="w-5 h-5 text-rose-500" /> },
  ];

  const renderNavLinks = (links) => links.map((link) => {
    const isActive = location.pathname === link.path;
    return (
      <Link
        key={link.name}
        to={link.path}
        onClick={() => dispatch(setSidebarOpen(false))}
        className={`group flex items-center gap-3 px-4 py-3 rounded-3xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-primary-600 to-sky-500 text-white shadow-xl shadow-sky-500/20'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        {link.icon}
        <span className="font-medium text-sm">{link.name}</span>
      </Link>
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex transition-colors duration-200">
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900/95 border-r border-slate-800 p-5 shrink-0 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid place-items-center h-12 w-12 rounded-3xl bg-cyan-400/15 overflow-hidden shadow-inner shadow-cyan-500/5">
              <img src={logo} alt="StudyNexus logo" className="h-12 w-12 object-cover" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">StudyNexus</p>
              <h1 className="text-xl font-bold text-white">
                {user?.role === 'admin' ? 'Admin Console' : 'Student Dashboard'}
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            {user?.role === 'admin'
              ? 'Fast access to insights, exams and user management.'
              : 'Use the student dashboard to practice, review results and upgrade your plan.'}
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-3xl bg-slate-950/80 border border-white/10 mb-8">
          <img
            src={user?.profileImage || DEFAULT_AVATAR}
            alt={user?.name}
            onError={e => { e.target.src = DEFAULT_AVATAR; }}
            className="h-12 w-12 rounded-2xl object-cover border border-slate-800"
          />
          <div className="truncate">
            <p className="font-semibold text-white truncate">{user?.name || 'Admin User'}</p>
            <p className="text-xs uppercase text-slate-500 tracking-[0.2em]">{user?.role || 'admin'}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Student Links</div>
          {renderNavLinks(studentLinks)}
          {user?.role === 'admin' && (
            <>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-8 mb-2">Admin Links</div>
              {renderNavLinks(adminLinks)}
            </>
          )}
        </nav>

        <div className="mt-auto space-y-3 pt-6 border-t border-slate-800">
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className="w-full flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 transition"
          >
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-200" />}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center rounded-3xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition"
          >
            <LogOut className="w-5 h-5 mr-2" /> Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => dispatch(setSidebarOpen(false))} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950/95 border-r border-slate-800 p-5 transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center h-12 w-12 rounded-3xl bg-cyan-400/15 overflow-hidden">
              <img src={logo} alt="StudyNexus logo" className="h-12 w-12 object-cover" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">StudyNexus</p>
              <h1 className="text-lg font-bold text-white">
                {user?.role === 'admin' ? 'Admin' : 'Student'}
              </h1>
            </div>
          </div>
          <button onClick={() => dispatch(setSidebarOpen(false))} className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 transition">
            <X className="w-5 h-5 text-slate-200" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Student Links</div>
          {renderNavLinks(studentLinks)}
          {user?.role === 'admin' && (
            <>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-8 mb-2">Admin Links</div>
              {renderNavLinks(adminLinks)}
            </>
          )}
        </nav>

        <div className="mt-auto space-y-3 pt-6 border-t border-slate-800">
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className="w-full flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 transition"
          >
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-200" />}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center rounded-3xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition"
          >
            <LogOut className="w-5 h-5 mr-2" /> Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/90 px-6 py-4 backdrop-blur-xl">
          <button
            onClick={() => dispatch(setSidebarOpen(true))}
            className="lg:hidden p-2 rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-slate-400">
            <Search className="w-5 h-5" />
            <span className="text-sm">Search exams, users, or results</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {user?.subscriptionPlan?.planType === 'premium' && (
              <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 text-xs font-semibold text-slate-950 shadow-sm shadow-orange-400/20">
                Premium Admin
              </span>
            )}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/85 px-4 py-2 text-sm text-slate-200">
              Hello, {user?.name || 'Admin'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
