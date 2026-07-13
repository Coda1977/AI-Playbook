import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { C } from "../../config/constants";

export default function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null;
  return (
    <div className="error-banner animate-fade-in" role="alert">
      <div className="error-banner-inner">
        <AlertTriangle size={18} color={C.danger} />
        <div className="error-banner-text">
          <p className="error-banner-message">{message}</p>
          <p className="error-banner-hint">Check your connection and try again.</p>
        </div>
        <div className="error-banner-actions">
          {onRetry && (
            <button onClick={onRetry} className="btn-pill-ghost">
              <RefreshCw size={14} /> Retry
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="btn-icon">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
