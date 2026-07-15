/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from "react";
import Toast from "../components/shared/Toast";

const ToastContext = createContext(null);

// Deleting is a single unconfirmed click, so its Undo toast is the only
// safety net. A single-slot toast made that net unreliable: a second delete
// replaced the first toast and stranded the first item permanently. Toasts
// therefore stack, each with its own id and timer, so every delete stays
// undoable for its full duration. Capped so a rapid burst can't paper over
// the board.
const MAX_TOASTS = 3;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  // Backward compatible: showToast("plain string") still works. Callers that
  // want the action-button variant pass showToast(message, { actionLabel,
  // onAction, duration }).
  const showToast = useCallback((message, opts = {}) => {
    idRef.current += 1;
    const next = {
      id: idRef.current,
      message,
      actionLabel: opts.actionLabel,
      onAction: opts.onAction,
      duration: opts.duration,
    };
    setToasts((prev) => [...prev, next].slice(-MAX_TOASTS));
  }, []);

  // Identity-stable so Toast's auto-dismiss effect doesn't re-run (and reset
  // its countdown) every time the provider re-renders. Toast passes its own
  // id back rather than us handing each one a fresh closure.
  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container" role="status" aria-live="polite">
          {toasts.map((t) => (
            <Toast
              key={t.id}
              id={t.id}
              message={t.message}
              actionLabel={t.actionLabel}
              onAction={t.onAction}
              duration={t.duration}
              onClose={hideToast}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
