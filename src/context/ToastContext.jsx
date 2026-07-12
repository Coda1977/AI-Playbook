/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from "react";
import Toast from "../components/shared/Toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const idRef = useRef(0);

  // Backward compatible: showToast("plain string") still works. Callers that
  // want the action-button variant pass showToast(message, { actionLabel,
  // onAction, duration }).
  //
  // Each toast gets an incrementing id so <Toast key={toast.id}> remounts
  // when a new toast replaces a still-visible one (e.g. back-to-back
  // deletes): without a fresh key, React reuses the existing Toast instance
  // and its auto-dismiss timer keeps counting down from the FIRST toast's
  // mount instead of resetting for the new message.
  const showToast = useCallback((message, opts = {}) => {
    idRef.current += 1;
    setToast({
      id: idRef.current,
      message,
      actionLabel: opts.actionLabel,
      onAction: opts.onAction,
      duration: opts.duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="toast-container">
          <Toast
            key={toast.id}
            message={toast.message}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            duration={toast.duration}
            onClose={hideToast}
          />
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
