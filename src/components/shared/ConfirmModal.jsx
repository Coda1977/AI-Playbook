import { useEffect, useId, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ConfirmModal({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();

  // Kept in a ref (rather than an effect dependency) so a parent re-render
  // that hands in a new onCancel identity (App.jsx passes inline arrow
  // functions) doesn't re-run the effect below and re-steal focus while the
  // dialog is still open.
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement;
    // Safe default for a destructive dialog: focus lands on Cancel, not the
    // confirm/danger action.
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancelRef.current();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-content"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title" id={titleId}>{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          <button ref={cancelBtnRef} onClick={onCancel} className="btn-pill-ghost">{cancelLabel || "Cancel"}</button>
          <button onClick={onConfirm} className="btn-danger">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
