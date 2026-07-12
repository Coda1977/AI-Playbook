import { useEffect } from "react";
import { Star, X } from "lucide-react";
import { C } from "../../config/constants";

export default function Toast({
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 3000,
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="toast animate-slide-up">
      <div className="toast-icon">
        <Star size={16} fill={C.star} color={C.star} />
      </div>
      <span className="toast-message">{message}</span>
      {actionLabel && onAction && (
        <button
          onClick={() => {
            onAction();
            onClose();
          }}
          className="toast-action"
        >
          {actionLabel}
        </button>
      )}
      <button onClick={onClose} className="toast-close" aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}
