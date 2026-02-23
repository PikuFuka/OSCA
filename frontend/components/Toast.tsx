
import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  const [progress, setProgress] = React.useState(100);

  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      const startTime = Date.now();
      const duration = 4000; // Increased to 4 seconds for readability

      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        
        if (remaining === 0) {
          onClose();
        }
      }, 10);

      return () => clearInterval(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const styles = {
    // Modern Professional Government Palette
    success: 'bg-white/95 border-emerald-500/20 text-emerald-900 shadow-emerald-900/10',
    error: 'bg-white/95 border-rose-500/20 text-rose-900 shadow-rose-900/10',
    warning: 'bg-white/95 border-amber-500/20 text-amber-900 shadow-amber-900/10',
    info: 'bg-white/95 border-blue-500/20 text-blue-900 shadow-blue-900/10'
  };

  const accentColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={18} />,
    error: <XCircle className="text-rose-500" size={18} />,
    warning: <AlertCircle className="text-amber-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] p-2 pointer-events-none">
      <div className={`
        pointer-events-auto relative flex items-center gap-3 px-3.5 py-3 rounded-xl border shadow-lg 
        w-fit max-w-[320px] ${styles[type]} backdrop-blur-md 
        animate-in slide-in-from-right-full fade-in duration-500 cubic-bezier(0.16, 1, 0.3, 1)
      `}>
        {/* Slim Progress Bar */}
        <div 
          className={`absolute bottom-0 left-0 h-[2px] transition-all duration-100 ease-linear opacity-40 ${accentColors[type]}`}
          style={{ width: `${progress}%` }}
        ></div>

        <div className="shrink-0">
          {icons[type]}
        </div>
        
        <p className="text-[13px] font-bold leading-tight tracking-tight uppercase pr-2">
          {message}
        </p>

        <button 
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded-lg transition-colors shrink-0 border border-transparent hover:border-black/5"
          aria-label="Close notification"
        >
          <X size={14} className="opacity-30 hover:opacity-100" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
