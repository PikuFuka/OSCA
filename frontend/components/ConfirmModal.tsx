
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
  loading = false
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
          icon: <AlertCircle className="text-rose-600" size={48} />,
          btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 text-white',
          bg: 'bg-rose-50 border-rose-100',
          titleColor: 'text-rose-900'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="text-emerald-600" size={48} />,
          btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white',
          bg: 'bg-emerald-50 border-emerald-100',
          titleColor: 'text-emerald-950'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="text-amber-600" size={48} />,
          btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 text-white',
          bg: 'bg-amber-50 border-amber-100',
          titleColor: 'text-amber-950'
        };
      default:
        return {
          icon: <HelpCircle className="text-blue-600" size={48} />,
          btn: 'bg-blue-900 hover:bg-blue-800 shadow-blue-200 text-white',
          bg: 'bg-blue-50 border-blue-100',
          titleColor: 'text-slate-900'
        };
    }
  };

  const styles = getVariantStyles();

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-[32rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 relative">
        
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-10 text-center flex flex-col items-center">
          {/* Icon Container */}
          <div className={`w-24 h-24 rounded-[1.5rem] ${styles.bg} border-4 border-white shadow-xl flex items-center justify-center mb-8 transform -rotate-3`}>
            {styles.icon}
          </div>
          
          <div className="space-y-3 mb-10">
            <h3 className={`text-3xl font-black ${styles.titleColor} tracking-tight leading-tight`}>{title}</h3>
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-sm mx-auto">{message}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full px-2 sm:px-0">
            <button
              onClick={onCancel}
              className="order-2 sm:order-1 py-3.5 md:py-4 px-6 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 font-bold text-base hover:bg-slate-50 hover:border-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`order-1 sm:order-2 py-3.5 md:py-4 px-6 rounded-2xl font-black text-base transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 ${
                loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : styles.btn
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
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
