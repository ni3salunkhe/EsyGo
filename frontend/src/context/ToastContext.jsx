import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onClose }) {
  const { type, message } = toast;

  let bgClass = 'bg-white border-black/[0.08] text-text-primary shadow-soft-lg';
  let Icon = Info;
  let iconColor = 'text-brand-500';

  if (type === 'success') {
    Icon = CheckCircle2;
    iconColor = 'text-emerald-600';
  } else if (type === 'error') {
    Icon = AlertCircle;
    iconColor = 'text-rose-600';
  }

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-apple border ${bgClass} transition-all duration-300 transform translate-y-0`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
      <div className="flex-1 text-sm font-medium leading-snug">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
