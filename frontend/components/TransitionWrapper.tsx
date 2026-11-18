import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface TransitionWrapperProps {
  isLoading: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /**
   * Disable the default content reveal animation so callers can provide their
   * own sequencing (e.g. staggered dashboard entry).
   */
  animateContent?: boolean;
}

/**
 * Enterprise loading transition wrapper.
 * Provides instant, flicker-free swapping between skeleton and content in-place with zero layout shift.
 */
export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ 
  isLoading, 
  skeleton, 
  children,
  className = '',
  animateContent = true,
}) => {
  const wasLoadingRef = useRef(isLoading);
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true;
      setIsRevealing(false);
      return;
    }

    if (wasLoadingRef.current) {
      wasLoadingRef.current = false;
      setIsRevealing(true);
      const timer = window.setTimeout(() => setIsRevealing(false), 420);
      return () => window.clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
    if (skeleton) {
      return (
        <div className={`w-full transition-wrapper-skeleton will-change-[opacity,filter] ${className}`} aria-busy="true" aria-live="polite">
          {skeleton}
        </div>
      );
    }

    if (isRevealing && skeleton) {
      return (
        <div className={`relative w-full ${className}`} aria-busy="false">
          <div className="relative z-0">
            <div className={animateContent ? 'transition-fade-in' : 'transition-content-soft'}>
              {children}
            </div>
          </div>
          <div
            className="absolute inset-0 z-10 pointer-events-none transition-wrapper-skeleton-out"
            aria-hidden="true"
          >
            {skeleton}
          </div>
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
    <div
      key="content-ready"
      className={`w-full ${animateContent ? 'transition-fade-in' : 'transition-content-soft'} ${className}`}
    >
      {children}
    </div>
  );
};

export default TransitionWrapper;
