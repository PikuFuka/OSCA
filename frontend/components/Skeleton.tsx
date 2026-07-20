import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base skeleton element with wave animation
 */
export const SkeletonPrimitive = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <div 
      className={`relative overflow-hidden bg-slate-200/60 rounded-md skeleton-wave ${className}`} 
      {...props} 
    />
  );
};

/**
 * Skeleton for single lines of text. Height is fixed, width can be adjusted via className.
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
 * Skeleton for generic rectangular blocks (cards, images).
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
      className={`h-12 rounded-ios ${className}`} 
      {...props} 
    />
  );
};

export default {
  Primitive: SkeletonPrimitive,
  Text: SkeletonText,
  Circle: SkeletonCircle,
  Rect: SkeletonRect,
  Button: SkeletonButton
};
