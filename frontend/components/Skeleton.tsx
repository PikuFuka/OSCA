import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base skeleton element with GPU-accelerated wave animation and stable dimensions
 */
export const SkeletonPrimitive = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <div 
      className={`relative overflow-hidden bg-slate-200/70 rounded-md skeleton-wave select-none pointer-events-none ${className}`} 
      {...props} 
    />
  );
};

/**
 * Skeleton for single lines of text.
 */
export const SkeletonText = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <SkeletonPrimitive 
      className={`h-4 w-full ${className}`} 
      {...props} 
    />
  );
};

/**
 * Skeleton for circular elements like avatars or icons.
 */
export const SkeletonCircle = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <SkeletonPrimitive 
      className={`rounded-full shrink-0 ${className}`} 
      {...props} 
    />
  );
};

/**
 * Skeleton for generic rectangular blocks (cards, images, containers).
 */
export const SkeletonRect = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <SkeletonPrimitive 
      className={`rounded-xl ${className}`} 
      {...props} 
    />
  );
};

/**
 * Skeleton for standard buttons.
 */
export const SkeletonButton = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <SkeletonPrimitive 
      className={`h-11 rounded-xl ${className}`} 
      {...props} 
    />
  );
};

/**
 * Skeleton for status badges and pills.
 */
export const SkeletonBadge = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <SkeletonPrimitive 
      className={`h-5 w-16 rounded-full ${className}`} 
      {...props} 
    />
  );
};

/**
 * Skeleton for input fields and search boxes.
 */
export const SkeletonInput = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <SkeletonPrimitive 
      className={`h-11 w-full rounded-xl ${className}`} 
      {...props} 
    />
  );
};

export default {
  Primitive: SkeletonPrimitive,
  Text: SkeletonText,
  Circle: SkeletonCircle,
  Rect: SkeletonRect,
  Button: SkeletonButton,
  Badge: SkeletonBadge,
  Input: SkeletonInput
};
