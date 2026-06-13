import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clearError, googleLoginUser, registerUser } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import GoogleIcon from '../components/GoogleIcon';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import AIBrainOrb from '../components/ui/AIBrainOrb';
import { ArrowRight, Check, Eye, EyeOff, Loader2, Lock, Mail, Sparkles, User, X } from 'lucide-react';
import logo from '../assets/logo.png';

const passwordRules = [
  { id: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { id: 'lower', label: 'Lowercase letter', test: (v) => /[a-z]/.test(v) },
  { id: 'upper', label: 'Uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'number', label: 'Number', test: (v) => /\d/.test(v) },
  { id: 'special', label: 'Special character', test: (v) => /[^A-Za-z\d]/.test(v) }
];

const isStrongPassword = (value = '') => passwordRules.every((rule) => rule.test(value));

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ mode: 'onTouched' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, verificationEmail } = useSelector((state) => state.auth);
  const password = watch('password') || '';

  const strength = useMemo(() => {
    const passed = passwordRules.filter((rule) => rule.test(password)).length;
    if (passed <= 2) return { label: 'Weak', width: '33%', color: 'from-rose-500 to-rose-400' };
    if (passed <= 4) return { label: 'Good', width: '66%', color: 'from-amber-500 to-orange-400' };
    return { label: 'Strong', width: '100%', color: 'from-emerald-500 to-emerald-400' };
  }, [password]);

  useEffect(() => { if (token) navigate('/dashboard'); }, [token, navigate]);
  useEffect(() => { if (verificationEmail) navigate('/verify'); }, [verificationEmail, navigate]);
  useEffect(() => {
    if (error) {
      dispatch(addToast({ message: error, type: 'error' }));
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    const action = await dispatch(registerUser({
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password
    }));
    if (registerUser.fulfilled.match(action)) {
      dispatch(addToast({ message: 'Registration successful. Verification code sent.', type: 'success' }));
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
        {/* LEFT: Form */}
        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <GlassCard className="!p-8 sm:!p-10" hover={false}>
              <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 lg:hidden">
                <img src={logo} alt="StudyNexus" className="h-8 w-8 rounded-lg object-cover" />
                StudyNexus
              </Link>

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
                  <Sparkles className="h-3 w-3 text-neon-purple" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-300">
                    Join StudyNexus
                  </span>
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold text-white">
                  Create your <span className="text-gradient">free</span> account
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Start with Google or sign up with email — takes 30 seconds.
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
                Sign up with Google
              </motion.button>

              <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                <span className="h-px flex-1 bg-white/10" />
                or use email
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field label="Full name" icon={User}>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Dhiraj Kumar"
                    {...register('name', {
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-neon-blue/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-neon-blue/15"
                  />
                </Field>
                {errors.name && <p className="-mt-2 text-xs font-medium text-rose-400">{errors.name.message}</p>}

                <Field label="Email address" icon={Mail}>
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
                </Field>
                {errors.email && <p className="-mt-2 text-xs font-medium text-rose-400">{errors.email.message}</p>}

                <Field label="Password" icon={Lock}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Strong password"
                    {...register('password', {
                      required: 'Password is required',
                      validate: (v) => isStrongPassword(v) || 'Use a stronger password'
                    })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-neon-blue/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-neon-blue/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </Field>

                {/* Strength bar */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.15em]">
                    <span className="text-slate-400">Password strength</span>
                    <span className="text-slate-200">{strength.label}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      animate={{ width: strength.width }}
                      transition={{ duration: 0.4 }}
                      className={`h-full bg-gradient-to-r ${strength.color}`}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-slate-400">
                    {passwordRules.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <span key={rule.id} className="flex items-center gap-1.5">
                          {passed
                            ? <Check className="h-3 w-3 text-emerald-400" />
                            : <X className="h-3 w-3 text-slate-600" />
                          }
                          <span className={passed ? 'text-slate-300' : ''}>{rule.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
                {errors.password && <p className="text-xs font-medium text-rose-400">{errors.password.message}</p>}

                <Field label="Confirm password" icon={Lock}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    {...register('confirmPassword', {
                      required: 'Confirm password is required',
                      validate: (v) => v === password || 'Passwords do not match'
                    })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-neon-blue/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-neon-blue/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </Field>
                {errors.confirmPassword && <p className="-mt-2 text-xs font-medium text-rose-400">{errors.confirmPassword.message}</p>}

                <GradientButton type="submit" disabled={loading} className="!w-full !mt-2">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
                </GradientButton>
              </form>

              <p className="mt-7 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-neon-cyan transition hover:text-neon-blue">
                  Login
                </Link>
              </p>
            </GlassCard>
          </motion.div>
        </section>

        {/* RIGHT: Showcase */}
        <motion.section
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden flex-col justify-between p-12 lg:flex"
        >
          <Link to="/" className="inline-flex items-center gap-3 self-end">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">StudyNexus</p>
              <p className="font-display text-base font-bold text-white">Smarter prep with AI</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-blue-purple blur-md opacity-60" />
              <div className="relative rounded-2xl bg-ink-900/80 p-1.5 ring-1 ring-white/10">
                <img src={logo} alt="StudyNexus" className="h-10 w-10 rounded-xl object-cover" />
              </div>
            </div>
          </Link>

          <div className="relative flex flex-1 items-center justify-center">
            <AIBrainOrb size={380} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { stat: 'OTP', label: 'Email verified' },
              { stat: 'JWT', label: 'Secure sessions' },
              { stat: 'AI', label: 'Personalized prep' }
            ].map((item) => (
              <GlassCard key={item.label} className="!p-4 text-center" hover={false}>
                <p className="font-display text-xl font-bold text-gradient">{item.stat}</p>
                <p className="mt-1 text-xs text-slate-400">{item.label}</p>
              </GlassCard>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">{label}</label>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-neon-cyan" />
        {children}
      </div>
    </div>
  );
}
