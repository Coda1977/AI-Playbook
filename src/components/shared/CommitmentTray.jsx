// src/components/shared/CommitmentTray.jsx
import { useEffect, useRef, useState } from "react";
import { Star, X } from "lucide-react";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function CommitmentTray({ title, countLabel, groups, status, emptyText }) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef(null);
  const fabRef = useRef(null);
  const empty = groups.every((g) => g.items.length === 0);
  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);

  useEffect(() => {
    if (!open) return;
    const closeBtn = closeButtonRef.current;
    const fabBtn = fabRef.current;
    const sheetEl = closeBtn?.closest(".tray-sheet");
    closeBtn?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && sheetEl) {
        const focusables = sheetEl.querySelectorAll(FOCUSABLE_SELECTOR);
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
      fabBtn?.focus();
    };
  }, [open]);

  const body = (
    <>
      <div className="tray-body">
        {empty && <p className="tray-empty">{emptyText}</p>}
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.label && <div className="tray-group">{g.label}</div>}
            {g.items.map((it) => (
              <div key={it.id} className="tray-item">
                <span className="tray-item-star">★</span>
                <span>{it.text}<small>{it.sourceLabel}</small></span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {status && <div className="tray-foot">{status}</div>}
    </>
  );

  return (
    <>
      {/* Desktop / tablet: always-visible sticky tray (hidden below 1000px). */}
      <aside className="tray tray-desktop no-print">
        <div className="tray-head">
          <span className="tray-star-chip"><Star size={13} fill="currentColor" /></span>
          <b>{title}</b>
          <span className="tray-count">{countLabel}</span>
        </div>
        {body}
      </aside>

      {/* Mobile: floating fab (hidden at/above 1000px) opens a bottom sheet
          with the identical tray content. */}
      <button
        type="button"
        ref={fabRef}
        className="tray-fab no-print"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${title}: ${countLabel}`}
      >
        <Star size={18} fill="currentColor" />
        <span>{totalCount}</span>
      </button>

      {open && (
        <div className="tray-sheet-scrim no-print" onClick={() => setOpen(false)}>
          <div
            className="tray-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tray-sheet-handle" />
            <div className="tray-head">
              <span className="tray-star-chip"><Star size={13} fill="currentColor" /></span>
              <b>{title}</b>
              <span className="tray-count">{countLabel}</span>
              <button
                type="button"
                ref={closeButtonRef}
                className="tray-sheet-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            {body}
          </div>
        </div>
      )}
    </>
  );
}
