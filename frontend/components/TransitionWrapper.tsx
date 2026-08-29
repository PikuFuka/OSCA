import React from 'react';
import { Loader2 } from 'lucide-react';

interface TransitionWrapperProps {
  isLoading: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Enterprise loading transition wrapper.
 * Provides instant, flicker-free swapping between skeleton and content in-place with zero layout shift.
 */
export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ 
  isLoading, 
  skeleton, 
  children,
  className = '' 
}) => {
  if (isLoading) {
    if (skeleton) {
      return (
        <div className={`w-full transition-wrapper-skeleton will-change-[opacity,filter] ${className}`} aria-busy="true" aria-live="polite">
          {skeleton}
        </div>
      );
    }

    return (
      <div className={`w-full min-h-[300px] flex flex-col items-center justify-center gap-3 py-16 flex-1 bg-white/50 backdrop-blur-sm rounded-2xl transition-wrapper-skeleton ${className}`} aria-busy="true" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-systemBlue" strokeWidth={2.5} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading records...</span>
      </div>
    );
  }

  return (
    <div key="content-ready" className={`w-full transition-fade-in will-change-[opacity,transform,filter] ${className}`}>
      {children}
    </div>
  );
};

export default TransitionWrapper;
