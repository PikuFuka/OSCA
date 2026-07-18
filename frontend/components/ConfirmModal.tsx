
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, HelpCircle, X, RefreshCw } from 'lucide-react';

export type ConfirmVariant = 'primary' | 'danger' | 'success' | 'warning';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  children?: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  children
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const { style } = document.body;
    const prevOverflow = style.overflow;

    style.overflow = 'hidden';

    return () => {
      style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertCircle className="text-rose-600" size={36} />,
          btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 text-white',
          bg: 'bg-rose-50 border-rose-100',
          titleColor: 'text-rose-900'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="text-emerald-600" size={36} />,
          btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white',
          bg: 'bg-emerald-50 border-emerald-100',
          titleColor: 'text-emerald-950'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="text-amber-600" size={36} />,
          btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 text-white',
          bg: 'bg-amber-50 border-amber-100',
          titleColor: 'text-amber-950'
        };
      default:
        return {
          icon: <HelpCircle className="text-blue-600" size={36} />,
          btn: 'bg-systemBlue hover:bg-blue-800 shadow-blue-200 text-white',
          bg: 'bg-blue-50 border-blue-100',
          titleColor: 'text-slate-900'
        };
    }
  };

  const styles = getVariantStyles();

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300 ease-out">
      <div className="bg-white rounded-2xl w-full max-w-[28rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ease-out border border-slate-200 relative">
        
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-10 outline-none focus:ring-2 focus:ring-slate-200"
        >
          <X size={18} />
        </button>

        <div className="p-8 text-center flex flex-col items-center">
          {/* Icon Container */}
          <div className={`w-16 h-16 rounded-2xl ${styles.bg} border-2 border-white shadow-sm flex items-center justify-center mb-6`}>
            {styles.icon}
          </div>
          
          <div className="space-y-2 mb-8">
            <h3 className={`text-2xl font-black ${styles.titleColor} tracking-tight`}>{title}</h3>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed max-w-sm mx-auto">{message}</p>
            {children && <div className="mt-4 text-left">{children}</div>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <button
              onClick={onCancel}
              className="order-2 sm:order-1 py-2.5 px-5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] outline-none focus:ring-2 focus:ring-slate-200"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`order-1 sm:order-2 py-2.5 px-5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98] outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 flex items-center justify-center gap-2 ${
                loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200' : styles.btn
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default ConfirmModal;
