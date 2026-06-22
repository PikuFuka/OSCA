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
    <div className="space-y-6 md:space-y-10 pb-16 animate-in fade-in duration-300">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-48 rounded-xl" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-32 rounded-ios" />
          <Skeleton className="h-12 w-48 rounded-ios" />
          <Skeleton className="h-12 w-32 rounded-ios" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {[
          { label: 'Total Members', icon: true },
          { label: 'Queue Size', icon: true },
          { label: 'Centenarians', icon: true },
          { label: 'Total Deceased', icon: true },
        ].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-12 w-12 rounded-ios" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24 rounded mb-2" />
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-3xl border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 rounded-xl" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-[320px] w-full rounded-2xl" />
        </div>
        <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100 flex flex-col">
          <Skeleton className="h-7 w-32 rounded-xl mb-2" />
          <Skeleton className="h-4 w-48 rounded mb-8" />
          <Skeleton className="h-[280px] w-full rounded-2xl mb-6" />
          <div className="space-y-3 mt-auto">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <Skeleton className="h-5 w-12 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100">
          <Skeleton className="h-6 w-48 rounded-xl mb-10" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 rounded-xl" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-xl" />
              <Skeleton className="h-4 w-64 rounded" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-xl border border-slate-100 p-4" style={{ minHeight: '80px' }}>
                <Skeleton className="h-6 w-10 rounded mb-2" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100">
          <Skeleton className="h-6 w-40 rounded-xl mb-2" />
          <Skeleton className="h-4 w-56 rounded mb-10" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
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
        {Array.from({ length: rows }).map((_, i) => (
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

export const MemberRegistrySkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-56 rounded-2xl" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <div className="flex flex-col xl:flex-row gap-4 w-full xl:w-auto">
          <Skeleton className="h-14 w-full xl:w-[450px] rounded-ios" />
          <Skeleton className="h-14 w-full xl:w-[200px] rounded-ios" />
        </div>
      </div>

      <div className="ios-card shadow-xl shadow-slate-200/50">
        <div className="w-full overflow-x-hidden">
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <div className="h-16 border-b border-slate-100 flex items-center px-8">
              <Skeleton className="h-4 w-[30%] rounded" />
              <Skeleton className="h-4 w-[12%] rounded mx-auto" />
              <Skeleton className="h-4 w-[14%] rounded mx-auto" />
              <Skeleton className="h-4 w-[12%] rounded mx-auto" />
              <Skeleton className="h-4 w-[14%] rounded mx-auto" />
              <Skeleton className="h-4 w-[18%] rounded mx-auto" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 border-b border-slate-50 flex items-center px-8 gap-4">
                <div className="flex items-center gap-3 w-[30%]">
                  <Skeleton className="w-11 h-11 lg:w-12 lg:h-12 rounded-ios shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
                <div className="w-[12%] mx-auto">
                  <Skeleton className="h-4 w-8 rounded mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 rounded mx-auto" />
                </div>
                <div className="w-[14%] mx-auto">
                  <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                </div>
                <div className="w-[12%] mx-auto">
                  <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                </div>
                <div className="w-[14%] mx-auto">
                  <Skeleton className="h-3 w-20 rounded mx-auto" />
                </div>
                <div className="w-[18%] mx-auto flex gap-1">
                  {[1, 2, 3, 4].map(j => (
                    <Skeleton key={j} className="w-8 h-8 rounded-ios" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 md:px-10 md:py-8 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Skeleton className="h-8 w-40 rounded-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-20 rounded-ios" />
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-10 w-20 rounded-ios" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ApprovalSkeleton = () => {
  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-56 rounded-2xl" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-14 w-[350px] rounded-ios" />
          <Skeleton className="h-14 w-40 rounded-ios" />
        </div>
      </div>

      <div className="ios-card shadow-xl shadow-slate-200/50 overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <div className="h-16 border-b border-slate-100 flex items-center px-10 gap-4">
              <Skeleton className="h-4 w-[15%] rounded" />
              <Skeleton className="h-4 w-[10%] rounded" />
              <Skeleton className="h-4 w-[15%] rounded" />
              <Skeleton className="h-4 w-[15%] rounded" />
              <Skeleton className="h-4 w-[12%] rounded" />
              <Skeleton className="h-4 w-[8%] rounded" />
              <Skeleton className="h-4 w-[15%] rounded ml-auto" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 border-b border-slate-50 flex items-center px-10 gap-4">
                <div className="flex items-center gap-4 w-[15%]">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-4 w-[10%] rounded" />
                <Skeleton className="h-6 w-[15%] rounded-xl" />
                <Skeleton className="h-6 w-[15%] rounded-xl" />
                <Skeleton className="h-4 w-[12%] rounded" />
                <Skeleton className="h-6 w-[8%] rounded-full" />
                <div className="flex items-center justify-end gap-3 w-[15%] ml-auto">
                  <Skeleton className="w-10 h-10 rounded-ios" />
                  <Skeleton className="w-10 h-10 rounded-ios" />
                  <Skeleton className="w-10 h-10 rounded-ios" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ArchiveSkeleton = () => {
  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-40 rounded-2xl" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <Skeleton className="h-14 w-[350px] rounded-ios" />
      </div>

      <div className="ios-card shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-ios w-fit">
            <Skeleton className="h-10 w-20 rounded-ios" />
            <Skeleton className="h-10 w-20 rounded-ios" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="h-16 border-b border-slate-100 flex items-center px-8">
            <Skeleton className="h-4 w-[25%] rounded" />
            <Skeleton className="h-4 w-[15%] rounded mx-auto" />
            <Skeleton className="h-4 w-[15%] rounded mx-auto" />
            <Skeleton className="h-4 w-[20%] rounded mx-auto" />
            <Skeleton className="h-4 w-[10%] rounded ml-auto" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-slate-50 flex items-center px-8">
              <div className="flex items-center gap-3 w-[25%]">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-[15%] rounded mx-auto" />
              <Skeleton className="h-4 w-[15%] rounded mx-auto" />
              <Skeleton className="h-4 w-[20%] rounded mx-auto" />
              <Skeleton className="w-10 h-10 rounded-ios ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const HistoryLogSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <Skeleton className="h-11 w-32 rounded-2xl" />
      </div>

      <div className="flex items-center gap-3 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl">
        <Skeleton className="w-4 h-4 rounded-full shrink-0" />
        <Skeleton className="h-4 w-full max-w-md rounded" />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <Skeleton className="h-11 w-full md:w-96 rounded-2xl" />
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Skeleton className="w-5 h-5 rounded-full mt-0.5" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-64 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              </div>
              <div className="text-right shrink-0 ml-4 space-y-2">
                <Skeleton className="h-3 w-20 rounded ml-auto" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ReportSkeleton = () => {
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
        <Skeleton className="h-12 w-56 rounded-ios" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>

        <div className="overflow-x-auto">
          <div className="bg-white">
            <div className="h-14 border-b border-slate-100 flex items-center px-8">
              <Skeleton className="h-4 w-[15%] rounded mr-8" />
              <Skeleton className="h-4 w-[20%] rounded mr-8" />
              <Skeleton className="h-4 w-[8%] rounded mx-auto" />
              <Skeleton className="h-4 w-[10%] rounded mx-auto" />
              <Skeleton className="h-4 w-[6%] rounded mx-auto" />
              <Skeleton className="h-4 w-[12%] rounded mx-auto" />
              <Skeleton className="h-4 w-[10%] rounded mx-auto" />
              <Skeleton className="h-4 w-[10%] rounded" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 border-b border-slate-50 flex items-center px-8">
                <div className="w-[15%] mr-8">
                  <Skeleton className="h-4 w-3/4 rounded mb-1.5" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
                <Skeleton className="h-4 w-[20%] rounded mr-8" />
                <Skeleton className="h-4 w-[8%] rounded mx-auto" />
                <Skeleton className="h-4 w-[10%] rounded mx-auto" />
                <Skeleton className="h-4 w-[6%] rounded mx-auto" />
                <Skeleton className="h-4 w-[12%] rounded mx-auto" />
                <Skeleton className="h-4 w-[10%] rounded mx-auto" />
                <Skeleton className="h-4 w-[10%] rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
        </div>
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-[2.5rem] p-8 md:p-12 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-10 w-56 rounded-xl" />
            <Skeleton className="h-5 w-72 rounded" />
          </div>
          <Skeleton className="h-20 w-32 rounded-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <Skeleton className="h-6 w-44 rounded-xl mb-6" />
          <div className="relative flex items-center justify-between mb-8 px-4">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <Skeleton className="h-4 w-24 rounded mb-4" />
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <Skeleton className="h-8 w-40 rounded-xl" />
          </div>
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-6 w-44 rounded-xl" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-6 rounded-[2rem] border-2 border-blue-100 bg-white shadow-md shadow-blue-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AccountSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-12 w-44 rounded-2xl" />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="px-8 pt-8 pb-0 border-b border-slate-100 flex gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-28 rounded-none border-b-4 border-transparent" />
          ))}
        </div>

        <div className="p-8 border-b border-slate-50">
          <Skeleton className="h-11 w-full max-w-md rounded-2xl" />
        </div>

        <div className="overflow-x-auto flex-1">
          <div className="bg-white">
            <div className="h-16 border-b border-slate-100 flex items-center px-10">
              <Skeleton className="h-4 w-[22%] rounded" />
              <Skeleton className="h-4 w-[15%] rounded mx-auto" />
              <Skeleton className="h-4 w-[20%] rounded mx-auto" />
              <Skeleton className="h-4 w-[12%] rounded mx-auto" />
              <Skeleton className="h-4 w-[10%] rounded ml-auto" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 border-b border-slate-50 flex items-center px-10">
                <div className="flex items-center gap-4 w-[22%]">
                  <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-6 w-[15%] rounded-xl mx-auto" />
                <Skeleton className="h-4 w-[20%] rounded mx-auto" />
                <Skeleton className="h-6 w-[12%] rounded-full mx-auto" />
                <Skeleton className="w-10 h-10 rounded-ios ml-auto" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;