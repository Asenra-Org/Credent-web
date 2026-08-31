/**
 * Global notification surface.
 *
 * Rendered once by the shell. Uses an aria-live region so a screen reader
 * announces a failure the same moment a sighted user sees it.
 */

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';

const ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export default function Toaster() {
  const toasts = useNotificationStore((s) => s.toasts);
  const dismiss = useNotificationStore((s) => s.dismiss);

  return (
    <div
      className="cx-toasts"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const Icon = ICON[toast.tone] || Info;
        return (
          <div
            key={toast.id}
            className={`cx-toast cx-toast--${toast.tone}`}
            role={toast.tone === 'error' ? 'alert' : 'status'}
          >
            <span className="cx-notice__icon">
              <Icon size={16} aria-hidden="true" />
            </span>
            <div className="cx-toast__content">
              <p className="cx-toast__title">{toast.title}</p>
              {toast.message ? <p className="cx-toast__message">{toast.message}</p> : null}
            </div>
            <button
              type="button"
              className="cx-toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label={`Dismiss: ${toast.title}`}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
