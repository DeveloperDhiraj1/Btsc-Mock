import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clearError, googleLoginUser, loginUser, setVerificationEmail } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import GoogleIcon from '../components/GoogleIcon';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import AIBrainOrb from '../components/ui/AIBrainOrb';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && user) navigate('/dashboard');
  }, [token, user, navigate]);

  useEffect(() => {
    if (error) {
      dispatch(addToast({ message: error, type: 'error' }));
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    const action = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(action)) {
      dispatch(addToast({ message: `Welcome back, ${action.payload.user.name}!`, type: 'success' }));
      navigate('/dashboard');
    } else if (action.payload?.includes('verify your email')) {
      dispatch(setVerificationEmail(data.email));
      navigate('/verify');
    }
  };

  const handleGoogleSignIn = async () => {
    const action = await dispatch(googleLoginUser());
    if (googleLoginUser.fulfilled.match(action)) {
      dispatch(addToast({ message: `Welcome, ${action.payload.user.name}!`, type: 'success' }));
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <AnimatedBackground />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* LEFT: Showcase panel */}
        <motion.section
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden flex-col justify-between p-12 lg:flex"
        >
          <Link to="/" className="inline-flex items-center gap-3 self-start">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-blue-purple blur-md opacity-60" />
              <div className="relative rounded-2xl bg-ink-900/80 p-1.5 ring-1 ring-white/10">
                <img src={logo} alt="StudyNexus" className="h-10 w-10 rounded-xl object-cover" />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">StudyNexus</p>
              <p className="font-display text-base font-bold text-white">BTSC Mock Platform</p>
            </div>
          </Link>

          <div className="relative flex flex-1 items-center justify-center">
            <AIBrainOrb size={380} />

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="absolute left-0 top-10"
            >
              <GlassCard className="!p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/20 p-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Secure session</p>
                    <p className="text-sm font-semibold text-white">JWT + Refresh</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.7 }}
              className="absolute -right-2 bottom-12"
            >
              <GlassCard className="!p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-neon-purple/20 p-2">
                    <Sparkles className="h-4 w-4 text-neon-purple" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">AI Tutor</p>
                    <p className="text-sm font-semibold text-white">Always on</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold leading-tight">
              Resume your <span className="text-gradient">smarter</span> exam prep.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
              Track attempts, review weak topics, and continue your AI-powered practice from where you left off.
            </p>
          </div>
        </motion.section>

        {/* RIGHT: Form panel */}
        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <GlassCard className="!p-8 sm:!p-10" hover={false}>
              {/* Mobile logo */}
              <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 lg:hidden">
                <img src={logo} alt="StudyNexus" className="h-8 w-8 rounded-lg object-cover" />
                StudyNexus
              </Link>

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
                  <Sparkles className="h-3 w-3 text-neon-cyan" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-300">
                    Welcome back
                  </span>
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold text-white">
                  Login to <span className="text-gradient">StudyNexus</span>
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Enter your details or continue with Google.
                </p>
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleIcon />
                Continue with Google
              </motion.button>

              <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                <span className="h-px flex-1 bg-white/10" />
                or use email
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                    Email address
                  </label>
                  <div className="group relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-neon-cyan" />
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Enter a valid email address' }
                      })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-neon-blue/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-neon-blue/15"
                    />
                  </div>
                  {errors.email && <p className="text-xs font-medium text-rose-400">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs font-semibold text-neon-cyan transition hover:text-neon-blue">
                      Forgot?
                    </Link>
                  </div>
                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-neon-cyan" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...register('password', { required: 'Password is required' })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-neon-blue/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-neon-blue/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs font-medium text-rose-400">{errors.password.message}</p>}
                </div>

                <GradientButton type="submit" disabled={loading} className="!w-full">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>Login <ArrowRight className="h-4 w-4" /></>
                  )}
                </GradientButton>
              </form>

              <p className="mt-8 text-center text-sm text-slate-400">
                New to StudyNexus?{' '}
                <Link to="/register" className="font-semibold text-neon-cyan transition hover:text-neon-blue">
                  Create an account
                </Link>
              </p>
            </GlassCard>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
