
import React, { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  const [isMounted, setIsMounted] = React.useState(isVisible);
  const [isExiting, setIsExiting] = React.useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
      setIsExiting(false);
      
      const duration = 2400;
      const timer = setTimeout(() => {
        onCloseRef.current();
      }, duration);
      
      return () => clearTimeout(timer);
    }

    if (isMounted) {
      setIsExiting(true);
      const timeout = setTimeout(() => {
        setIsMounted(false);
        setIsExiting(false);
      }, 240);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, message, type, isMounted]);

  if (!isMounted) return null;

  const styles = {
    success: 'border-l-4 border-l-emerald-600/30',
    error: 'border-l-4 border-l-rose-600/30',
    warning: 'border-l-4 border-l-amber-600/30',
    info: 'border-l-4 border-l-blue-800/30'
  };

  const icons = {
    success: <CheckCircle2 className="text-emerald-600" size={16} />,
    error: <XCircle className="text-rose-600" size={16} />,
    warning: <AlertCircle className="text-amber-600" size={16} />,
    info: <Info className="text-blue-800" size={16} />
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] p-2 pointer-events-none">
      <div className={`
        pointer-events-auto relative overflow-hidden border border-slate-200/60 bg-[#FFFBF1] shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        w-[calc(100vw-2rem)] max-w-[420px] rounded-xl
        ${styles[type]}
        ${isExiting ? 'toast-exit' : 'toast-enter'}
      `}>
        <div className="relative px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-white/40 border border-black/[0.03] flex items-center justify-center">
              {icons[type]}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium leading-tight tracking-tight break-words text-slate-800/90">{message}</p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-black/5 rounded-lg transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
