import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div className={`relative overflow-hidden rounded-md bg-slate-200/60 skeleton-wave ${className}`}></div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 md:space-y-10 pb-16">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-48 rounded-xl" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-32 rounded-xl" />
          <Skeleton className="h-12 w-48 rounded-xl" />
          <Skeleton className="h-12 w-32 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {[1, 2, 3, 4].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24 rounded mb-2" />
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-sm">
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
        <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
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
    </div>
  );
};

export const RegistrationFormSkeleton = () => {
  return (
    <div className="space-y-8 pb-12 w-full max-w-5xl mx-auto">
      <div className="space-y-2 mb-8">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      
      {[1, 2, 3].map((section, i) => (
        <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <Skeleton className="h-6 w-40 rounded-xl mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-4 mt-8">
        <Skeleton className="h-12 w-32 rounded-xl" />
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
    </div>
  );
};

export const MemberRegistrySkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-56 rounded-2xl" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <div className="flex flex-col xl:flex-row gap-4 w-full xl:w-auto">
          <Skeleton className="h-14 w-full xl:w-[450px] rounded-xl" />
          <Skeleton className="h-14 w-full xl:w-[200px] rounded-xl" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-hidden">
          <table className="w-full text-left table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 lg:px-6 py-4 lg:py-5 w-[30%]"><Skeleton className="h-3 w-[30%] rounded" /></th>
                <th className="px-4 lg:px-6 py-4 lg:py-5 w-[12%] text-center"><Skeleton className="h-3 w-[60%] rounded mx-auto" /></th>
                <th className="px-4 lg:px-6 py-4 lg:py-5 w-[14%] text-center"><Skeleton className="h-3 w-[60%] rounded mx-auto" /></th>
                <th className="px-4 lg:px-6 py-4 lg:py-5 w-[12%] text-center"><Skeleton className="h-3 w-[60%] rounded mx-auto" /></th>
                <th className="px-4 lg:px-6 py-4 lg:py-5 w-[14%] text-center"><Skeleton className="h-3 w-[60%] rounded mx-auto" /></th>
                <th className="px-2 lg:px-3 py-4 lg:py-5 w-[18%] text-center"><Skeleton className="h-3 w-[60%] rounded mx-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 lg:px-6 py-4 lg:py-5 align-middle">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <Skeleton className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 lg:py-5 text-center">
                    <Skeleton className="h-4 w-8 rounded mx-auto mb-1" />
                    <Skeleton className="h-3 w-16 rounded mx-auto" />
                  </td>
                  <td className="px-4 lg:px-6 py-4 lg:py-5 text-center">
                    <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 lg:px-6 py-4 lg:py-5 text-center">
                    <Skeleton className="h-6 w-14 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 lg:px-6 py-4 lg:py-5 text-center">
                    <Skeleton className="h-3 w-20 rounded mx-auto mb-1" />
                  </td>
                  <td className="px-2 lg:px-3 py-4 lg:py-5">
                    <div className="flex items-center justify-center gap-1.5 lg:gap-2">
                      <Skeleton className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg" />
                      <Skeleton className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg" />
                      <Skeleton className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 md:px-8 md:py-6 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Skeleton className="h-8 w-40 rounded-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-20 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-10 w-20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ApprovalSkeleton = () => {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-56 rounded-2xl" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-14 w-[350px] rounded-xl" />
          <Skeleton className="h-14 w-40 rounded-xl" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="ios-table w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-10 py-6"><Skeleton className="h-3 w-16 rounded" /></th>
                <th className="px-10 py-6"><Skeleton className="h-3 w-16 rounded" /></th>
                <th className="px-10 py-6"><Skeleton className="h-3 w-24 rounded" /></th>
                <th className="px-10 py-6"><Skeleton className="h-3 w-24 rounded" /></th>
                <th className="px-10 py-6"><Skeleton className="h-3 w-24 rounded" /></th>
                <th className="px-10 py-6"><Skeleton className="h-3 w-16 rounded" /></th>
                <th className="px-10 py-6 text-right"><Skeleton className="h-3 w-16 rounded ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <Skeleton className="h-4 w-20 rounded" />
                  </td>
                  <td className="px-10 py-6">
                    <Skeleton className="h-6 w-24 rounded-xl" />
                  </td>
                  <td className="px-10 py-6">
                    <Skeleton className="h-6 w-24 rounded-xl" />
                  </td>
                  <td className="px-10 py-6">
                    <Skeleton className="h-4 w-28 rounded" />
                  </td>
                  <td className="px-10 py-6">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <Skeleton className="w-10 h-10 rounded-xl" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const AccountSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-12 w-44 rounded-xl" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
        </div>

        <div className="p-8 border-b border-slate-50">
          <Skeleton className="h-12 w-full max-w-sm rounded-xl" />
        </div>

        <div className="overflow-x-auto flex-1">
          <div className="bg-slate-50 border-b border-slate-200 h-14 flex items-center px-8">
            <Skeleton className="h-3 w-[25%] rounded" />
            <Skeleton className="h-3 w-[15%] rounded" />
            <Skeleton className="h-3 w-[20%] rounded" />
            <Skeleton className="h-3 w-[15%] rounded" />
            <Skeleton className="h-3 w-[10%] rounded ml-auto" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 flex items-center px-8">
                <div className="flex items-center gap-4 w-[25%]">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0 border-2 border-white" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-6 w-[15%] rounded-xl" />
                <Skeleton className="h-4 w-[20%] rounded" />
                <Skeleton className="h-6 w-[15%] rounded-xl" />
                <Skeleton className="w-10 h-10 rounded-xl ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReportSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-5 w-48 rounded-full" />
        </div>
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>

      <div className="bg-slate-50 p-2 rounded-xl inline-flex gap-2 mb-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                <th className="px-8 py-4"><Skeleton className="h-3 w-16 rounded" /></th>
                <th className="px-8 py-4"><Skeleton className="h-3 w-16 rounded" /></th>
                <th className="px-8 py-4 text-center"><Skeleton className="h-3 w-10 rounded mx-auto" /></th>
                <th className="px-8 py-4 text-center"><Skeleton className="h-3 w-16 rounded mx-auto" /></th>
                <th className="px-8 py-4 text-center"><Skeleton className="h-3 w-10 rounded mx-auto" /></th>
                <th className="px-8 py-4 text-center"><Skeleton className="h-3 w-16 rounded mx-auto" /></th>
                <th className="px-8 py-4 text-center"><Skeleton className="h-3 w-16 rounded mx-auto" /></th>
                <th className="px-8 py-4 text-center"><Skeleton className="h-3 w-16 rounded mx-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-8 py-5">
                    <Skeleton className="h-4 w-40 rounded mb-1.5" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </td>
                  <td className="px-8 py-5">
                    <Skeleton className="h-4 w-32 rounded" />
                  </td>
                  <td className="px-8 py-5 text-center">
                    <Skeleton className="h-4 w-12 rounded mx-auto" />
                  </td>
                  <td className="px-8 py-5 text-center">
                    <Skeleton className="h-4 w-20 rounded mx-auto" />
                  </td>
                  <td className="px-8 py-5 text-center">
                    <Skeleton className="h-4 w-8 rounded mx-auto" />
                  </td>
                  <td className="px-8 py-5 text-center">
                    <Skeleton className="h-4 w-16 rounded mx-auto" />
                  </td>
                  <td className="px-8 py-5 text-center">
                    <Skeleton className="h-4 w-16 rounded mx-auto" />
                  </td>
                  <td className="px-8 py-5 text-center">
                    <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const ArchiveSkeleton = () => {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-40 rounded-2xl" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full md:w-96 rounded-xl" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-2 p-1.5 w-fit">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5"><Skeleton className="h-3 w-20 rounded" /></th>
                <th className="px-8 py-5"><Skeleton className="h-3 w-16 rounded" /></th>
                <th className="px-8 py-5"><Skeleton className="h-3 w-16 rounded" /></th>
                <th className="px-8 py-5"><Skeleton className="h-3 w-16 rounded" /></th>
                <th className="px-8 py-5 text-right"><Skeleton className="h-3 w-16 rounded ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-16 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <Skeleton className="h-4 w-12 rounded mb-1.5" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </td>
                  <td className="px-8 py-4">
                    <Skeleton className="h-4 w-24 rounded" />
                  </td>
                  <td className="px-8 py-4">
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </td>
                  <td className="px-8 py-4 text-right">
                    <Skeleton className="w-10 h-10 rounded-xl ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const BackupSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-2 mb-8">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-4">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
          </div>
          <div className="space-y-2 py-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
          </div>
          <div className="space-y-2 py-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const SettingsSkeleton = () => {
  return (
    <div className="max-w-4xl space-y-8 pb-16">
      <div className="space-y-2 mb-8">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>
      
      {[1, 2, 3].map((section, i) => (
        <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <Skeleton className="h-6 w-40 rounded-xl border-b border-slate-100 pb-4" />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-end pt-4">
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>
    </div>
  );
};

export const HistoryLogSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <Skeleton className="h-12 w-full max-w-sm rounded-xl" />
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <Skeleton className="h-3 w-32 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-64 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              </div>
              <div className="text-right shrink-0 ml-4 space-y-2">
                <Skeleton className="h-3 w-20 rounded ml-auto" />
                <Skeleton className="h-6 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export const UserDashboardSkeleton = () => {
  return (
    <div className="space-y-8 pb-12 w-full max-w-5xl mx-auto">
      <div className="space-y-2 mb-8">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <Skeleton className="h-6 w-40 rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
};

export default Skeleton;
