import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import { setVerificationEmail } from '../store/slices/authSlice';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { verificationEmail, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (verificationEmail) {
      setEmail(verificationEmail);
    }
  }, [verificationEmail]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      dispatch(addToast({ message: 'Please enter a valid 6-digit OTP code', type: 'error' }));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email', { email, otp });
      if (res.data.success) {
        dispatch(addToast({ message: 'Email verified successfully! You can now log in.', type: 'success' }));
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
        dispatch(addToast({ message: 'A new OTP has been sent to your email.', type: 'success' }));
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || 'Failed to resend OTP', type: 'error' }));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-400 dark:to-dark-300 flex items-center justify-center p-6 transition-colors duration-200">
      
      <div className="w-full max-w-md p-8 bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl shadow-xl glass">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500 mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary-500 to-sky-400 bg-clip-text text-transparent">Verify Account</h2>
          <p className="text-sm text-gray-500 mt-2">Enter the verification code sent to your email</p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          
          {/* Email verification target */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Target Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dhiraj@gmail.com"
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:text-white transition-all text-sm"
              />
            </div>
          </div>

          {/* OTP Code input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">6-Digit OTP Code</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-[12px] font-extrabold text-2xl py-3.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:text-white transition-all"
            />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Verify Email</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-gray-150 hover:bg-gray-200 dark:bg-dark-200 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-350 font-semibold py-3 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              {resending ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              ) : (
                <span>Resend Code</span>
              )}
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
