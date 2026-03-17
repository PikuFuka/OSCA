import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div className={`relative overflow-hidden rounded-md bg-slate-200/80 skeleton-wave ${className}`}></div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 md:space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-48 rounded-xl" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32 rounded-2xl" />
          <Skeleton className="h-12 w-48 rounded-2xl" />
          <Skeleton className="h-12 w-32 rounded-2xl" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 h-[140px] flex flex-col justify-between">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Large Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Skeleton className="lg:col-span-2 h-[450px] rounded-[2.5rem]" />
        <Skeleton className="h-[450px] rounded-[2.5rem]" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Skeleton className="h-[450px] rounded-[2.5rem]" />
        <Skeleton className="h-[450px] rounded-[2.5rem]" />
      </div>
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <div className="h-16 border-b border-slate-50 flex items-center px-8 gap-4">
          <Skeleton className="h-4 w-1/4 rounded" />
          <Skeleton className="h-4 w-1/4 rounded" />
          <Skeleton className="h-4 w-1/4 rounded" />
          <Skeleton className="h-4 w-1/4 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 border-b border-slate-50 flex items-center px-8 gap-4">
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center gap-8">
        <Skeleton className="w-32 h-32 rounded-full" />
        <div className="flex-1 space-y-4 text-center md:text-left">
          <Skeleton className="h-8 w-64 mx-auto md:mx-0 rounded-xl" />
          <Skeleton className="h-4 w-48 mx-auto md:mx-0 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-64 rounded-[2rem]" />
        <Skeleton className="h-64 rounded-[2rem]" />
      </div>
    </div>
  );
};

export const UserDashboardSkeleton = () => {
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Welcome Section */}
      <Skeleton className="h-48 md:h-64 rounded-[2.5rem]" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-64 rounded-[2rem]" />
        <Skeleton className="h-64 rounded-[2rem]" />
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 space-y-8">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 rounded-[2rem]" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
