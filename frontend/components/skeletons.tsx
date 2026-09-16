import React from 'react';
import Skeleton from './Skeleton';

/**
 * Per-view skeleton screens — shared between each view's own data-loading
 * state and the App-level <Suspense> fallback, so the identical skeleton
 * appears instantly while a lazy view chunk downloads, then continues
 * seamlessly into the view's data loading. Kept in an eagerly-loaded module
 * so fallbacks can render before any view chunk arrives.
 */

const DashboardSkeleton = () => {
  return (
    <div className="space-y-5 pb-16 bg-[#f8fafc] min-h-screen w-full">
      {/* Utility / Control Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <Skeleton.Text className="w-48 h-7" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton.Rect className="w-24 h-9 rounded-none" />
          <Skeleton.Rect className="w-36 h-9 rounded-none" />
          <Skeleton.Rect className="w-24 h-9 rounded-none" />
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-4 w-full relative overflow-hidden">
            <div className="flex justify-between items-start w-full relative z-10">
              <div>
                <Skeleton.Text className="w-24 h-3 mb-1.5" />
                <Skeleton.Text className="w-28 h-8" />
              </div>
              <Skeleton.Rect className="w-10 h-10 rounded-lg shrink-0" />
            </div>
            <div className="w-full h-12 mt-1 relative z-10">
              <Skeleton.Primitive className="w-full h-full rounded-none" />
            </div>
          </div>
        ))}
      </div>

      {/* Asymmetrical Layout - Tier 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Gender Breakdown */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-[320px]">
          <Skeleton.Text className="w-36 h-5 mb-1.5" />
          <Skeleton.Text className="w-48 h-3.5 mb-6" />
          <div className="flex-1 flex items-center gap-5 min-h-0">
            <div className="relative w-36 h-36 shrink-0">
              <Skeleton.Circle className="w-full h-full" />
              <div className="absolute inset-5 bg-white rounded-full" />
              <div className="absolute inset-0 grid place-items-center">
                <Skeleton.Text className="w-12 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Skeleton.Text className="w-16 h-3.5" />
                  <Skeleton.Text className="w-10 h-4" />
                </div>
                <Skeleton.Primitive className="w-full h-2 rounded-full" />
                <Skeleton.Text className="w-8 h-3 ml-auto mt-1" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Skeleton.Text className="w-16 h-3.5" />
                  <Skeleton.Text className="w-10 h-4" />
                </div>
                <Skeleton.Primitive className="w-full h-2 rounded-full" />
                <Skeleton.Text className="w-8 h-3 ml-auto mt-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-[320px]">
          <Skeleton.Text className="w-52 h-5 mb-1.5" />
          <Skeleton.Text className="w-44 h-3.5 mb-6" />
          <div className="flex-1 w-full min-h-0">
            <Skeleton.Primitive className="w-full h-full rounded-none" />
          </div>
        </div>

        {/* Mortality Analytics */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-[320px]">
          <Skeleton.Text className="w-40 h-5 mb-1.5" />
          <Skeleton.Text className="w-36 h-3.5 mb-6" />
          <div className="flex-1 w-full min-h-0">
            <Skeleton.Primitive className="w-full h-full rounded-none" />
          </div>
        </div>
      </div>

       {/* Full Width Grid Bottom (Geographic Heatmap) */}
       <div className="grid grid-cols-1">
         <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Skeleton.Rect className="w-8 h-8 rounded-xl shrink-0" />
                <Skeleton.Text className="w-44 h-5" />
              </div>
              <Skeleton.Text className="w-56 h-3 mt-1" />
            </div>
            <div className="shrink-0 flex flex-col items-start sm:items-end gap-1.5">
              <Skeleton.Text className="w-28 h-2.5" />
              <Skeleton.Rect className="w-64 h-9 rounded-full" />
            </div>
          </div>
          <div className="p-4 sm:p-6 bg-slate-50/40">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between min-h-[116px]">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton.Rect className="w-8 h-5 rounded-md" />
                    <Skeleton.Rect className="w-12 h-5 rounded-md" />
                  </div>
                  <div className="mt-3">
                    <Skeleton.Text className="w-3/4 h-3 mb-2" />
                    <Skeleton.Text className="w-1/2 h-6 mb-1" />
                    <Skeleton.Text className="w-1/3 h-2.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-6 sm:px-8 py-3 bg-white border-t border-slate-100 flex items-center justify-end">
            <Skeleton.Text className="w-48 h-3" />
          </div>
        </div>
       </div>
    </div>
  );
};

const RegistrySkeleton = () => {
  return (
    <table className="w-full text-left table-fixed">
      <thead className="bg-slate-50/70">
        <tr className="border-b border-slate-100">
          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[32%]">Member Identity</th>
          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[14%] text-center">Age / Locality</th>
          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[14%] text-center">Category</th>
          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[12%] text-center">Status</th>
          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[14%] text-center">Modified</th>
          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[14%] text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {[...Array(15)].map((_, i) => (
          <tr key={i} className="bg-white">
            {/* Identity */}
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <Skeleton.Rect className="w-9 h-9 rounded-xl shrink-0" />
                <div className="min-w-0 flex flex-col gap-1 w-full max-w-[200px]">
                  <Skeleton.Text className="w-3/4 h-3.5" />
                  <Skeleton.Text className="w-1/2 h-2.5" />
                </div>
              </div>
            </td>
            {/* Age / Locality */}
            <td className="px-5 py-4 text-center">
              <div className="flex flex-col items-center gap-1">
                <Skeleton.Text className="w-8 h-3.5" />
                <Skeleton.Text className="w-16 h-2.5" />
              </div>
            </td>
            {/* Category */}
            <td className="px-5 py-4">
              <div className="flex items-center justify-center">
                <Skeleton.Rect className="w-20 h-5 rounded-lg" />
              </div>
            </td>
            {/* Status */}
            <td className="px-5 py-4">
              <div className="flex items-center justify-center">
                <Skeleton.Rect className="w-16 h-5 rounded-full" />
              </div>
            </td>
            {/* Modified */}
            <td className="px-5 py-4 text-center">
              <Skeleton.Text className="w-24 h-3.5 mx-auto" />
            </td>
            {/* Actions */}
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-1">
                {[...Array(4)].map((_, j) => (
                   <Skeleton.Rect key={j} className="w-7 h-7 rounded-lg shrink-0" />
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ApprovalSkeleton = () => {
  return (
    <table className="w-full text-left">
      <thead className="bg-slate-50/70">
        <tr className="border-b border-slate-100">
          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Applicant</th>
          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">OSCA ID</th>
          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Request Type</th>
          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Reason</th>
          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Submitted</th>
          <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Status</th>
          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {[...Array(15)].map((_, i) => (
          <tr key={i}>
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <Skeleton.Rect className="w-9 h-9 rounded-xl shrink-0" />
                <div className="min-w-0 flex flex-col gap-1">
                  <Skeleton.Text className="w-32 h-3.5" />
                  <Skeleton.Text className="w-16 h-2.5" />
                </div>
              </div>
            </td>
            <td className="px-5 py-4"><Skeleton.Text className="w-16 h-3.5" /></td>
            <td className="px-5 py-4"><Skeleton.Rect className="w-24 h-6 rounded-lg" /></td>
            <td className="px-5 py-4"><Skeleton.Rect className="w-20 h-6 rounded-lg" /></td>
            <td className="px-5 py-4"><Skeleton.Text className="w-20 h-3.5" /></td>
            <td className="px-5 py-4"><Skeleton.Rect className="w-20 h-6 rounded-full" /></td>
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-1.5">
                 {[...Array(2)].map((_, j) => (
                    <Skeleton.Rect key={j} className="w-8 h-8 rounded-lg shrink-0" />
                 ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const BatchPrintSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border p-5 bg-white border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 w-full flex flex-col">
              <Skeleton.Text className="w-16 h-2.5 mb-1" />
              <Skeleton.Text className="w-24 h-3.5 mb-2" />
              <Skeleton.Text className="w-40 h-4 mb-1" />
              <Skeleton.Text className="w-28 h-3" />
            </div>
            <Skeleton.Rect className="w-16 h-8 rounded-lg shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

const HistoryLogSkeleton = () => {
  return (
    <div className="divide-y divide-slate-100">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-5 flex items-start justify-between">
          <div className="flex items-start gap-4 w-full">
            <Skeleton.Circle className="w-5 h-5 shrink-0 mt-1" />
            <div className="w-full flex flex-col gap-1">
              <Skeleton.Text className="w-64 h-4" />
              <Skeleton.Text className="w-36 h-3" />
            </div>
          </div>
          <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-1">
             <Skeleton.Text className="w-20 h-3" />
             <Skeleton.Rect className="w-16 h-5 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

const UserReviewSkeleton = () => {
  return (
    <div className="space-y-8 pb-12 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <Skeleton.Text className="w-48 h-8 mb-1.5" />
          <Skeleton.Text className="w-64 h-3.5" />
        </div>
        <Skeleton.Rect className="w-36 h-9 rounded-xl shrink-0" />
      </div>

      <div className="flex justify-center mb-8">
        <div className="flex flex-col items-center w-full max-w-[480px]">
            <Skeleton.Text className="w-48 h-4 mb-4 mx-auto" />
            <div className="w-[480px] max-w-full h-[300px] rounded-xl overflow-hidden shadow-sm">
              <Skeleton.Primitive className="w-full h-full rounded-xl" />
            </div>
            <Skeleton.Text className="w-32 h-3.5 mt-4 mx-auto" />
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <Skeleton.Button className="w-64 h-14 rounded-2xl" />
      </div>
    </div>
  );
};

const FormSkeleton = () => {
  return (
    <div className="w-full space-y-4">
      {/* Compact Header Skeleton */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <div>
            <Skeleton.Text className="w-48 h-6 mb-1" />
            <Skeleton.Text className="w-32 h-3" />
          </div>
        </div>
        <Skeleton.Rect className="w-72 h-9 rounded-xl shrink-0" />
      </div>

      {/* Form Card Skeleton */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 w-full min-h-[500px]">
        <div className="space-y-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton.Circle className="w-5 h-5" />
              <Skeleton.Text className="w-48 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4">
            <div className="md:col-span-4 space-y-1">
               <Skeleton.Text className="w-20 h-3 mb-1" />
               <Skeleton.Rect className="w-full h-10 rounded-lg" />
            </div>
            <div className="md:col-span-4 space-y-1">
               <Skeleton.Text className="w-20 h-3 mb-1" />
               <Skeleton.Rect className="w-full h-10 rounded-lg" />
            </div>
            <div className="md:col-span-3 space-y-1">
               <Skeleton.Text className="w-20 h-3 mb-1" />
               <Skeleton.Rect className="w-full h-10 rounded-lg" />
            </div>
            <div className="md:col-span-1 space-y-1">
               <Skeleton.Text className="w-10 h-3 mb-1" />
               <Skeleton.Rect className="w-full h-10 rounded-lg" />
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
             {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                   <Skeleton.Text className="w-20 h-3 mb-1" />
                   <Skeleton.Rect className="w-full h-10 rounded-lg" />
                </div>
             ))}
          </div>

          <div className="pt-5 border-t border-slate-100 mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
             {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1">
                   <Skeleton.Text className="w-24 h-3 mb-1" />
                   <Skeleton.Rect className="w-full h-10 rounded-lg" />
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountSkeleton = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <Skeleton.Text className="w-64 h-9 mb-1.5" />
           <Skeleton.Text className="w-80 h-3.5" />
        </div>
        {isAdmin && <Skeleton.Button className="w-44 h-11 rounded-2xl" />}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Tab Navigation Skeleton */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex gap-2 bg-slate-50/50">
          {[...Array(4)].map((_, i) => (
             <Skeleton.Rect key={i} className="w-28 h-8 rounded-full" />
          ))}
        </div>
        
        {/* Search Bar Skeleton */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
          <Skeleton.Rect className="w-full max-w-[360px] h-[42px] rounded-xl" />
          <Skeleton.Text className="w-16 h-3 ml-auto hidden sm:block" />
        </div>

        {/* Table Skeleton */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left table-fixed">
            <thead className="bg-slate-50/70">
              <tr className="border-b border-slate-100 text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                <th className="px-6 py-4 w-[34%]">Account Identity</th>
                <th className="px-5 py-4 w-[14%] text-center">Access Role</th>
                <th className="px-5 py-4 w-[22%] text-center">Assigned Unit/Area</th>
                <th className="px-5 py-4 w-[14%] text-center">Status</th>
                <th className="px-6 py-4 w-[16%] text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...Array(15)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton.Rect className="w-9 h-9 rounded-xl shrink-0" />
                      <div className="w-full max-w-[180px]">
                        <Skeleton.Text className="w-3/4 h-3.5 mb-1" />
                        <Skeleton.Text className="w-1/2 h-2.5" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><div className="flex justify-center"><Skeleton.Rect className="w-16 h-5 rounded-lg" /></div></td>
                  <td className="px-5 py-4"><Skeleton.Text className="w-20 h-3 mx-auto" /></td>
                  <td className="px-5 py-4"><div className="flex justify-center"><Skeleton.Rect className="w-16 h-5 rounded-full" /></div></td>
                  <td className="px-6 py-4"><div className="flex justify-end"><Skeleton.Rect className="w-7 h-7 rounded-lg" /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Skeleton */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
           <Skeleton.Text className="w-32 h-3" />
           <div className="flex items-center gap-1.5">
             <Skeleton.Rect className="w-8 h-8 rounded-lg" />
             <Skeleton.Text className="w-16 h-3" />
             <Skeleton.Rect className="w-8 h-8 rounded-lg" />
           </div>
        </div>
      </div>
    </div>
  );
};

const ReportSkeleton = () => {
  const columns = ['Full Name', 'Address', 'Sex', 'Birthday', 'Age', 'OSCA ID', 'RRN No', 'Pension'];

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton.Text className="w-80 h-9 mb-1.5" />
          <Skeleton.Text className="w-64 h-3.5" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton.Button className="w-full sm:w-52 h-11 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="w-full space-y-6">
          {/* Tabs Skeleton */}
          <div className="w-fit bg-white/90 rounded-xl border border-slate-200 p-2 flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton.Rect key={i} className="w-32 h-8 rounded-lg" />
            ))}
          </div>

          {/* Table Card Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <Skeleton.Rect className="w-9 h-9 rounded-xl" />
                <div className="flex flex-col gap-1">
                  <Skeleton.Text className="w-32 h-4" />
                  <Skeleton.Text className="w-20 h-3" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton.Rect className="w-40 h-10 rounded-xl" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    {columns.map((col, idx) => (
                      <th key={idx} className="px-8 py-4">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[...Array(15)].map((_, i) => (
                    <tr key={i}>
                      {columns.map((_, cIdx) => (
                        <td key={cIdx} className="px-8 py-5">
                          <Skeleton.Text className={cIdx === 1 ? 'w-48 h-4' : 'w-24 h-4'} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserDashboardSkeleton = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section Skeleton */}
      <div className="bg-gradient-to-r from-systemBlue/15 to-blue-600/15 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="w-full">
            <Skeleton.Text className="w-32 h-3.5 mb-2" />
            <Skeleton.Text className="w-64 md:w-80 h-9 mb-2" />
            <Skeleton.Text className="w-48 h-4" />
          </div>
          <Skeleton.Rect className="min-w-[120px] h-16 rounded-2xl shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Application Status Card Skeleton */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center gap-2 mb-6">
               <Skeleton.Circle className="w-6 h-6" />
               <Skeleton.Text className="w-40 h-6" />
            </div>
            
            {/* Progress Stepper Skeleton */}
            <div className="relative flex items-center justify-between mb-8 px-4">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0"></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                  <Skeleton.Circle className="w-8 h-8" />
                  <Skeleton.Text className="w-12 h-3" />
                </div>
              ))}
            </div>
          </div>
          
          <Skeleton.Rect className="w-full h-16 rounded-2xl" />
        </div>

        {/* Pension Category Card Skeleton */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <Skeleton.Text className="w-24 h-3 mb-2" />
            <div className="flex items-center gap-4 mb-4">
              <Skeleton.Rect className="w-14 h-14 rounded-2xl shrink-0" />
              <Skeleton.Text className="w-48 h-8" />
            </div>
          </div>
          <Skeleton.Rect className="w-full h-14 rounded-2xl" />
        </div>
      </div>

      {/* Full Width Requirements Section Skeleton */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Skeleton.Circle className="w-6 h-6" />
            <Skeleton.Text className="w-40 h-6" />
          </div>
          <Skeleton.Rect className="w-24 h-6 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-[2rem] border-2 bg-slate-50 border-slate-100 flex flex-col gap-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <Skeleton.Rect className="w-12 h-12 rounded-2xl shrink-0" />
                   <div className="flex flex-col gap-1">
                     <Skeleton.Text className="w-32 h-4" />
                     <Skeleton.Text className="w-16 h-3" />
                   </div>
                 </div>
               </div>
               <Skeleton.Rect className="w-full h-9 mt-auto rounded-xl" />
            </div>
          ))}
        </div>
        
        <Skeleton.Rect className="w-full h-14 rounded-2xl" />
      </div>
    </div>
  );
};

export {
  DashboardSkeleton,
  RegistrySkeleton,
  ApprovalSkeleton,
  BatchPrintSkeleton,
  HistoryLogSkeleton,
  UserReviewSkeleton,
  FormSkeleton,
  AccountSkeleton,
  ReportSkeleton,
  UserDashboardSkeleton,
};
