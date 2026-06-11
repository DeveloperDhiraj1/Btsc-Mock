import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearError, googleLoginUser, loginUser, setVerificationEmail } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import GoogleIcon from '../components/GoogleIcon';
import { ArrowRight, Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    mode: 'onTouched'
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && user) {
      navigate('/dashboard');
    }
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
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-dark-400 dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-slate-950 text-white lg:flex lg:flex-col lg:justify-between p-10">
          <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500">
              <GraduationCap className="h-5 w-5" />
            </span>
            StudyNexus Mock Platform
          </Link>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Secure student dashboard
            </div>
            <h1 className="text-5xl font-bold leading-tight">
              Resume your preparation with focused mock tests.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Track attempts, review weak areas, and continue your exam practice from one clean workspace.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-2xl font-bold text-white">AI</p>
              <p className="mt-1">Question practice</p>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-2xl font-bold text-white">Live</p>
              <p className="mt-1">Rank tracking</p>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="mt-1">Revision access</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-dark-300 dark:shadow-black/20 sm:p-8">
            <div className="mb-8">
              <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 lg:hidden">
                <GraduationCap className="h-5 w-5 text-primary-500" />
                StudyNexus Mock Platform
              </Link>
              <h2 className="text-3xl font-bold text-slate-950 dark:text-white">Login</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Enter your details or continue with Google.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-dark-200 dark:text-white dark:hover:bg-slate-800"
            >
              <GoogleIcon />
              Sign in with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              or use email
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register('password', {
                      required: 'Password is required'
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
                {errors.password && <p className="text-xs font-medium text-rose-500">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-primary-500/60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Login <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
              New to BTSC Mock?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
