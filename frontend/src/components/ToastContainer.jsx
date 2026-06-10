import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../store/slices/uiSlice';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ id, message, type, duration }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(id));
    }, duration);

    return () => clearTimeout(timer);
  }, [dispatch, id, duration]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertTriangle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-sky-500" />
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50',
    error: 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50',
    info: 'bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/50'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`flex items-center justify-between p-4 border rounded-xl shadow-lg glass md:max-w-sm w-full ${bgColors[type]}`}
    >
      <div className="flex items-center space-x-3">
        {icons[type]}
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{message}</p>
      </div>
      <button
        onClick={() => dispatch(removeToast(id))}
        className="p-1 ml-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default function ToastContainer() {
  const toasts = useSelector((state) => state.ui.toasts);

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-3 w-full max-w-sm px-4 md:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
