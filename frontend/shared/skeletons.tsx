import React from 'react';
import Skeleton from '../components/Skeleton';

// Lightweight skeletons that live in the main bundle — used as Suspense fallback
// Dimensions match the final tables to avoid layout shift (auto-height, same padding/rows)

export const DashboardFallback = () => (
  <div className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
      <div><Skeleton.Text className="w-48 h-7 mb-1.5" /><Skeleton.Text className="w-64 h-3.5" /></div>
      <div className="flex items-center gap-3"><Skeleton.Rect className="w-28 h-9" /><Skeleton.Rect className="w-36 h-9" /></div>
    </div>
    <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[320px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3"><Skeleton.Rect className="w-10 h-10 rounded-xl" /><Skeleton.Text className="w-32 h-3" /></div>
    </div>
  </div>
);

export const RegistryFallback = () => (
  <div className="space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div><Skeleton.Text className="w-56 h-8 mb-2" /><Skeleton.Text className="w-40 h-3" /></div>
      <div className="flex gap-3"><Skeleton.Rect className="w-[320px] h-11 rounded-xl" /><Skeleton.Rect className="w-[180px] h-11 rounded-xl" /></div>
    </div>
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left table-fixed">
          <thead><tr className="border-b border-slate-100"><th className="px-6 py-4"><Skeleton.Text className="w-24 h-3" /></th><th className="px-5 py-4"><Skeleton.Text className="w-16 h-3" /></th><th className="px-5 py-4"><Skeleton.Rect className="w-16 h-5 rounded-lg" /></th><th className="px-6 py-4"><Skeleton.Rect className="w-7 h-7 rounded-lg" /></th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {[...Array(8)].map((_, i) => (
              <tr key={i}><td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton.Rect className="w-9 h-9 rounded-xl" /><div><Skeleton.Text className="w-32 h-3.5 mb-1" /><Skeleton.Text className="w-20 h-2.5" /></div></div></td><td className="px-5 py-4"><Skeleton.Text className="w-12 h-3" /></td><td className="px-5 py-4"><Skeleton.Rect className="w-16 h-5 rounded-full" /></td><td className="px-6 py-4"><Skeleton.Rect className="w-7 h-7 rounded-lg ml-auto" /></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const ApprovalFallback = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead><tr className="border-b border-slate-100"><th className="px-6 py-4"><Skeleton.Text className="w-24 h-3" /></th><th className="px-5 py-4"><Skeleton.Text className="w-16 h-3" /></th><th className="px-5 py-4"><Skeleton.Rect className="w-20 h-5 rounded-lg" /></th><th className="px-6 py-4"><Skeleton.Rect className="w-16 h-5 rounded-lg" /></th></tr></thead>
        <tbody className="divide-y divide-slate-50">
          {[...Array(5)].map((_, i) => (
            <tr key={i}><td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton.Rect className="w-9 h-9 rounded-xl" /><Skeleton.Text className="w-32 h-3.5" /></div></td><td className="px-5 py-4"><Skeleton.Text className="w-16 h-3.5" /></td><td className="px-5 py-4"><Skeleton.Rect className="w-20 h-6 rounded-lg" /></td><td className="px-6 py-4"><Skeleton.Rect className="w-8 h-8 rounded-lg ml-auto" /></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const AccountFallback = RegistryFallback;
export const HistoryFallback = RegistryFallback;
export const ReportFallback = RegistryFallback;

export const GenericFallback = () => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[400px] flex flex-col gap-4">
    <Skeleton.Text className="w-48 h-6" />
    <Skeleton.Rect className="w-full h-32 rounded-xl" />
    <div className="grid grid-cols-3 gap-4"><Skeleton.Rect className="h-24 rounded-xl" /><Skeleton.Rect className="h-24 rounded-xl" /><Skeleton.Rect className="h-24 rounded-xl" /></div>
  </div>
);
