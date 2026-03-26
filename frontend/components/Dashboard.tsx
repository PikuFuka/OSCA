
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Line,
  LineChart,
} from 'recharts';
import { Users, TrendingUp, UserX, IdCard, MapPin, Grid, ClipboardList, Award, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { ViewType, BARANGAYS } from '../types';
import { seniorsAPI } from '../services/api';
import { DashboardSkeleton } from './SkeletonLoader';

interface DashboardProps {
  setView?: (view: ViewType) => void;
  onCardNavigate?: (view: ViewType, reportSection?: 'masterlist' | 'centenarians' | 'deceased') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView, onCardNavigate }) => {
  const [selectedBarangay, setSelectedBarangay] = useState('All Barangays');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [stats, setStats] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate years list (from 2024 to current)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2024;
    const yearList = ['All Years'];
    for (let y = currentYear; y >= startYear; y--) {
      yearList.push(y.toString());
    }
    return yearList;
  }, []);

  // Fetch statistics from API
  const fetchStats = async (isCancelled: () => boolean) => {
    // Skip if not authenticated to avoid 401 on login screen background
    if (!(window as any).isAuthenticated) return;
    
    setError(null);
    // Only show full spinner on first load; subsequent changes show inline indicator
    if (!stats) setInitialLoading(true);
    else setRefreshing(true);
    try {
      const data = await seniorsAPI.getStatistics(selectedBarangay, selectedYear, { fresh: true });
      if (!isCancelled()) setStats(data);
    } catch (err: any) {
      if (!isCancelled()) {
        if (err.status === 401) return; // AuthProvider handles logout
        setError('Failed to load dashboard data. Please try again.');
        console.error('Stats fetch error:', err);
      }
    } finally {
      if (!isCancelled()) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchStats(() => cancelled);
    return () => { cancelled = true; };
  }, [selectedBarangay, selectedYear]);


  const dashboardData = useMemo(() => {
    if (!stats) return null;

    return {
      totalMembers: stats.total || 0,
      totalDeceased: stats.deceased || 0,
      pendingApps: stats.pending || 0,
      centenarians: stats.centenarians || 0,
      monthlyStats: Array.isArray(stats.monthlyStats) ? stats.monthlyStats : [],
      ageRanges: Array.isArray(stats.ageRanges) ? stats.ageRanges : [],
      genders: Array.isArray(stats.genders) ? stats.genders : [],
      topBarangays: Array.isArray(stats.topBarangays) ? stats.topBarangays : [],
      allBarangayStats: Array.isArray(stats.allBarangayStats) ? stats.allBarangayStats : (Array.isArray(stats.topBarangays) ? stats.topBarangays : [])
    };
  }, [stats]);

  // Ensure charts always have an array even if something weird happens
  const safeMonthlyStats = useMemo(() => {
    if (!dashboardData?.monthlyStats) return [];
    
    // Create a safe, standardized copy of the monthly stats
    return dashboardData.monthlyStats.map(item => ({
      ...item,
      // Ensure all keys exist for robust chart rendering, even if 0
      name: item.name || '',
      male: Number(item.male) || 0,
      female: Number(item.female) || 0,
      deceased: Number(item.deceased) || 0
    }));
  }, [dashboardData]);

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center ios-card mt-8 shadow-ios-lg">
        <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-ios flex items-center justify-center mb-6">
          <UserX size={40} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Connectivity issue detected</h3>
        <p className="text-slate-500 max-w-sm mb-8 font-medium leading-relaxed">We're having trouble reaching the OSCA server. Please verify your connection and try again.</p>
        <button 
          onClick={() => fetchStats(() => false)}
          className="ios-btn-primary px-10 py-4 flex items-center gap-3"
        >
          <TrendingUp size={20} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  if (initialLoading || !dashboardData) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 md:space-y-10 pb-16">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
            OSCA <span className="text-systemBlue">Analytics</span>
          </h2>
          <p className="text-slate-500 font-semibold uppercase tracking-widest text-[10px] mt-2">Monitoring {selectedBarangay} activity</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 bg-white/85 px-4 py-2.5 rounded-ios border border-slate-200 backdrop-blur-md focus-within:border-systemBlue/50 transition-all">
            <CalendarIcon size={18} className="text-systemBlue" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer min-w-[80px]"
            >
              {years.map(y => <option key={y} value={y} className="bg-systemGray-100">{y}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-white/85 px-4 py-2.5 rounded-ios border border-slate-200 backdrop-blur-md focus-within:border-systemBlue/50 transition-all">
            {refreshing ? (
              <div className="w-4 h-4 border-2 border-slate-300 rounded-full border-t-systemBlue animate-spin shrink-0"></div>
            ) : (
              <MapPin size={18} className="text-systemBlue" />
            )}
            <select 
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer w-full min-w-[140px]"
            >
              <option value="All Barangays" className="bg-systemGray-100">All Barangays</option>
              {BARANGAYS.map(b => <option key={b} value={b} className="bg-systemGray-100">{b}</option>)}
            </select>
          </div>

          <button 
            onClick={() => setView && setView(ViewType.ADD_MEMBER)}
            className="ios-btn-primary px-5 py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <IdCard size={18} />
            <span className="whitespace-nowrap">New Entry</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Total Members */}
        <button
          type="button"
          onClick={() => onCardNavigate?.(ViewType.FINAL_REPORT, 'masterlist')}
          className="ios-card p-6 flex flex-col gap-4 text-left group hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-systemBlue/20 text-systemBlue rounded-ios flex items-center justify-center"><Users size={24} /></div>
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <TrendingUp size={12} /> 8%
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Members</p>
            <h3 className={`text-4xl font-bold text-slate-900 tabular-nums transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>{dashboardData.totalMembers.toLocaleString()}</h3>
          </div>
        </button>

        {/* Pending Applications */}
        <button
          type="button"
          onClick={() => onCardNavigate?.(ViewType.APPROVAL)}
          className="ios-card p-6 flex flex-col gap-4 text-left group hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-ios flex items-center justify-center"><ClipboardList size={24} /></div>
            <div className={`flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              dashboardData.pendingApps > 0 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {dashboardData.pendingApps > 0 ? 'Review Needed' : 'Completed'}
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Queue Size</p>
            <h3 className={`text-4xl font-bold text-slate-900 tabular-nums transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>{dashboardData.pendingApps.toLocaleString()}</h3>
          </div>
        </button>

        {/* Living Centenarians */}
        <button
          type="button"
          onClick={() => onCardNavigate?.(ViewType.FINAL_REPORT, 'centenarians')}
          className="ios-card p-6 flex flex-col gap-4 text-left group hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-ios flex items-center justify-center"><Award size={24} /></div>
            <div className="flex items-center gap-1 text-purple-400 font-bold text-[10px] uppercase tracking-wider bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">Legacy</div>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Centenarians</p>
            <h3 className={`text-4xl font-bold text-slate-900 tabular-nums transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>{dashboardData.centenarians.toLocaleString()}</h3>
          </div>
        </button>

        {/* Total Deceased */}
        <button
          type="button"
          onClick={() => onCardNavigate?.(ViewType.FINAL_REPORT, 'deceased')}
          className="ios-card p-6 flex flex-col gap-4 text-left group hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-ios flex items-center justify-center"><UserX size={24} /></div>
            <div className="flex items-center gap-1 text-slate-500 font-bold text-[10px] uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Archives</div>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Deceased</p>
            <h3 className={`text-4xl font-bold text-slate-900 tabular-nums transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>{dashboardData.totalDeceased.toLocaleString()}</h3>
          </div>
        </button>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
        {/* Registration Chart */}
        <div className="lg:col-span-2 ios-card p-6 md:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Registration Trends</h3>
              <p className="text-sm text-slate-500 mt-1">Activity breakdown for {selectedYear}</p>
            </div>
            <div className="flex items-center gap-6 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-systemBlue"></div> <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Male</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Female</span></div>
            </div>
          </div>
          <div className="h-[320px] w-full relative">
            <ResponsiveContainer width="99%" height={320}>
              <AreaChart data={safeMonthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#007aff" stopOpacity={0.2}/><stop offset="95%" stopColor="#007aff" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/><stop offset="95%" stopColor="#eab308" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.24)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(100,116,139,0.85)', fontSize: 11}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(100,116,139,0.85)', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(28,28,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(20px)', color: '#fff' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="male" name="Male" stroke="#007aff" strokeWidth={4} fillOpacity={1} fill="url(#colorM)" animationDuration={1000} />
                <Area type="monotone" dataKey="female" name="Female" stroke="#eab308" strokeWidth={4} fillOpacity={1} fill="url(#colorF)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Breakdown */}
        <div className="ios-card p-6 md:p-10 flex flex-col">
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Gender Split</h3>
          <p className="text-sm text-slate-500 mb-8 lowercase italic">Demographic distribution</p>
          <div className="flex-grow min-h-[250px] w-full relative h-[280px]">
            <ResponsiveContainer width="99%" height={280}>
              <PieChart>
                <Pie
                  data={dashboardData.genders || []}
                  cx="50%" cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={10}
                  dataKey="value"
                  animationDuration={1200}
                >
                  <Cell fill="#007aff" stroke="none" />
                  <Cell fill="#eab308" stroke="none" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(20px)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-6">
            {(dashboardData.genders || []).map((g, i) => (
              <div key={g.name || i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-systemBlue' : 'bg-amber-500'}`}></div>
                  <span className="text-sm font-bold text-slate-600">{g.name}</span>
                </div>
                <span className="text-base font-black text-slate-900">{(g.value || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
        {/* Age Ranges Bar Chart */}
        <div className="bg-white p-6 md:p-8 pb-4 md:pb-6 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-10">Age Group Distribution</h3>
          <div className="h-[300px] w-full min-h-[300px] relative">
            <ResponsiveContainer width="99%" height={300}>
              <BarChart data={dashboardData.ageRanges || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '15px', border: 'none' }} />
                <Bar dataKey="count" fill="#1e3a8a" radius={[10, 10, 0, 0]} barSize={40} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deceased Chart */}
        <div className="bg-white p-6 md:p-8 pb-4 md:pb-6 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900">Monthly Mortality</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Status audit for the year {selectedYear}.</p>
            </div>
            <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">System Audit</span>
          </div>
          <div className="h-[300px] w-full min-h-[300px] relative">
            <ResponsiveContainer width="99%" height={300}>
              <LineChart data={safeMonthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none' }} />
                <Line 
                  type="monotone" 
                  dataKey="deceased" 
                  stroke="#ef4444" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#fff', stroke: '#ef4444', strokeWidth: 3 }}
                  activeDot={{ r: 8 }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
        {/* Barangay Heatmap (Replaces Pension Coverage) */}
        <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Barangay Density Heatmap</h3>
              <p className="text-sm text-slate-500">Geographic concentration of senior citizens for resource planning.</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-900 rounded-xl shrink-0">
              <Grid size={24} />
            </div>
          </div>
          
          <div className="h-[300px] overflow-y-auto pr-2 no-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(dashboardData.allBarangayStats || []).map((brgy) => (
                <div 
                  key={brgy.name} 
                  className="relative group overflow-hidden rounded-xl border border-slate-100 hover:border-blue-200 transition-all duration-300"
                  style={{ minHeight: '80px' }}
                >
                  {/* Background intensity layer */}
                  <div 
                    className="absolute inset-0 bg-systemBlue transition-all duration-500"
                    style={{ opacity: 0.05 + ((brgy.intensity || 0) * 0.95) }}
                  ></div>
                  
                  <div className="relative z-10 h-full p-4 flex flex-col justify-between">
                    <span className={`text-2xl font-black tracking-tight ${(brgy.intensity || 0) > 0.6 ? 'text-white' : 'text-blue-900'}`}>
                      {(brgy.count || 0).toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest truncate ${(brgy.intensity || 0) > 0.6 ? 'text-blue-100' : 'text-slate-500'}`}>
                      {brgy.name}
                    </span>
                  </div>
                  
                  {/* Hover tooltip effect */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-20"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 justify-end">
            <span>Low Density</span>
            <div className="w-20 h-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-900"></div>
            <span>High Density</span>
          </div>
        </div>

        {/* Top Barangays Bar Chart */}
        <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900">Population Density</h3>
            <p className="text-sm text-slate-500">Top 5 Barangays with highest senior population.</p>
          </div>
          <div className="h-[300px] w-full min-h-[300px] relative">
            <ResponsiveContainer width="99%" height={300}>
              <BarChart 
                layout="vertical" 
                data={dashboardData.topBarangays || []} 
                margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={90} 
                  tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '15px', border: 'none' }} />
                <Bar dataKey="count" fill="#1e3a8a" radius={[0, 10, 10, 0]} barSize={30} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
