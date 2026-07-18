import React, { useState, useMemo, useEffect } from 'react';
import TransitionWrapper from './TransitionWrapper';
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
import { DashboardSkeleton } from './SkeletonLoader';

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
        seniorsAPI.getStatistics(selectedBarangay, selectedYear, { fresh: true }),
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
          data={data.monthlyStats.map((d:any) => ({...d, val: Math.random()}))}
          dataKey="val"
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
         {/* Geographic Density Grid */}
         <div className="bg-white border border-slate-200 p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">Geographic Heatmap Matrix</h3>
            <p className="text-xs text-slate-500 mt-1">Density distribution across municipal barangays.</p>
          </div>
          
          <div className="w-full border border-slate-100">
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 w-full">
               {(data.allBarangayStats || []).map((brgy: any) => (
                 <div 
                   key={brgy.name} 
                   className="p-3 flex flex-col border-r border-b border-white/50 aspect-square justify-between"
                   style={{ backgroundColor: `rgba(0, 122, 255, ${0.05 + (brgy.intensity || 0) * 0.95})` }}
                 >
                   <span className={`text-xs font-bold leading-tight line-clamp-2 uppercase tracking-wide ${(brgy.intensity || 0) > 0.4 ? 'text-white/90' : 'text-slate-600'}`}>
                     {brgy.name}
                   </span>
                   <span className={`text-lg font-black tracking-tight leading-none ${(brgy.intensity || 0) > 0.4 ? 'text-white' : 'text-slate-900'}`}>
                     {formatNumber(brgy.count || 0)}
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

    </div>
      )}
    </TransitionWrapper>
  );
};

export default Dashboard;
