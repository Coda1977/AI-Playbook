import { useEffect } from "react";
import { Star, X } from "lucide-react";
import { C } from "../../config/constants";

export default function Toast({
  id,
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 3000,
}) {
  // onClose is the provider's stable hideToast and takes the id, so every
  // dependency here is identity-stable: the countdown starts once on mount
  // and isn't restarted by unrelated re-renders.
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose, id]);

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
            onClose(id);
          }}
          className="toast-action"
        >
          {actionLabel}
        </button>
      )}
      <button onClick={() => onClose(id)} className="toast-close" aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}
