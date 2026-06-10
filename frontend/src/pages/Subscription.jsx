import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import { updateUserSubscription } from '../store/slices/authSlice';
import { Check, ShieldCheck, Loader2, Sparkles, CreditCard } from 'lucide-react';

export default function Subscription() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [simOrderData, setSimOrderData] = useState(null);

  const features = [
    'Access to all exam mock categories (BTSC, SSC, BPSC)',
    'Detailed AI result analysis summaries',
    'Unlimited AI detailed solutions explanation unlocks',
    'Custom AI revision notes generators',
    'Live WebSocket student board rankings',
    '1 Year unlimited attempts validity'
  ];

  const loadRazorpayCheckout = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payments/checkout');
      if (res.data.success) {
        const orderData = res.data.data;
        
        // If order contains simulated mock tokens, trigger simulator modal
        if (orderData.orderId.includes('mock') || orderData.keyId.includes('mock')) {
          setSimOrderData(orderData);
          setShowSimModal(true);
          setLoading(false);
          return;
        }

        await loadRazorpayCheckout();

        // Production Razorpay integration trigger
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'StudyNexus Exam Prep',
          description: '1 Year Premium Exam Pass',
          order_id: orderData.orderId,
          handler: async (response) => {
            try {
              const verifyRes = await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              if (verifyRes.data.success) {
                dispatch(updateUserSubscription(verifyRes.data.data.expiresAt));
                dispatch(addToast({ message: 'Premium subscription activated!', type: 'success' }));
                navigate('/dashboard');
              }
            } catch (err) {
              dispatch(addToast({ message: 'Signature verification failed.', type: 'error' }));
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email
          },
          theme: {
            color: '#0a7eff'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          dispatch(addToast({
            message: response.error?.description || 'Payment failed. Please try again.',
            type: 'error'
          }));
        });
        rzp.open();
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Checkout initialization failed';
      dispatch(addToast({ message, type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!simOrderData) return;

    setLoading(true);
    setShowSimModal(false);
    try {
      const verifyRes = await api.post('/payments/verify', {
        razorpay_order_id: simOrderData.orderId,
        razorpay_payment_id: 'pay_simulated_token_' + Date.now().toString().slice(-6),
        razorpay_signature: 'sig_simulated_hash_token'
      });
      if (verifyRes.data.success) {
        dispatch(updateUserSubscription(verifyRes.data.data.expiresAt));
        dispatch(addToast({ message: 'Simulated subscription payment verified successfully!', type: 'success' }));
        navigate('/dashboard');
      }
    } catch (err) {
      dispatch(addToast({ message: 'Mock validation failed', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h2 className="text-3xl font-extrabold tracking-tight">Simple, Transparent Pricing</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          Unlock the complete AI-powered competitive test series suite to maximize your final score.
        </p>
      </div>

      {/* Pricing cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-4">
        
        {/* Free Plan */}
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-8 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold">Standard Free</h3>
            <p className="text-gray-450 text-xs mt-1">Basic syllabus testing</p>
            
            <div className="my-8">
              <span className="text-4xl font-black">₹0</span>
              <span className="text-gray-400 text-xs ml-1">/ lifetime</span>
            </div>

            <div className="space-y-4 border-t border-gray-100 dark:border-gray-850 pt-6">
              <div className="flex items-center space-x-3 text-xs">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-gray-500">Access to 2 mock test templates</span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-gray-500">Basic score summaries</span>
              </div>
            </div>
          </div>

          <button
            disabled
            className="w-full mt-10 bg-gray-100 dark:bg-dark-200 text-gray-400 font-bold py-3.5 px-4 rounded-2xl text-sm cursor-not-allowed text-center"
          >
            Active Plan
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-white dark:bg-dark-300 border-2 border-primary-500 dark:border-primary-500 p-8 rounded-3xl shadow-lg relative flex flex-col justify-between">
          <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-sm">
            Best Value
          </div>

          <div>
            <div className="flex items-center space-x-2 text-primary-500">
              <Sparkles className="w-5 h-5 fill-current" />
              <h3 className="text-xl font-bold">Premium Pass</h3>
            </div>
            <p className="text-gray-450 text-xs mt-1">Unlocks all AI study suites</p>
            
            <div className="my-8 flex items-baseline">
              <span className="text-4xl font-black">₹299</span>
              <span className="text-gray-400 text-xs ml-1">/ 1 Year Pass</span>
            </div>

            <div className="space-y-4 border-t border-gray-100 dark:border-gray-850 pt-6">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-xs">
                  <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  <span className="text-gray-500">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading || user?.subscriptionPlan?.planType === 'premium'}
            className="w-full mt-10 bg-primary-500 hover:bg-primary-600 disabled:bg-emerald-500/10 disabled:text-emerald-500 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition-all shadow-lg shadow-primary-500/10 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : user?.subscriptionPlan?.planType === 'premium' ? (
              <span>Unlocked (Expires {new Date(user.subscriptionPlan.expiresAt).toLocaleDateString()})</span>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Buy Premium Pass</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Simulated Payment Gateway Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-300 border border-gray-250 dark:border-gray-800 max-w-md w-full p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black">Razorpay Sandbox Simulator</h3>
              <p className="text-gray-400 text-xs">Simulate payment transaction verification signature handshakes.</p>
            </div>

            <div className="bg-gray-50 dark:bg-dark-200 p-4.5 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-2.5 font-mono text-xs">
              <div><span className="text-gray-400">Order ID:</span> {simOrderData?.orderId}</div>
              <div><span className="text-gray-400">Total Due:</span> INR 299.00</div>
              <div><span className="text-gray-400">Gateway Status:</span> sandbox_simulation</div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowSimModal(false);
                  dispatch(addToast({ message: 'Simulated payment cancelled by user.', type: 'info' }));
                }}
                className="flex-1 bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl text-xs"
              >
                Decline
              </button>
              <button
                onClick={handleSimulatePaymentSuccess}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-primary-500/10"
              >
                Complete Payment
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
