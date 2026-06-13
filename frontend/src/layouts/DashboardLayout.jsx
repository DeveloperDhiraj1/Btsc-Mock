import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { toggleDarkMode, setSidebarOpen } from '../store/slices/uiSlice';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard, BookOpen, FileText, Trophy, CreditCard, User,
  LogOut, Sun, Moon, Menu, X, ShieldAlert, BarChart3, ClipboardList,
  Receipt, Search, Bell, Sparkles, ChevronRight, Bot
} from 'lucide-react';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import logo from '../assets/logo.png';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/mock-cloud/image/upload/v1/default-avatar.png';

const STUDENT_LINKS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Mock Tests', path: '/mock-tests', icon: BookOpen },
  { name: 'Revision Notes', path: '/notes', icon: FileText },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Pricing Plans', path: '/subscription', icon: CreditCard },
  { name: 'My Profile', path: '/profile', icon: User },
];

const ADMIN_LINKS = [
  { name: 'Admin Hub', path: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Questions', path: '/admin/questions', icon: ShieldAlert },
  { name: 'Submissions', path: '/admin/results', icon: ClipboardList },
  { name: 'Subscriptions', path: '/admin/subscriptions', icon: Receipt },
];

export default function DashboardLayout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const { darkMode, sidebarOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [aiOpen, setAiOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const NavLink = ({ link }) => {
    const isActive = location.pathname === link.path
      || (link.path !== '/dashboard' && link.path !== '/admin' && location.pathname.startsWith(link.path));
    const Icon = link.icon;
    return (
      <Link
        to={link.path}
        onClick={() => dispatch(setSidebarOpen(false))}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? 'bg-white/[0.06] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
            : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        {isActive && (
          <motion.span
            layoutId="active-nav-pill"
            className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-blue-purple"
          />
        )}
        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-neon-cyan' : ''}`} />
        <span>{link.name}</span>
        {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-neon-cyan" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      <Link to="/" className="mb-6 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-gradient-blue-purple blur-md opacity-60" />
          <div className="relative rounded-xl bg-ink-900/80 p-1 ring-1 ring-white/10">
            <img src={logo} alt="StudyNexus" className="h-9 w-9 rounded-lg object-cover" />
          </div>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.35em] text-slate-500">StudyNexus</p>
          <p className="font-display text-sm font-bold text-white">
            {user?.role === 'admin' ? 'Admin Console' : 'Student Hub'}
          </p>
        </div>
      </Link>

      <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user?.profileImage || DEFAULT_AVATAR}
              alt={user?.name}
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-ink-900" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name || 'Guest'}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              {user?.subscriptionPlan?.planType === 'premium' ? 'Premium' : user?.role || 'student'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
          Student
        </p>
        {STUDENT_LINKS.map((link) => <NavLink key={link.name} link={link} />)}

        {user?.role === 'admin' && (
          <>
            <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Admin
            </p>
            {ADMIN_LINKS.map((link) => <NavLink key={link.name} link={link} />)}
          </>
        )}
      </nav>

      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06]"
        >
          <span className="flex items-center gap-2">
            {darkMode
              ? <Moon className="h-4 w-4 text-neon-purple" />
              : <Sun className="h-4 w-4 text-amber-400" />}
            {darkMode ? 'Dark mode' : 'Light mode'}
          </span>
          <span className="text-xs text-slate-500">{darkMode ? 'On' : 'Off'}</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm font-semibold text-rose-300 ring-1 ring-rose-500/20 transition hover:bg-rose-500/20"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen text-slate-100">
      <AnimatedBackground />

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-white/5 bg-ink-900/70 p-5 backdrop-blur-xl lg:flex">
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                onClick={() => dispatch(setSidebarOpen(false))}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-ink-900/95 p-5 backdrop-blur-xl lg:hidden"
              >
                <button
                  onClick={() => dispatch(setSidebarOpen(false))}
                  className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-ink-900/70 px-4 py-3 backdrop-blur-xl md:px-6">
            <button
              onClick={() => dispatch(setSidebarOpen(true))}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:bg-white/[0.08] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="hidden flex-1 sm:block">
              <div className="group relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-neon-cyan" />
                <input
                  type="text"
                  placeholder="Search exams, topics, questions..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {user?.subscriptionPlan?.planType === 'premium' && (
                <span className="hidden rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-900 shadow-sm sm:inline-flex">
                  Premium
                </span>
              )}

              <button
                onClick={() => setAiOpen(true)}
                className="group relative rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08]"
                title="AI Assistant"
              >
                <Bot className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-purple opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-purple" />
                </span>
              </button>

              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08]"
              >
                <Bell className="h-4 w-4" />
              </button>

              <Link
                to="/profile"
                className="ml-1 hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200 hover:bg-white/[0.08] md:flex"
              >
                <img
                  src={user?.profileImage || DEFAULT_AVATAR}
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                  className="h-6 w-6 rounded-md object-cover"
                  alt=""
                />
                <span className="font-medium">{(user?.name || 'Guest').split(' ')[0]}</span>
              </Link>
            </div>
          </header>

          {notifOpen && (
            <div className="absolute right-4 top-16 z-50 w-80 rounded-xl border border-white/10 bg-ink-900/95 p-4 shadow-2xl backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Notifications</h4>
                <button onClick={() => setNotifOpen(false)} className="text-slate-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="font-medium text-white">Daily AI Mock ready</p>
                  <p className="mt-0.5 text-slate-400">Your personalized 30-min mock is waiting.</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="font-medium text-white">Weak topic detected</p>
                  <p className="mt-0.5 text-slate-400">Thermodynamics needs review — 3 errors last session.</p>
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* AI Assistant slide-in panel */}
      <AnimatePresence>
        {aiOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-ink-900/95 p-6 backdrop-blur-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-xl bg-gradient-blue-purple blur-md opacity-60" />
                    <div className="relative rounded-xl bg-ink-900 p-2 ring-1 ring-white/10">
                      <Sparkles className="h-5 w-5 text-neon-cyan" />
                    </div>
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-white">AI Assistant</p>
                    <p className="text-xs text-slate-400">Ask me anything about your prep</p>
                  </div>
                </div>
                <button onClick={() => setAiOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-200">
                    Hi {user?.name?.split(' ')[0] || 'there'}! I can help you with:
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-neon-cyan" />
                      Explain any question or concept
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-neon-purple" />
                      Generate practice questions on any topic
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-neon-pink" />
                      Build a personalized study plan
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/notes"
                    onClick={() => setAiOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-xs font-medium text-slate-200 hover:bg-white/[0.06] transition"
                  >
                    Generate notes →
                  </Link>
                  <Link
                    to="/mock-tests"
                    onClick={() => setAiOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-xs font-medium text-slate-200 hover:bg-white/[0.06] transition"
                  >
                    Start mock test →
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask the AI tutor anything..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/15"
                  />
                  <button className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-blue-purple p-2 text-white shadow-neon-blue">
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
