import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Trash2,
  X
} from 'lucide-react';
import { useToastStore, type ToastItem } from '../../stores/toastStore';

const toastStyles: Record<
  ToastItem['type'],
  {
    container: string;
    border: string;
    iconColor: string;
    progressBar: string;
    titleColor: string;
    textColor: string;
  }
> = {
  success: {
    container: 'bg-white/95 border-emerald-200/80 shadow-emerald-500/10',
    border: 'border-l-4 border-l-emerald-500',
    iconColor: 'text-emerald-500',
    progressBar: 'bg-emerald-500',
    titleColor: 'text-emerald-950',
    textColor: 'text-emerald-800/90',
  },
  error: {
    container: 'bg-white/95 border-rose-200/80 shadow-rose-500/10',
    border: 'border-l-4 border-l-rose-500',
    iconColor: 'text-rose-500',
    progressBar: 'bg-rose-500',
    titleColor: 'text-rose-950',
    textColor: 'text-rose-800/90',
  },
  info: {
    container: 'bg-white/95 border-sky-200/80 shadow-sky-500/10',
    border: 'border-l-4 border-l-sky-500',
    iconColor: 'text-sky-500',
    progressBar: 'bg-sky-500',
    titleColor: 'text-sky-950',
    textColor: 'text-sky-800/90',
  },
  warning: {
    container: 'bg-white/95 border-amber-200/80 shadow-amber-500/10',
    border: 'border-l-4 border-l-amber-500',
    iconColor: 'text-amber-500',
    progressBar: 'bg-amber-500',
    titleColor: 'text-amber-950',
    textColor: 'text-amber-800/90',
  },
  delete: {
    container: 'bg-white/95 border-red-200/80 shadow-red-500/10',
    border: 'border-l-4 border-l-red-500',
    iconColor: 'text-red-500',
    progressBar: 'bg-red-500',
    titleColor: 'text-red-950',
    textColor: 'text-red-800/90',
  },
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const styles = toastStyles[toast.type];

  useEffect(() => {
    if (!toast.duration) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const renderIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className={`w-5 h-5 ${styles.iconColor} shrink-0 mt-0.5`} />;
      case 'error':
        return <AlertCircle className={`w-5 h-5 ${styles.iconColor} shrink-0 mt-0.5`} />;
      case 'warning':
        return <AlertTriangle className={`w-5 h-5 ${styles.iconColor} shrink-0 mt-0.5`} />;
      case 'delete':
        return <Trash2 className={`w-5 h-5 ${styles.iconColor} shrink-0 mt-0.5`} />;
      case 'info':
      default:
        return <Info className={`w-5 h-5 ${styles.iconColor} shrink-0 mt-0.5`} />;
    }
  };

  return (
    <div
      role="alert"
      className={`relative overflow-hidden pointer-events-auto rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex flex-col gap-2 ${styles.container} ${styles.border}`}
    >
      <div className="flex items-start gap-3">
        {renderIcon()}
        <div className="flex-1 min-w-0 pr-1">
          {toast.title && (
            <h4 className={`text-sm font-semibold tracking-tight ${styles.titleColor}`}>
              {toast.title}
            </h4>
          )}
          <p className={`text-xs leading-relaxed break-words font-medium ${styles.textColor}`}>
            {toast.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Close notification"
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-black/5 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 overflow-hidden">
          <div
            className={`h-full ${styles.progressBar} opacity-80`}
            style={{
              animation: `shrinkWidth ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 z-[999999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </>,
    document.body
  );
};
