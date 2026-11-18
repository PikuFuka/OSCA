import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    label: 'Success',
    accent: 'bg-emerald-500',
    iconClass: 'text-emerald-600',
    progressGradient: 'from-emerald-500 to-emerald-400',
    itemBulletBg: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    label: 'Action Required',
    accent: 'bg-rose-500',
    iconClass: 'text-rose-500',
    progressGradient: 'from-rose-500 to-rose-400',
    itemBulletBg: 'bg-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Attention',
    accent: 'bg-amber-500',
    iconClass: 'text-amber-500',
    progressGradient: 'from-amber-500 to-amber-400',
    itemBulletBg: 'bg-amber-500',
  },
  info: {
    icon: Info,
    label: 'Notice',
    accent: 'bg-blue-500',
    iconClass: 'text-blue-500',
    progressGradient: 'from-blue-500 to-blue-400',
    itemBulletBg: 'bg-blue-500',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  const [isMounted, setIsMounted] = useState(isVisible);
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const onCloseRef = useRef(onClose);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef<number>(0);
  const lastStartTimeRef = useRef<number>(0);
  const toastInstanceIdRef = useRef<number>(0);

  // Increment instance ID only when a new toast becomes visible
  useEffect(() => {
    if (isVisible) {
      toastInstanceIdRef.current += 1;
    }
  }, [isVisible, message, type]);

  // Parse structured validation errors or bullet lists
  const { isList, header, items } = useMemo(() => {
    if (!message) return { isList: false, header: '', items: [] };

    if (message.includes('•') || message.includes('Please fix the following:')) {
      const parts = message.split(/Please fix the following:\s*/i);
      const prefix = parts.length > 1 ? 'Please fix the following:' : '';
      const contentToSplit = parts.length > 1 ? parts[1] : message;

      const rawItems = contentToSplit
        .split(/[•\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s !== '...');

      if (rawItems.length > 0) {
        return {
          isList: true,
          header: prefix || 'Required Items',
          items: rawItems,
        };
      }
    }

    return { isList: false, header: '', items: [] };
  }, [message]);

  // Keep notifications brief and unobtrusive.
  const toastDuration = 1000;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Timer logic with seamless pause / resume
  useEffect(() => {
    if (!isVisible) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    remainingTimeRef.current = toastDuration;
    lastStartTimeRef.current = Date.now();
    setIsPaused(false);

    timerRef.current = setTimeout(() => {
      onCloseRef.current();
    }, toastDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, message, type, toastDuration]);

  const handleMouseEnter = () => {
    if (!isPaused && timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - lastStartTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (isPaused && remainingTimeRef.current > 0) {
      lastStartTimeRef.current = Date.now();
      setIsPaused(false);
      timerRef.current = setTimeout(() => {
        onCloseRef.current();
      }, remainingTimeRef.current);
    }
  };

  // Mount/Unmount transitions
  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
      setIsExiting(false);
    } else if (isMounted) {
      setIsExiting(true);
      const timeout = setTimeout(() => {
        setIsMounted(false);
        setIsExiting(false);
      }, 240);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, isMounted]);

  if (!isMounted) return null;

  const config = toastConfig[type];
  const Icon = config.icon;

  const toastElement = (
    <div 
      className="pointer-events-none"
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: 'calc(100% - 32px)',
        maxWidth: isList ? '420px' : '360px',
        isolation: 'isolate',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          pointer-events-auto relative overflow-hidden
          bg-white/98 backdrop-blur-xl
          border border-slate-200/80
          shadow-[0_10px_35px_-12px_rgba(15,23,42,0.25)]
          rounded-xl transition-all duration-200
          ${isExiting ? 'toast-exit' : 'toast-enter'}
        `}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`} />
        <div className="px-4 py-3.5 pl-5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`${config.iconClass} shrink-0`} size={18} strokeWidth={2.2} />
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-slate-800 leading-tight">{config.label}</p>
                {isList && header && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{header}</p>
                )}
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>

          {/* Body Content */}
          {isList ? (
            <div className="mt-2.5 space-y-1.5 pl-7">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-[12px] font-medium text-slate-600"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.itemBulletBg} shrink-0`} />
                  <span className="leading-tight">{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] font-medium leading-relaxed text-slate-600 mt-1.5 pl-7 break-words">
              {message}
            </p>
          )}
        </div>

        {/* 60fps/120fps GPU-Accelerated Countdown Progress Bar */}
        <div className="h-[2px] bg-slate-100 w-full overflow-hidden">
          <div
            key={toastInstanceIdRef.current}
            className={`h-full w-full bg-gradient-to-r ${config.progressGradient} toast-progress-bar`}
            style={{
              animationDuration: `${toastDuration}ms`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(toastElement, document.body);
};

export default Toast;
