import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface TransitionWrapperProps {
  isLoading: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Enterprise loading transition wrapper.
 * Renders a custom skeleton or fallback spinner, with smooth transition fade state.
 */
export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ isLoading, skeleton, children }) => {
  const [showLoader, setShowLoader] = useState(true);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
      setFadeState('in');
    } else {
      setFadeState('out');
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 500); // 500ms matches the CSS transition-fade-out duration
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="relative w-full h-full">
      {/* Real content - renders when data is loaded, and gently fades in via CSS */}
      {!isLoading && (
        <div className="transition-fade-in w-full h-full">
          {children}
        </div>
      )}
      
      {/* Loading overlay / Skeleton */}
      {showLoader && (
        <div 
          className={`w-full ${!skeleton ? 'min-h-[300px]' : ''} ${
            fadeState === 'out' ? 'absolute top-0 left-0 w-full z-50 transition-fade-out pointer-events-none' : 'relative z-10 h-full flex flex-col bg-transparent'
          }`}
        >
          {skeleton ? (
            <div className="w-full h-full">{skeleton}</div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 flex-1 bg-white/50 backdrop-blur-sm rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-systemBlue" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading records...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransitionWrapper;
