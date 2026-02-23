
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  Clock,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { BARANGAYS } from '../types';
import { seniorsAPI, reportsAPI } from '../services/api';
import { TableSkeleton } from './SkeletonLoader';

interface ReportViewProps {
    notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    setGlobalLoading?: (loading: boolean) => void;
}

const ReportView: React.FC<ReportViewProps> = ({ notify, setGlobalLoading }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [selectedBrgy, setSelectedBrgy] = useState('All Barangays');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [seniorsData, setSeniorsData] = useState<any[]>([]);
  const itemsPerPage = 8;

  // Fetch real data from API with pagination and filtering
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await seniorsAPI.getAll({
          barangay: selectedBrgy === 'All Barangays' ? undefined : selectedBrgy,
          page: page,
          per_page: itemsPerPage
        });
        
        if (response && response.data) {
          setSeniorsData(response.data);
          setTotalPages(response.last_page || 1);
        } else {
          setSeniorsData(Array.isArray(response) ? response : []);
          setTotalPages(1);
        }
      } catch (error) {
        console.warn('API fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedBrgy, page]);

  const displayedData = seniorsData;

  const handleExcelExport = () => {
    setIsExporting(true);
    if (setGlobalLoading) setGlobalLoading(true);
    notify('Preparing your Excel report. Please wait...', 'info');
    
    try {
      // Get the download URL with authentication token and filters
      const url = reportsAPI.getSeniorCitizensReportUrl({ 
        barangay: selectedBrgy === 'All Barangays' ? undefined : selectedBrgy 
      });
      
      // Trigger download using window.location.href for better reliability than window.open
      // This won't open a new tab and will trigger the download headers immediately.
      window.location.href = url;
      
      notify(`Final Report for ${selectedBrgy} is being downloaded.`, 'success');
      
      // Reset the generating state after a short delay since location.href doesn't block
      setTimeout(() => {
        setIsExporting(false);
        if (setGlobalLoading) setGlobalLoading(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to generate report:', error);
      notify('Failed to generate report. Please try again.', 'error');
      setIsExporting(false);
      if (setGlobalLoading) setGlobalLoading(false);
    }
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-8 pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Excel Final Report</h2>
          <p className="text-slate-500 font-medium">Audited batch reporting for OSCA.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExcelExport}
            disabled={isExporting}
            className={`px-4 sm:px-8 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 w-full sm:w-auto ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isExporting ? <Clock className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
            <span className="hidden sm:inline">
              {isExporting ? 'GENERATING REPORT...' : 'GENERATE EXCEL REPORT'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="w-full space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-blue-900" />
                <h3 className="font-bold text-slate-800">Submission Preview</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <MapPin size={14} className="text-blue-900" />
                  <select 
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); }}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                  >
                    <option>All Barangays</option>
                    {BARANGAYS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white text-slate-400 uppercase text-xs font-black tracking-[0.2em] border-b border-slate-50">
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">Gender</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Barangay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-lg font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-400 font-medium">ID: {item.id}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-semibold text-slate-600">{(item as any).sex || item.gender}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                          item.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                          item.status === 'Deceased' ? 'bg-slate-100 text-slate-500' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-slate-500">{item.barangay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
