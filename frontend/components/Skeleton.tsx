import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const hasUtility = (className: string, prefix: string) =>
  className
    .split(/\s+/)
    .some((token) => token.replace(/^!/, '').startsWith(prefix));

/**
 * Base skeleton element with a quiet, GPU-accelerated wave animation.
 * Decorative only — loading state is announced by the surrounding wrapper.
 */
export const SkeletonPrimitive = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-[#E4E6EB] skeleton-wave select-none pointer-events-none ${className}`}
      {...props}
    />
  );
};

/**
 * Skeleton for single lines of text.
 */
export const SkeletonText = ({ className = '', ...props }: SkeletonProps) => {
  const height = hasUtility(className, 'h-') ? '' : 'h-4';
  const width = hasUtility(className, 'w-') ? '' : 'w-full';
  const radius = hasUtility(className, 'rounded') ? '' : 'rounded-md';

  return (
    <SkeletonPrimitive
      className={`${height} ${width} ${radius} ${className}`}
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
  const radius = hasUtility(className, 'rounded') ? '' : 'rounded-xl';

  return (
    <SkeletonPrimitive
      className={`${radius} ${className}`}
      {...props}
    />
  );
};

/**
 * Skeleton for standard buttons.
 */
export const SkeletonButton = ({ className = '', ...props }: SkeletonProps) => {
  const height = hasUtility(className, 'h-') ? '' : 'h-11';
  const radius = hasUtility(className, 'rounded') ? '' : 'rounded-xl';

  return (
    <SkeletonPrimitive
      className={`${height} ${radius} ${className}`}
      {...props}
    />
  );
};

/**
 * Skeleton for status badges and pills.
 */
export const SkeletonBadge = ({ className = '', ...props }: SkeletonProps) => {
  const height = hasUtility(className, 'h-') ? '' : 'h-5';
  const width = hasUtility(className, 'w-') ? '' : 'w-16';
  const radius = hasUtility(className, 'rounded') ? '' : 'rounded-full';

  return (
    <SkeletonPrimitive
      className={`${height} ${width} ${radius} ${className}`}
      {...props}
    />
  );
};

/**
 * Skeleton for input fields and search boxes.
 */
export const SkeletonInput = ({ className = '', ...props }: SkeletonProps) => {
  const height = hasUtility(className, 'h-') ? '' : 'h-11';
  const width = hasUtility(className, 'w-') ? '' : 'w-full';
  const radius = hasUtility(className, 'rounded') ? '' : 'rounded-xl';

  return (
    <SkeletonPrimitive
      className={`${height} ${width} ${radius} ${className}`}
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
