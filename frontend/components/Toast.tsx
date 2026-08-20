import React, { useEffect, useRef, useState, useMemo } from 'react';
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
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    iconBg: 'bg-emerald-500 text-white shadow-emerald-500/20',
    progressGradient: 'from-emerald-500 via-teal-500 to-emerald-400',
    cardBorder: 'border-emerald-500/20',
    cardShadow: 'shadow-[0_14px_45px_-8px_rgba(16,185,129,0.18),0_4px_16px_-4px_rgba(0,0,0,0.06)]',
    itemBulletBg: 'bg-emerald-500',
    itemBg: 'bg-emerald-50/60 border-emerald-100 text-emerald-900',
  },
  error: {
    icon: AlertCircle,
    label: 'Action Required',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    iconBg: 'bg-rose-500 text-white shadow-rose-500/20',
    progressGradient: 'from-rose-500 via-red-500 to-rose-400',
    cardBorder: 'border-rose-500/25',
    cardShadow: 'shadow-[0_14px_45px_-8px_rgba(244,63,94,0.2),0_4px_16px_-4px_rgba(0,0,0,0.06)]',
    itemBulletBg: 'bg-rose-500',
    itemBg: 'bg-rose-50/70 border-rose-100 text-rose-950',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Attention',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    iconBg: 'bg-amber-500 text-white shadow-amber-500/20',
    progressGradient: 'from-amber-500 via-orange-500 to-amber-400',
    cardBorder: 'border-amber-500/25',
    cardShadow: 'shadow-[0_14px_45px_-8px_rgba(245,158,11,0.2),0_4px_16px_-4px_rgba(0,0,0,0.06)]',
    itemBulletBg: 'bg-amber-500',
    itemBg: 'bg-amber-50/60 border-amber-100 text-amber-950',
  },
  info: {
    icon: Info,
    label: 'Notice',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    iconBg: 'bg-blue-500 text-white shadow-blue-500/20',
    progressGradient: 'from-blue-500 via-indigo-500 to-blue-400',
    cardBorder: 'border-blue-500/20',
    cardShadow: 'shadow-[0_14px_45px_-8px_rgba(59,130,246,0.18),0_4px_16px_-4px_rgba(0,0,0,0.06)]',
    itemBulletBg: 'bg-blue-500',
    itemBg: 'bg-blue-50/60 border-blue-100 text-blue-950',
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

  // Adaptive duration based on content length
  const toastDuration = useMemo(() => {
    if (items.length > 2) return 5500;
    if (items.length > 0) return 4500;
    if (message.length > 60) return 4000;
    return 3200;
  }, [items.length, message.length]);

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

  return (
    <div 
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none px-4 w-full max-w-[460px]"
      role="alert"
      aria-live="assertive"
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          pointer-events-auto relative overflow-hidden
          bg-white/95 backdrop-blur-2xl
          border ${config.cardBorder}
          ${config.cardShadow}
          rounded-2xl transition-all duration-200
          ${isExiting ? 'toast-exit' : 'toast-enter'}
        `}
      >
        <div className="p-4 sm:p-4.5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Icon Container */}
              <div className={`w-7 h-7 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon size={15} strokeWidth={2.5} />
              </div>

              {/* Status Pill & Title */}
              <div className="flex items-center gap-2 min-w-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${config.badgeClass}`}>
                  {config.label}
                </span>
                {isList && header && (
                  <span className="text-[12px] font-bold text-slate-700 truncate">
                    {header}
                  </span>
                )}
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors -mr-1 -mt-1"
              aria-label="Dismiss notification"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>

          {/* Body Content */}
          {isList ? (
            <div className="mt-3 space-y-1.5 pl-0.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${config.itemBg} transition-all`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.itemBulletBg} shrink-0`} />
                  <span className="leading-tight">{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] font-semibold leading-relaxed text-slate-700 mt-2 pl-0.5 break-words">
              {message}
            </p>
          )}
        </div>

        {/* 60fps/120fps GPU-Accelerated Countdown Progress Bar */}
        <div className="h-1 bg-slate-100/90 w-full overflow-hidden">
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
};

export default Toast;
