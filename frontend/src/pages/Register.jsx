import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearError, googleLoginUser, registerUser } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import GoogleIcon from '../components/GoogleIcon';
import { ArrowRight, Check, Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, User, X } from 'lucide-react';

const passwordRules = [
  { id: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { id: 'lower', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { id: 'upper', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { id: 'number', label: 'One number', test: (value) => /\d/.test(value) },
  { id: 'special', label: 'One special character', test: (value) => /[^A-Za-z\d]/.test(value) }
];

const isStrongPassword = (value = '') => passwordRules.every((rule) => rule.test(value));

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    mode: 'onTouched'
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, token, verificationEmail } = useSelector((state) => state.auth);
  const password = watch('password') || '';

  const strength = useMemo(() => {
    const passed = passwordRules.filter((rule) => rule.test(password)).length;
    if (passed <= 2) return { label: 'Weak', width: 'w-1/3', color: 'bg-rose-500' };
    if (passed <= 4) return { label: 'Good', width: 'w-2/3', color: 'bg-amber-500' };
    return { label: 'Strong', width: 'w-full', color: 'bg-emerald-500' };
  }, [password]);

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (verificationEmail) {
      navigate('/verify');
    }
  }, [verificationEmail, navigate]);

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
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-dark-400 dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-dark-300 dark:shadow-black/20 sm:p-8">
            <div className="mb-8">
              <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 lg:hidden">
                <GraduationCap className="h-5 w-5 text-primary-500" />
                BTSC Mock Platform
              </Link>
              <h2 className="text-3xl font-bold text-slate-950 dark:text-white">Create account</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Start with Google or create a secure email account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-dark-200 dark:text-white dark:hover:bg-slate-800"
            >
              <GoogleIcon />
              Sign up with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              or use email
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Dhiraj Kumar"
                    {...register('name', {
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-dark-200 dark:text-white"
                  />
                </div>
                {errors.name && <p className="text-xs font-medium text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Enter a valid email address' }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-dark-200 dark:text-white"
                  />
                </div>
                {errors.email && <p className="text-xs font-medium text-rose-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    {...register('password', {
                      required: 'Password is required',
                      validate: (value) => isStrongPassword(value) || 'Use a stronger password'
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-12 text-sm text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-dark-200 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="space-y-2 rounded-lg bg-slate-50 p-3 dark:bg-dark-200">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Password strength</span>
                    <span className="text-slate-700 dark:text-slate-200">{strength.label}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                    <div className={`h-full ${strength.width} ${strength.color} transition-all`} />
                  </div>
                  <div className="grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                    {passwordRules.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <span key={rule.id} className="flex items-center gap-2">
                          {passed ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                          {rule.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {errors.password && <p className="text-xs font-medium text-rose-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    {...register('confirmPassword', {
                      required: 'Confirm password is required',
                      validate: (value) => value === password || 'Passwords do not match'
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-12 text-sm text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-dark-200 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs font-medium text-rose-500">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-primary-500/60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                Login
              </Link>
            </p>
          </div>
        </section>

        <section className="hidden bg-slate-950 text-white lg:flex lg:flex-col lg:justify-between p-10">
          <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500">
              <GraduationCap className="h-5 w-5" />
            </span>
            BTSC Mock Platform
          </Link>

          <div className="max-w-xl">
            <p className="mb-5 inline-flex rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-200">
              Strong password required
            </p>
            <h1 className="text-5xl font-bold leading-tight">
              Build your exam account with safer sign-in from day one.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Use a verified Google account or create a password that meets the same security standard enforced by the API.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-2xl font-bold text-white">OTP</p>
              <p className="mt-1">Email verification</p>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-2xl font-bold text-white">JWT</p>
              <p className="mt-1">Secure sessions</p>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-2xl font-bold text-white">8+</p>
              <p className="mt-1">Password length</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
