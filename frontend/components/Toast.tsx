
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

const TOAST_DURATION = 3200;

const toastConfig = {
  success: {
    icon: CheckCircle2,
    label: 'Success',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    progressColor: 'bg-emerald-500',
    accentRing: 'ring-emerald-500/10',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    progressColor: 'bg-rose-500',
    accentRing: 'ring-rose-500/10',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Attention',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    progressColor: 'bg-amber-500',
    accentRing: 'ring-amber-500/10',
  },
  info: {
    icon: Info,
    label: 'Info',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    progressColor: 'bg-blue-500',
    accentRing: 'ring-blue-500/10',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  const [isMounted, setIsMounted] = useState(isVisible);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const onCloseRef = useRef(onClose);
  const progressRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Progress bar countdown
  useEffect(() => {
    if (isVisible) {
      startTimeRef.current = Date.now();
      setProgress(100);

      const tick = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
        setProgress(remaining);
        if (remaining > 0) {
          progressRef.current = requestAnimationFrame(tick);
        }
      };

      progressRef.current = requestAnimationFrame(tick);

      return () => {
        if (progressRef.current) cancelAnimationFrame(progressRef.current);
      };
    }
  }, [isVisible, message, type]);

  // Mount/unmount lifecycle
  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
      setIsExiting(false);

      const timer = setTimeout(() => {
        onCloseRef.current();
      }, TOAST_DURATION);

      return () => clearTimeout(timer);
    }

    if (isMounted) {
      setIsExiting(true);
      const timeout = setTimeout(() => {
        setIsMounted(false);
        setIsExiting(false);
      }, 280);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, message, type, isMounted]);

  if (!isMounted) return null;

  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div
        className={`
          pointer-events-auto relative overflow-hidden
          bg-white/95 backdrop-blur-xl
          border border-slate-200/60
          shadow-[0_8px_40px_-8px_rgba(0,0,0,0.1),0_4px_12px_-4px_rgba(0,0,0,0.05)]
          w-[calc(100vw-2rem)] max-w-[400px] rounded-2xl
          ring-1 ${config.accentRing}
          ${isExiting ? 'toast-exit' : 'toast-enter'}
        `}
      >
        <div className="px-4 py-3.5">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`shrink-0 w-8 h-8 rounded-xl ${config.iconBg} flex items-center justify-center`}>
              <Icon size={16} strokeWidth={2.5} className={config.iconColor} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${config.iconColor} mb-0.5 leading-none`}>
                {config.label}
              </p>
              <p className="text-[13px] font-medium leading-snug text-slate-700 break-words">
                {message}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="shrink-0 w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors mt-0.5"
              aria-label="Dismiss notification"
            >
              <X size={12} strokeWidth={2.5} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-slate-100/80 w-full">
          <div
            className={`h-full ${config.progressColor} transition-none rounded-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;
