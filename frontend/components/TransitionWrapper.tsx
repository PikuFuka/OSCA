import React, { useState, useEffect } from 'react';

interface TransitionWrapperProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Enterprise loading transition wrapper.
 * Achieves a seamless cross-fade by keeping the skeleton in the DOM
 * during the transition window while the real data fades in.
 */
export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ isLoading, skeleton, children }) => {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true);
      setFadeState('in');
    } else {
      // Trigger fade out
      setFadeState('out');
      // Remove skeleton completely after animation completes
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 300); // 300ms matches the CSS transition-fade-out duration
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="relative w-full">
      {/* Real content - renders when data is loaded, and gently fades in via CSS */}
      {!isLoading && (
        <div className="transition-fade-in w-full">
          {children}
        </div>
      )}
      
      {/* Skeleton overlay - normal flow when loading, absolute when transitioning out */}
      {showSkeleton && (
        <div 
          className={`w-full rounded-2xl bg-white ${fadeState === 'out' ? 'absolute top-0 left-0 z-10 transition-fade-out pointer-events-none' : 'relative z-10'}`}
        >
          {skeleton}
        </div>
      )}
    </div>
  );
};

export default TransitionWrapper;
