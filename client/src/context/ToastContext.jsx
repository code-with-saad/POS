import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }, 350);
  }, []);

  const showToast = useCallback(
    (type, message) => {
      const id = ++_toastId;
      setToasts((prev) => [...prev.slice(-3), { id, type, message, leaving: false }]);
      timers.current[id] = setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ─── Toast Container (rendered once at root via provider) ── */
const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type} ${t.leaving ? 'toast--leaving' : ''}`}
          role="alert"
        >
          <span className="toast-icon">{ICONS[t.type] ?? 'ℹ️'}</span>
          <span className="toast-message">{t.message}</span>
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Close">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
