
import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  Clock,
  MapPin
} from 'lucide-react';
import { BARANGAYS } from '../types';
import { seniorsAPI, reportsAPI } from '../services/api';
import { TableSkeleton } from './SkeletonLoader';

interface ReportViewProps {
    notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    setGlobalLoading?: (loading: boolean) => void;
    initialSection?: 'masterlist' | 'centenarians' | 'deceased';
}

const ReportView: React.FC<ReportViewProps> = ({ notify, setGlobalLoading, initialSection = 'masterlist' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedBrgy, setSelectedBrgy] = useState('All Barangays');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [seniorsData, setSeniorsData] = useState<any[]>([]);
  const [centenariansData, setCentenariansData] = useState<any[]>([]);
  const [deceasedData, setDeceasedData] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'masterlist' | 'centenarians' | 'deceased'>(initialSection);
  const itemsPerPage = 8;

  // Fetch report data from API with pagination and filtering
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [masterlistResponse, allActiveResponse, deceasedResponse] = await Promise.all([
          seniorsAPI.getAll({
            barangay: selectedBrgy === 'All Barangays' ? undefined : selectedBrgy,
            page,
            per_page: itemsPerPage,
          }),
          seniorsAPI.getAll({
            barangay: selectedBrgy === 'All Barangays' ? undefined : selectedBrgy,
            per_page: -1,
          }),
          seniorsAPI.getDeceased(),
        ]);

        const masterlistData = masterlistResponse?.data
          ? masterlistResponse.data
          : Array.isArray(masterlistResponse)
            ? masterlistResponse
            : [];

        const allActiveData = allActiveResponse?.data
          ? allActiveResponse.data
          : Array.isArray(allActiveResponse)
            ? allActiveResponse
            : [];

        const allDeceasedData = deceasedResponse?.data
          ? deceasedResponse.data
          : Array.isArray(deceasedResponse)
            ? deceasedResponse
            : [];

        setSeniorsData(masterlistData);
        setTotalPages(masterlistResponse?.last_page || 1);
        setCentenariansData(allActiveData.filter((item: any) => Number(item.age || 0) >= 100));
        setDeceasedData(
          selectedBrgy === 'All Barangays'
            ? allDeceasedData
            : allDeceasedData.filter((item: any) => item.barangay === selectedBrgy)
        );
      } catch (error) {
        console.error('Failed to load report data:', error);
        notify('Unable to load report data right now. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedBrgy, page]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

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
      console.error('Failed to export report:', error);
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
          <h2 className="ios-page-title uppercase">Excel Final Report</h2>
          <p className="ios-page-subtitle">Audited batch reporting for OSCA.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExcelExport}
            disabled={isExporting}
            className={`ios-btn-success px-4 sm:px-8 py-3 text-sm font-black flex items-center justify-center gap-3 w-full sm:w-auto ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          <div className="top-0 z-10 w-fit max-w-full bg-white/90 backdrop-blur-ios rounded-2xl border border-slate-200 p-3 inline-flex flex-wrap items-center gap-2 shadow-ios">
            <button
              type="button"
              onClick={() => setActiveSection('masterlist')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeSection === 'masterlist'
                  ? 'bg-systemBlue text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-blue-900 hover:border-blue-200'
              }`}
            >
              Masterlist
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('centenarians')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeSection === 'centenarians'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-purple-700 hover:border-purple-200'
              }`}
            >
              Living Centenarians
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('deceased')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeSection === 'deceased'
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Deceased Seniors
            </button>
          </div>

          {activeSection === 'masterlist' && (
          <div className="ios-section border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-systemBlue/10 text-systemBlue rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Masterlist Preview</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section 1 of 3</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
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
              <table className="ios-table">
                <thead className="sticky top-0 z-[2]">
                  <tr>
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">Address</th>
                    <th className="px-8 py-4 text-center">Sex</th>
                    <th className="px-8 py-4 text-center">Birthday</th>
                    <th className="px-8 py-4 text-center">Age</th>
                    <th className="px-8 py-4 text-center">OSCA ID</th>
                    <th className="px-8 py-4 text-center">RRN No</th>
                    <th className="px-8 py-4 text-center">Pension</th>
                  </tr>
                </thead>
                <tbody>
                  {seniorsData.length > 0 ? (
                    seniorsData.map((item) => (
                      <tr key={item.id}>
                        <td className="px-8 py-5">
                          <p className="text-base font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px]">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center">
                          <span className="text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</span>
                        </td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-bold text-slate-900">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center">
                           <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                             {item.pensionStatus || 'None'}
                           </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-8 py-20 text-center text-sm font-semibold text-slate-400 uppercase tracking-widest">
                        No masterlist records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
          )}

          {activeSection === 'centenarians' && (
          <div className="ios-section border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/10 text-purple-600 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Living Centenarians (100+)</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section 2 of 3</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <select
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); }}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                  >
                    <option>All Barangays</option>
                    {BARANGAYS.map(b => (
                      <option key={`cent-${b}`} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                  Total: {centenariansData.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="ios-table">
                <thead className="sticky top-0 z-[2]">
                  <tr>
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">Address</th>
                    <th className="px-8 py-4 text-center">Sex</th>
                    <th className="px-8 py-4 text-center">Birthday</th>
                    <th className="px-8 py-4 text-center">Age</th>
                    <th className="px-8 py-4 text-center">OSCA ID</th>
                    <th className="px-8 py-4 text-center">RRN No</th>
                    <th className="px-8 py-4 text-center">Pension</th>
                  </tr>
                </thead>
                <tbody>
                  {centenariansData.length > 0 ? (
                    centenariansData.map((item) => (
                      <tr key={`cent-${item.id}`}>
                        <td className="px-8 py-5">
                          <p className="text-base font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px]">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-black text-purple-700">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center">
                           <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                             {item.pensionStatus || 'None'}
                           </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-8 py-20 text-center text-sm font-semibold text-slate-400 uppercase tracking-widest">
                        No living centenarians found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {activeSection === 'deceased' && (
          <div className="ios-section border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700/10 text-slate-700 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Deceased Seniors</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section 3 of 3</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <select
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); }}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                  >
                    <option>All Barangays</option>
                    {BARANGAYS.map(b => (
                      <option key={`dec-${b}`} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  Total: {deceasedData.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="ios-table">
                <thead className="sticky top-0 z-[2]">
                  <tr>
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">Address</th>
                    <th className="px-8 py-4 text-center">Sex</th>
                    <th className="px-8 py-4 text-center">Birthday</th>
                    <th className="px-8 py-4 text-center">Age</th>
                    <th className="px-8 py-4 text-center">OSCA ID</th>
                    <th className="px-8 py-4 text-center">RRN No</th>
                    <th className="px-8 py-4 text-center">Pension</th>
                  </tr>
                </thead>
                <tbody>
                  {deceasedData.length > 0 ? (
                    deceasedData.map((item) => (
                      <tr key={`dec-${item.id}`}>
                        <td className="px-8 py-5">
                          <p className="text-base font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px]">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-bold text-slate-900">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center">
                           <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                             {item.pensionStatus || 'None'}
                           </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-8 py-20 text-center text-sm font-semibold text-slate-400 uppercase tracking-widest">
                        No deceased records found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportView;
