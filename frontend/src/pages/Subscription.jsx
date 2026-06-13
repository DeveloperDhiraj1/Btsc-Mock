import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import { updateUserSubscription } from '../store/slices/authSlice';
import { Check, ShieldCheck, Loader2, Sparkles, CreditCard } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';

export default function Subscription() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [simOrderData, setSimOrderData] = useState(null);

  const features = [
    'All exam categories (BTSC, SSC, Railway, BPSC)',
    'Detailed AI result analysis',
    'Unlimited AI explanation unlocks',
    'AI revision notes generator',
    'Live WebSocket leaderboard',
    '1-year unlimited attempts'
  ];

  const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('Razorpay load failed'));
    document.body.appendChild(s);
  });

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payments/checkout');
      if (res.data.success) {
        const orderData = res.data.data;
        if (orderData.orderId.includes('mock') || orderData.keyId.includes('mock')) {
          setSimOrderData(orderData);
          setShowSimModal(true);
          setLoading(false);
          return;
        }
        await loadRazorpayCheckout();
        const options = {
          key: orderData.keyId, amount: orderData.amount, currency: orderData.currency,
          name: 'StudyNexus', description: '1 Year Premium Pass', order_id: orderData.orderId,
          handler: async (response) => {
            try {
              const v = await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              if (v.data.success) {
                dispatch(updateUserSubscription(v.data.data.expiresAt));
                dispatch(addToast({ message: 'Premium activated!', type: 'success' }));
                navigate('/dashboard');
              }
            } catch { dispatch(addToast({ message: 'Verification failed', type: 'error' })); }
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: '#8b5cf6' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || 'Checkout failed', type: 'error' }));
    } finally { setLoading(false); }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!simOrderData) return;
    setLoading(true); setShowSimModal(false);
    try {
      const v = await api.post('/payments/verify', {
        razorpay_order_id: simOrderData.orderId,
        razorpay_payment_id: 'pay_sim_' + Date.now(),
        razorpay_signature: 'sig_sim'
      });
      if (v.data.success) {
        dispatch(updateUserSubscription(v.data.data.expiresAt));
        dispatch(addToast({ message: 'Premium activated (sandbox)', type: 'success' }));
        navigate('/dashboard');
      }
    } catch { dispatch(addToast({ message: 'Mock validation failed', type: 'error' })); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
          <Sparkles className="h-3 w-3 text-neon-purple" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">Pricing</span>
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold">
          Simple, <span className="text-gradient">transparent</span> pricing
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
          Unlock the complete AI-powered competitive test series suite.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {/* Free */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="!p-7 h-full" hover={false}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Free</p>
              <h3 className="mt-2 font-display text-2xl font-bold text-white">Standard</h3>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold text-white">₹0</span>
                <span className="text-sm text-slate-500">/ lifetime</span>
              </div>
              <ul className="mt-6 space-y-3 border-t border-white/5 pt-6 text-sm text-slate-300">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />2 mock test templates</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />Basic score summaries</li>
              </ul>
            </div>
            <button disabled className="mt-8 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-slate-500">
              Current plan
            </button>
          </GlassCard>
        </motion.div>

        {/* Premium */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="relative h-full">
            <div className="absolute -inset-px rounded-2xl bg-gradient-blue-purple opacity-50 blur" />
            <GlassCard className="relative !p-7 h-full ring-1 ring-neon-purple/30" hover={false}>
              <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-900 shadow-lg">
                Best value
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-neon-purple" />
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-neon-purple">Premium</p>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold text-white">Pro Pass</h3>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold text-gradient">₹299</span>
                  <span className="text-sm text-slate-500">/ year</span>
                </div>
                <ul className="mt-6 space-y-3 border-t border-white/5 pt-6 text-sm text-slate-300">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <GradientButton
                onClick={handleSubscribe}
                disabled={loading || user?.subscriptionPlan?.planType === 'premium'}
                className="!mt-8 !w-full"
              >
                {loading
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : user?.subscriptionPlan?.planType === 'premium'
                    ? `Active till ${new Date(user.subscriptionPlan.expiresAt).toLocaleDateString()}`
                    : <><CreditCard className="h-4 w-4" /> Upgrade now</>}
              </GradientButton>
            </GlassCard>
          </div>
        </motion.div>
      </div>

      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-xl md:p-8"
          >
            <div className="mb-5 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">Sandbox payment</h3>
              <p className="mt-2 text-xs text-slate-400">Simulating Razorpay signature verification.</p>
            </div>
            <div className="mb-6 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-slate-300">
              <div><span className="text-slate-500">Order:</span> {simOrderData?.orderId}</div>
              <div><span className="text-slate-500">Amount:</span> INR 299.00</div>
              <div><span className="text-slate-500">Status:</span> <span className="text-amber-400">sandbox</span></div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowSimModal(false); dispatch(addToast({ message: 'Cancelled', type: 'info' })); }}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                Decline
              </button>
              <GradientButton onClick={handleSimulatePaymentSuccess} className="!flex-1">
                Complete
              </GradientButton>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
