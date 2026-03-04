
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
import { Users, TrendingUp, Skull, IdCard, MapPin, Grid, ClipboardList, Award, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { ViewType, BARANGAYS } from '../types';
import { seniorsAPI } from '../services/api';
import { DashboardSkeleton } from './SkeletonLoader';

interface DashboardProps {
  setView?: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
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
      const data = await seniorsAPI.getStatistics(selectedBarangay, selectedYear);
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
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm mt-8">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <Skull size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Connectivity issue detected</h3>
        <p className="text-slate-500 max-w-sm mb-8 font-medium leading-relaxed">We're having trouble reaching the OSCA server. Please verify your connection and try again.</p>
        <button 
          onClick={() => fetchStats(() => false)}
          className="group relative px-8 py-4 bg-blue-900 text-white rounded-2xl font-black hover:bg-blue-800 transition-all shadow-xl shadow-blue-100 flex items-center gap-3 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <TrendingUp size={20} className="relative z-10" />
          <span className="relative z-10">Retry Connection</span>
        </button>
      </div>
    );
  }

  if (initialLoading || !dashboardData) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-16">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            OSCA <span className="text-blue-900">Dashboard</span>
          </h2>
          <p className="text-slate-500 font-medium mt-1">Monitoring {selectedBarangay} Senior Citizen Analytics.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <CalendarIcon size={20} className="text-blue-900" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer min-w-[80px]"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            {refreshing ? (
              <div className="w-5 h-5 border-2 border-blue-200 rounded-full border-t-blue-600 animate-spin shrink-0"></div>
            ) : (
              <MapPin size={20} className="text-blue-900" />
            )}
            <select 
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer w-full min-w-[150px]"
            >
              <option value="All Barangays">All Barangays</option>
              {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <button 
            onClick={() => setView && setView(ViewType.ADD_MEMBER)}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-900 rounded-2xl text-sm font-black text-white hover:bg-blue-800 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
          >
            <IdCard size={20} />
            <span className="whitespace-nowrap">New Registration</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Members */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl"><Users size={24} /></div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
              <TrendingUp size={14} /> 8%
            </div>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Members</p>
          <h3 className={`text-3xl font-black text-slate-900 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>{dashboardData.totalMembers.toLocaleString()}</h3>
        </div>

        {/* Pending Applications (Action Item) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ClipboardList size={24} /></div>
            <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
              Action Required
            </div>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Pending Applications</p>
          <h3 className={`text-3xl font-black text-slate-900 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>{dashboardData.pendingApps.toLocaleString()}</h3>
        </div>

        {/* Living Centenarians (VIP Group) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Award size={24} /></div>
            <div className="flex items-center gap-1 text-purple-600 font-bold text-xs">VIP Status</div>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Living Centenarians (100+)</p>
          <h3 className={`text-3xl font-black text-slate-900 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>{dashboardData.centenarians.toLocaleString()}</h3>
        </div>

        {/* Total Deceased */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Skull size={24} /></div>
            <div className="flex items-center gap-1 text-rose-600 font-bold text-xs">Audit Active</div>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Deceased</p>
          <h3 className={`text-3xl font-black text-slate-900 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>{dashboardData.totalDeceased.toLocaleString()}</h3>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
        {/* Registration Chart */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 pb-4 md:pb-6 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Monthly Registration</h3>
              <p className="text-sm text-slate-500">Intake analysis for the year {selectedYear}.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-900"></div> <span className="text-[10px] font-black uppercase text-slate-400">Male</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> <span className="text-[10px] font-black uppercase text-slate-400">Female</span></div>
            </div>
          </div>
          <div className="h-[300px] w-full min-h-[300px] relative">
            <ResponsiveContainer width="99%" height={300}>
              <AreaChart data={safeMonthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/><stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#eab308" stopOpacity={0.1}/><stop offset="95%" stopColor="#eab308" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="male" name="Male" stroke="#1e3a8a" strokeWidth={4} fillOpacity={0.6} fill="url(#colorM)" animationDuration={800} animationEasing="ease-out" />
                <Area type="monotone" dataKey="female" name="Female" stroke="#eab308" strokeWidth={4} fillOpacity={0.4} fill="url(#colorF)" animationDuration={800} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Breakdown */}
        <div className="bg-white p-6 md:p-8 pb-4 md:pb-6 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-900 mb-6">Gender Split</h3>
          <div className="flex-grow min-h-[250px] w-full relative h-[250px]">
            <ResponsiveContainer width="99%" height={250}>
              <PieChart>
                <Pie
                  data={dashboardData.genders || []}
                  cx="50%" cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#1e3a8a" />
                  <Cell fill="#eab308" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-6">
            {(dashboardData.genders || []).map((g, i) => (
              <div key={g.name || i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-blue-900' : 'bg-amber-500'}`}></div>
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
                    className="absolute inset-0 bg-blue-900 transition-all duration-500"
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
