import React, { useState, useMemo, useEffect } from 'react';
import TransitionWrapper from './TransitionWrapper';
import Skeleton from './Skeleton';
import { useCountUp } from '../utils/useCountUp';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  LineChart,
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  Users, TrendingUp, TrendingDown, UserX, IdCard, MapPin, ClipboardList, Award, 
  Calendar as CalendarIcon, Clock, CheckCircle2, Download, AlertCircle, RefreshCw
} from 'lucide-react';
import { ViewType, BARANGAYS } from '../types';
import { seniorsAPI, requestsAPI } from '../services/api';
interface DashboardProps {
  setView?: (view: ViewType) => void;
  onCardNavigate?: (view: ViewType, reportSection?: 'masterlist' | 'centenarians' | 'deceased' | 'newly-registered') => void;
}

const formatNumber = (num: number) => num.toLocaleString();

const SimpleTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 shadow-sm text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="text-slate-500">{entry.name}</span>
            <span className="font-bold text-slate-900 tabular-nums">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Enterprise KPI Card Component
const KPICard = ({ 
  title, 
  value,
  rawValue, 
  icon: Icon, 
  trend, 
  trendLabel, 
  data, 
  dataKey,
  statusLabel,
  onClick,
  iconClass = "text-systemBlue",
  chartColor = "#007aff"
}: any) => {
  const animatedValue = useCountUp(rawValue || 0, 900);
  const displayValue = rawValue !== undefined ? new Intl.NumberFormat().format(animatedValue) : value;
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border border-slate-200 p-5 flex flex-col gap-4 text-left hover:border-systemBlue/50 hover:bg-slate-50/50 transition-colors w-full cursor-pointer relative overflow-hidden"
    >
      <div className="flex justify-between items-start w-full relative z-10">
        <div>
           <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
           <h3 className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{displayValue}</h3>
        </div>
        <div className={`p-2 rounded-lg bg-slate-50 ${iconClass}`}>
           <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
      
      <div className="w-full h-10 mt-2 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={chartColor} 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={true}
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between w-full pt-4 border-t border-slate-100 mt-2">
         <div className="flex items-center gap-1.5">
           {trend > 0 ? (
             <TrendingUp size={14} className="text-systemBlue" strokeWidth={2.5} />
           ) : trend < 0 ? (
             <TrendingDown size={14} className="text-slate-400" strokeWidth={2.5} />
           ) : (
             <span className="text-slate-400 font-bold text-xs">-</span>
           )}
           <span className={`text-xs font-semibold ${trend > 0 ? 'text-systemBlue' : 'text-slate-500'}`}>
             {Math.abs(trend)}%
           </span>
           <span className="text-xs text-slate-400 ml-1">{trendLabel}</span>
         </div>
         <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{statusLabel}</span>
      </div>
    </button>
  );
};

