import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const Snackbar = () => {
  const { statusMessage, dismissStatus } = useAuth();

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => {
      dismissStatus();
    }, 4500);
    return () => clearTimeout(timer);
  }, [statusMessage, dismissStatus]);

  if (!statusMessage) return null;

  const isError = statusMessage.isError;

  return (
    <aside
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl border-l-4 transition-all duration-300 ${
        isError
          ? 'bg-[var(--error-bg)] text-[var(--error-text)] border-[var(--error)]'
          : 'bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--tertiary)] border-y border-r border-[var(--card-border)]'
      }`}
    >
      <span
        className={`material-symbols-outlined text-[20px] ${
          isError ? 'text-[var(--error)]' : 'text-[var(--tertiary)]'
        }`}
      >
        {isError ? 'error' : 'check_circle'}
      </span>
      <span className="text-sm font-medium">{statusMessage.message}</span>
      <button
        onClick={dismissStatus}
        className="ml-3 text-xs font-semibold uppercase tracking-wider text-[var(--primary)] hover:underline focus:outline-none cursor-pointer"
        type="button"
      >
        Dismiss
      </button>
    </aside>
  );
};
