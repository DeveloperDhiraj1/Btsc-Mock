import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import { setVerificationEmail } from '../store/slices/authSlice';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import { Loader2, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function VerifyEmail() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { verificationEmail, token } = useSelector((state) => state.auth);

  useEffect(() => { if (token) navigate('/dashboard'); }, [token, navigate]);
  useEffect(() => { if (verificationEmail) setEmail(verificationEmail); }, [verificationEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const otp = digits.join('');

  const handleChange = (idx, value) => {
    const v = value.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      dispatch(addToast({ message: 'Please enter the 6-digit code', type: 'error' }));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email', { email, otp });
      if (res.data.success) {
        dispatch(addToast({ message: 'Email verified! You can now log in.', type: 'success' }));
        dispatch(setVerificationEmail(null));
        navigate('/login');
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || 'Verification failed', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      dispatch(addToast({ message: 'Please provide email address first', type: 'error' }));
      return;
    }
    setResending(true);
    try {
      const res = await api.post('/auth/resend-otp', { email });
      if (res.data.success) {
        dispatch(addToast({ message: 'A new code has been sent to your email.', type: 'success' }));
        setCooldown(60);
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || 'Failed to resend code', type: 'error' }));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <AnimatedBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <GlassCard className="!p-8 sm:!p-10" hover={false}>
            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-blue-purple shadow-neon-blue"
              >
                <ShieldCheck className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="font-display text-3xl font-bold">
                Verify your <span className="text-gradient">email</span>
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                We sent a 6-digit code to your inbox. Enter it below to activate your account.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                  Email address
                </label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-neon-cyan" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-neon-blue/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-neon-blue/15"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                  6-digit verification code
                </label>
                <div className="flex justify-between gap-2" onPaste={handlePaste}>
                  {digits.map((d, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="h-14 w-12 rounded-xl border border-white/10 bg-white/[0.03] text-center font-display text-2xl font-bold text-white outline-none transition focus:border-neon-blue/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-neon-blue/15"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <GradientButton type="submit" disabled={loading || otp.length !== 6} className="!w-full">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify email</>}
                </GradientButton>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : 'Resend code'}
                </button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