const DashboardSkeleton = () => {
  return (
    <div className="space-y-5 pb-16 bg-[#f8fafc] min-h-screen w-full">
      {/* Utility / Control Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <Skeleton.Text className="w-48 h-7 mb-1.5" />
          <Skeleton.Text className="w-64 h-3.5" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton.Rect className="w-28 h-9 rounded-none" />
          <Skeleton.Rect className="w-36 h-9 rounded-none" />
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 p-5 flex flex-col gap-4 w-full relative overflow-hidden">
            <div className="flex justify-between items-start w-full relative z-10">
              <div>
                <Skeleton.Text className="w-24 h-3 mb-1.5" />
                <Skeleton.Text className="w-28 h-8" />
              </div>
              <Skeleton.Rect className="w-10 h-10 rounded-lg shrink-0" />
            </div>
            <div className="w-full h-10 mt-2 relative z-10">
              <Skeleton.Primitive className="w-full h-full rounded-none" />
            </div>
            <div className="flex items-center justify-between w-full pt-4 border-t border-slate-100 mt-2">
               <Skeleton.Text className="w-24 h-3.5" />
               <Skeleton.Text className="w-16 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Asymmetrical Layout - Tier 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Registration Trends (Dominant) */}
        <div className="xl:col-span-8 bg-white border border-slate-200 p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Skeleton.Text className="w-44 h-5 mb-1.5" />
              <Skeleton.Text className="w-72 h-3.5" />
            </div>
            <Skeleton.Text className="w-32 h-3.5" />
          </div>
          <div className="flex-1 w-full min-h-0">
            <Skeleton.Primitive className="w-full h-full rounded-none" />
          </div>
        </div>

        {/* Population Leaderboard (Supporting) */}
        <div className="xl:col-span-4 bg-white border border-slate-200 flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100">
             <Skeleton.Text className="w-48 h-5 mb-1.5" />
             <Skeleton.Text className="w-40 h-3.5" />
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Rank</th>
                  <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Barangay</th>
                  <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Count</th>
                  <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-24">Share</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                     <td className="py-3 px-5"><Skeleton.Text className="w-4 h-3.5" /></td>
                     <td className="py-3 px-5"><Skeleton.Text className="w-24 h-3.5" /></td>
                     <td className="py-3 px-5 text-right"><Skeleton.Text className="w-12 h-3.5 ml-auto" /></td>
                     <td className="py-3 px-5"><Skeleton.Primitive className="w-16 h-1.5 rounded-none" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Asymmetrical Layout - Tier 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Gender Breakdown */}
        <div className="xl:col-span-3 bg-white border border-slate-200 p-6 flex flex-col h-[320px]">
          <Skeleton.Text className="w-36 h-5 mb-1.5" />
          <Skeleton.Text className="w-48 h-3.5 mb-6" />
          <div className="flex-1 flex flex-col justify-center gap-6">
             <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-end">
                  <Skeleton.Text className="w-16 h-3.5" />
                  <Skeleton.Text className="w-12 h-5" />
                </div>
                <Skeleton.Primitive className="w-full h-2 rounded-none" />
                <Skeleton.Text className="w-8 h-3 ml-auto" />
             </div>
             <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-end">
                  <Skeleton.Text className="w-16 h-3.5" />
                  <Skeleton.Text className="w-12 h-5" />
                </div>
                <Skeleton.Primitive className="w-full h-2 rounded-none" />
                <Skeleton.Text className="w-8 h-3 ml-auto" />
             </div>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="xl:col-span-5 bg-white border border-slate-200 p-6 flex flex-col h-[320px]">
          <Skeleton.Text className="w-52 h-5 mb-1.5" />
          <Skeleton.Text className="w-44 h-3.5 mb-6" />
          <div className="flex-1 w-full min-h-0">
            <Skeleton.Primitive className="w-full h-full rounded-none" />
          </div>
        </div>

        {/* Mortality Analytics */}
        <div className="xl:col-span-4 bg-white border border-slate-200 p-6 flex flex-col h-[320px]">
          <Skeleton.Text className="w-40 h-5 mb-1.5" />
          <Skeleton.Text className="w-36 h-3.5 mb-6" />
          <div className="flex-1 w-full min-h-0">
            <Skeleton.Primitive className="w-full h-full rounded-none" />
          </div>
        </div>
      </div>

       {/* Full Width Grid Bottom (16 Barangays) */}
       <div className="grid grid-cols-1">
         <div className="bg-white border border-slate-200 p-6 flex flex-col">
          <div className="mb-6">
            <Skeleton.Text className="w-64 h-5 mb-1.5" />
            <Skeleton.Text className="w-48 h-3.5" />
          </div>
          <div className="w-full border border-slate-100">
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 w-full">
               {[...Array(16)].map((_, i) => (
                 <div key={i} className="p-3 flex flex-col border-r border-b border-slate-100 aspect-square justify-between bg-slate-50/50">
                    <Skeleton.Text className="w-16 h-3" />
                    <Skeleton.Text className="w-12 h-6 mt-auto" />
                 </div>
               ))}
             </div>
          </div>
        </div>
       </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ setView, onCardNavigate }) => {
  const [selectedBarangay, setSelectedBarangay] = useState('All Barangays');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2024;
    const yearList = ['All Years'];
    for (let y = currentYear; y >= startYear; y--) {
      yearList.push(y.toString());
    }
    return yearList;
  }, []);

  const fetchStats = async () => {
    if (!(window as any).isAuthenticated) return;
    setError(null);
    setLoading(true);
    try {
      const [data, pendingData] = await Promise.all([
        seniorsAPI.getStatistics(selectedBarangay, selectedYear),
        requestsAPI.getPending(1, 1)
      ]);
      
      const accuratePendingCount = pendingData.total || pendingData.data?.length || 0;
      data.pending = accuratePendingCount;

      setStats(data);
    } catch (err: any) {
      if (err.status !== 401) {
        setError('Failed to load analytical data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedBarangay, selectedYear]);

  const data = useMemo(() => {
    if (!stats) return null;
    return {
      totalMembers: stats.total || 0,
      totalDeceased: stats.deceased || 0,
      pendingApps: stats.pending || 0,
      centenarians: stats.centenarians || 0,
      monthlyStats: Array.isArray(stats.monthlyStats) ? stats.monthlyStats.map((item: any) => ({
        name: item.name || '',
        total: (Number(item.male) || 0) + (Number(item.female) || 0),
        male: Number(item.male) || 0,
        female: Number(item.female) || 0,
        deceased: Number(item.deceased) || 0
      })) : [],
      ageRanges: Array.isArray(stats.ageRanges) ? stats.ageRanges : [],
      genders: Array.isArray(stats.genders) ? stats.genders : [],
      topBarangays: Array.isArray(stats.topBarangays) ? stats.topBarangays : [],
      allBarangayStats: Array.isArray(stats.allBarangayStats) ? stats.allBarangayStats : []
    };
  }, [stats]);

  const insights = useMemo(() => {
    if (!data) return null;
    const avgReg = data.monthlyStats.length > 0 
      ? Math.round(data.monthlyStats.reduce((a: number, b: any) => a + b.total, 0) / data.monthlyStats.length) 
      : 0;

    let peakMonth = { name: '', total: 0 };
    data.monthlyStats.forEach((m: any) => { if (m.total > peakMonth.total) peakMonth = m; });
    
    return { avgReg, peakMonth };
  }, [data]);

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-slate-200 bg-white p-8 text-center mt-8">
        <AlertCircle size={40} className="text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Service Disruption</h3>
        <p className="text-sm text-slate-500 mb-6">Unable to retrieve data from the analytical engine.</p>
        <button onClick={fetchStats} className="bg-white border border-slate-200 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  const isDataLoading = loading || !data;
  return (
    <TransitionWrapper isLoading={isDataLoading} skeleton={<DashboardSkeleton />}>
      {!isDataLoading && (
        <div className="space-y-5 pb-16 bg-[#f8fafc] min-h-screen stagger-in">
      
      {/* Utility / Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">OSCA Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">Enterprise Data Warehouse • {selectedBarangay}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 hover:border-slate-300 transition-colors">
            <CalendarIcon size={14} className="text-slate-500" />
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="text-xs font-semibold text-slate-700 outline-none bg-transparent cursor-pointer">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 hover:border-slate-300 transition-colors">
            <MapPin size={14} className="text-slate-500" />
            <select value={selectedBarangay} onChange={(e) => setSelectedBarangay(e.target.value)} className="text-xs font-semibold text-slate-700 outline-none bg-transparent cursor-pointer w-full min-w-[120px]">
              <option value="All Barangays">All Barangays</option>
              {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
          <button onClick={() => alert('Generating PDF Report...')} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors">
            <Download size={14} /> <span className="hidden sm:block">Export</span>
          </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard 
          title="Active Registry" 
          value={formatNumber(data.totalMembers)}
          rawValue={data.totalMembers} 
          icon={Users}
          trend={5.2}
          trendLabel="vs last month"
          statusLabel="Updated Just Now"
          data={data.monthlyStats}
          dataKey="total"
          onClick={() => onCardNavigate?.(ViewType.FINAL_REPORT, 'masterlist')}
        />
        <KPICard 
          title="Pending Verification" 
          value={formatNumber(data.pendingApps)}
          rawValue={data.pendingApps} 
          icon={ClipboardList}
          trend={-1.4}
          trendLabel="clearance rate"
          statusLabel="Requires Action"
          data={data.monthlyStats.slice().reverse()}
          dataKey="total"
          onClick={() => onCardNavigate?.(ViewType.APPROVAL)}
          iconClass="text-amber-500"
          chartColor="#f59e0b"
        />
        <KPICard 
          title="Centenarians" 
          value={formatNumber(data.centenarians)} 
          icon={Award}
          trend={0}
          trendLabel="stable segment"
          statusLabel="Verified DB"
          data={data.monthlyStats.map((d: any, idx: number) => ({ ...d, centenarianTrend: (d.total ? (idx % 3) + 1 : 0) }))}
          dataKey="centenarianTrend"
          onClick={() => onCardNavigate?.(ViewType.FINAL_REPORT, 'centenarians')}
          iconClass="text-purple-500"
          chartColor="#a855f7"
        />
        <KPICard 
          title="Mortality Index" 
          value={formatNumber(data.totalDeceased)} 
          icon={UserX}
          trend={0.8}
          trendLabel="vs historical"
          statusLabel="Synchronized"
          data={data.monthlyStats}
          dataKey="deceased"
          onClick={() => onCardNavigate?.(ViewType.FINAL_REPORT, 'deceased')}
          iconClass="text-rose-500"
          chartColor="#f43f5e"
        />
      </div>

      {/* Asymmetrical Layout - Tier 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Registration Trends (Dominant) */}
        <div className="xl:col-span-8 bg-white border border-slate-200 p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registration Velocity</h3>
              <p className="text-xs text-slate-500 mt-1">
                Peak registration identified in {insights?.peakMonth?.name} with {insights?.peakMonth?.total} new records.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-[2px] bg-systemBlue"></div><span className="text-[10px] font-semibold text-slate-600 uppercase">Total Registrations</span></div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <RechartsTooltip content={<SimpleTooltip />} cursor={{ stroke: '#cbd5e1' }} />
                <ReferenceLine y={insights?.avgReg} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'AVG', fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="total" name="Registrations" stroke="#007aff" strokeWidth={2} fill="#007aff" fillOpacity={0.05} activeDot={{ r: 4, fill: '#007aff', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Population Leaderboard (Supporting) */}
        <div className="xl:col-span-4 bg-white border border-slate-200 flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Barangay Concentration</h3>
            <p className="text-xs text-slate-500 mt-1">Top demographics by volume.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Rank</th>
                  <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Barangay</th>
                  <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Count</th>
                  <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-24">Share</th>
                </tr>
              </thead>
              <tbody>
                {(data.topBarangays || []).map((b: any, i: number) => {
                  const pct = data.totalMembers > 0 ? (b.count / data.totalMembers) * 100 : 0;
                  return (
                    <tr key={b.name} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 text-xs font-semibold text-slate-400">{i + 1}</td>
                      <td className="py-3 px-5 text-xs font-bold text-slate-700">{b.name}</td>
                      <td className="py-3 px-5 text-xs font-semibold text-slate-900 tabular-nums text-right">{formatNumber(b.count)}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-full h-1.5 bg-slate-100 rounded-none overflow-hidden">
                            <div className="h-full bg-systemBlue" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Asymmetrical Layout - Tier 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Gender Breakdown (Dense) */}
        <div className="xl:col-span-3 bg-white border border-slate-200 p-6 flex flex-col h-[320px]">
          <h3 className="text-base font-bold text-slate-900">Gender Distribution</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">Absolute count and relative share.</p>
          
          <div className="flex-1 flex flex-col justify-center">
             {(() => {
                let m = 0, f = 0;
                (data.genders || []).forEach((g:any) => { if(g.name === 'Male') m = g.value; else f = g.value; });
                const t = m + f || 1;
                const mPct = (m / t) * 100;
                const fPct = (f / t) * 100;
                return (
                  <div className="w-full flex flex-col gap-5">
                     <div className="flex flex-col">
                       <div className="flex justify-between items-end mb-1">
                         <span className="text-xs font-semibold text-rose-500 uppercase">Female</span>
                         <span className="text-xl font-bold text-slate-900 tabular-nums">{formatNumber(f)}</span>
                       </div>
                       <div className="w-full h-2 bg-slate-100 rounded-none">
                         <div style={{ width: `${fPct}%` }} className="h-full bg-rose-500"></div>
                       </div>
                       <span className="text-[10px] text-slate-400 font-semibold mt-1 text-right">{fPct.toFixed(1)}%</span>
                     </div>
                     
                     <div className="flex flex-col mt-2">
                       <div className="flex justify-between items-end mb-1">
                         <span className="text-xs font-semibold text-systemBlue uppercase">Male</span>
                         <span className="text-xl font-bold text-slate-900 tabular-nums">{formatNumber(m)}</span>
                       </div>
                       <div className="w-full h-2 bg-slate-100 rounded-none">
                         <div style={{ width: `${mPct}%` }} className="h-full bg-systemBlue"></div>
                       </div>
                       <span className="text-[10px] text-slate-400 font-semibold mt-1 text-right">{mPct.toFixed(1)}%</span>
                     </div>
                  </div>
                );
             })()}
          </div>
        </div>

        {/* Age Distribution */}
        <div className="xl:col-span-5 bg-white border border-slate-200 p-6 flex flex-col h-[320px]">
          <h3 className="text-base font-bold text-slate-900">Demographic Age Brackets</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">Population sorted by age groups.</p>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ageRanges} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <RechartsTooltip content={<SimpleTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" name="Population" fill="#007aff" barSize={24}>
                  {data.ageRanges.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mortality Analytics */}
        <div className="xl:col-span-4 bg-white border border-slate-200 p-6 flex flex-col h-[320px]">
          <h3 className="text-base font-bold text-slate-900">Mortality Variance</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">Historical mortality tracking.</p>
          
          <div className="flex-1 w-full min-h-0">
            {data.totalDeceased === 0 ? (
               <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 border border-slate-100 text-slate-400">
                  <CheckCircle2 size={24} className="mb-2" />
                  <span className="text-xs font-semibold">Zero Variance</span>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <RechartsTooltip content={<SimpleTooltip />} />
                  <Line 
                    type="step" 
                    dataKey="deceased" 
                    name="Deceased"
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    dot={{ r: 2, fill: '#f43f5e', strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: '#f43f5e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Full Width Grid Bottom */}
      <div className="grid grid-cols-1">
        <div className="bg-white rounded-[24px] border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-600 text-white grid place-items-center shadow-sm">
                  <MapPin size={16} strokeWidth={2.5} />
                </div>
                <h3 className="text-[15px] font-extrabold tracking-tight text-slate-900">Geographic Heatmap</h3>
                <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                  {data.allBarangayStats?.length || 0} Barangays
                </span>
              </div>
              <p className="text-[12px] leading-4 text-slate-500 mt-1">Density distribution — darker means denser, lightest is sparsest.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Low</span>
              <div className="h-2 w-28 rounded-full bg-gradient-to-r from-slate-100 via-blue-200 to-blue-600 border border-white shadow-inner" />
              <span className="text-[10px] font-bold tracking-widest text-slate-900 uppercase">High</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-slate-50/40">
            {(data.allBarangayStats || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <p className="text-sm font-semibold text-slate-500">No barangay data yet.</p>
                <p className="text-xs text-slate-400 mt-1">Records will appear here once registrations are approved.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {(data.allBarangayStats || []).map((brgy: any, idx: number) => {
                  const intensity = Math.max(0, Math.min(1, brgy.intensity || 0));
                  const tier = intensity > 0.66 ? 'high' : intensity > 0.32 ? 'mid' : 'low';
                  return (
                    <div
                      key={brgy.name}
                      className={`group relative rounded-2xl border p-4 flex flex-col justify-between min-h-[116px] overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 ${
                        tier === 'high'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : tier === 'mid'
                          ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`inline-flex items-center rounded-md border px-1.5 py-1 text-[10px] font-black tracking-widest leading-none ${
                          tier === 'low' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/15 border-white/20 text-white'
                        }`}>
                          #{idx + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-1 rounded-md ${tier === 'low' ? 'bg-slate-50 text-slate-400 border border-slate-200' : 'bg-white/10 text-white/80 border border-white/15'}`}>
                          {brgy.count > 500 ? 'Dense' : brgy.count > 200 ? 'Mid' : 'Sparse'}
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className={`text-[11px] font-extrabold leading-tight line-clamp-2 uppercase tracking-wide ${tier === 'low' ? 'text-slate-600' : 'text-white/90'}`}>
                          {brgy.name}
                        </p>
                        <p className={`mt-2 text-[22px] font-black tracking-tight leading-none tabular-nums ${tier === 'low' ? 'text-slate-900' : 'text-white'}`}>
                          {formatNumber(brgy.count || 0)}
                        </p>
                        <p className={`text-[10px] font-semibold mt-0.5 ${tier === 'low' ? 'text-slate-400' : 'text-white/65'}`}>
                          {(intensity * 100).toFixed(0)}% density
                        </p>
                      </div>

                      <div className={`absolute bottom-0 left-0 right-0 h-1 ${tier === 'low' ? 'bg-slate-100' : 'bg-white/15'}`}>
                        <div
                          className={`h-full transition-all duration-700 ${tier === 'high' ? 'bg-white' : tier === 'mid' ? 'bg-white/85' : 'bg-blue-500'}`}
                          style={{ width: `${Math.max(8, intensity * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 sm:px-8 py-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <span className="font-medium">16 barangays • Sorted by population • Tap a tile for barangay filter (coming soon)</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" /> Most dense: {(data.allBarangayStats?.[0]?.name || '—')} ({formatNumber(data.allBarangayStats?.[0]?.count || 0)})
            </span>
          </div>
        </div>
      </div>

    </div>
      )}
    </TransitionWrapper>
  );
};

export default Dashboard;
