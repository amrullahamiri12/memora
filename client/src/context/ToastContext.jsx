import { createContext, useContext, useCallback, useRef, useState } from 'react';

const ToastContext = createContext(null);

let nextId = 0;

/**
 * Lightweight transient feedback. Usage:
 *   const toast = useToast();
 *   toast.success('Saved'); toast.error('Something went wrong');
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, type = 'info', { duration = 4000 } = {}) => {
      if (!message) return null;
      const id = ++nextId;
      setToasts((list) => [...list, { id, message, type }]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  const toast = {
    show: push,
    success: (message, opts) => push(message, 'success', opts),
    error: (message, opts) => push(message, 'error', opts),
    info: (message, opts) => push(message, 'info', opts),
    dismiss,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:left-auto sm:right-4 sm:top-auto sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const styles = {
    success: 'border-[var(--success)]/25 bg-[var(--success-bg)] text-[var(--success)]',
    error: 'border-[var(--danger)]/25 bg-[var(--danger-bg)] text-[var(--danger)]',
    info: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-heading)]',
  };
  const icon = { success: '✓', error: '!', info: 'ℹ' };

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={`toast-item pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md ${styles[toast.type]}`}
    >
      <span aria-hidden className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-current/10 text-xs font-bold">
        {icon[toast.type]}
      </span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-none rounded p-0.5 text-current/60 transition-colors hover:text-current"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
