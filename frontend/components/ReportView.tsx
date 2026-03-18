
import React, { useRef, useState, useEffect } from 'react';
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
  const masterlistRef = useRef<HTMLDivElement | null>(null);
  const centenariansRef = useRef<HTMLDivElement | null>(null);
  const deceasedRef = useRef<HTMLDivElement | null>(null);

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
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedBrgy, page]);

  useEffect(() => {
    setActiveSection(initialSection);
    const targetRef =
      initialSection === 'centenarians'
        ? centenariansRef
        : initialSection === 'deceased'
          ? deceasedRef
          : masterlistRef;

    setTimeout(() => {
      targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, [initialSection, loading]);

  const displayedData = seniorsData;

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
          <div className="sticky top-0 z-10 w-fit max-w-full bg-slate-50/95 backdrop-blur-sm rounded-2xl border border-slate-200 p-3 inline-flex flex-wrap items-center gap-2 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setActiveSection('masterlist');
                masterlistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeSection === 'masterlist'
                  ? 'bg-blue-900 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-blue-900 hover:border-blue-200'
              }`}
            >
              Masterlist
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSection('centenarians');
                centenariansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
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
              onClick={() => {
                setActiveSection('deceased');
                deceasedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeSection === 'deceased'
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Deceased Seniors
            </button>
          </div>

          <div ref={masterlistRef} className="bg-white rounded-[2rem] border-2 border-blue-100 shadow-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-700 via-blue-500 to-blue-300" />
            <div className="p-8 border-b border-blue-100 flex items-center justify-between bg-blue-50/40">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-blue-900" />
                <div>
                  <h3 className="font-bold text-slate-800">Masterlist Preview</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Section 1 of 3</p>
                </div>
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
            
            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-[2]">
                  <tr className="bg-white text-slate-400 uppercase text-xs font-black tracking-[0.2em] border-b border-slate-50">
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">Address</th>
                    <th className="px-8 py-4">Sex</th>
                    <th className="px-8 py-4">Birthday</th>
                    <th className="px-8 py-4">Age</th>
                    <th className="px-8 py-4">OSCA ID</th>
                    <th className="px-8 py-4">RRN No</th>
                    <th className="px-8 py-4">Pension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedData.length > 0 ? (
                    displayedData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-lg font-bold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{item.barangay || '-'}</p>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</span>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.pensionStatus || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-8 py-8 text-center text-sm font-semibold text-slate-400">
                        No masterlist records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-blue-50/40 border-t border-blue-100 flex items-center justify-between">
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

          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Centenarians</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div ref={centenariansRef} className="bg-white rounded-[2rem] border-2 border-purple-100 shadow-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-purple-700 via-purple-500 to-purple-300" />
            <div className="p-8 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-purple-700" />
                <div>
                  <h3 className="font-bold text-slate-800">Living Centenarians (100+)</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-700">Section 2 of 3</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-purple-200">
                  <MapPin size={14} className="text-purple-700" />
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
                <span className="text-xs font-black uppercase tracking-widest text-purple-700 bg-white px-3 py-1 rounded-lg border border-purple-100">
                  Total: {centenariansData.length}
                </span>
              </div>
            </div>

            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-[2]">
                  <tr className="bg-white text-slate-400 uppercase text-xs font-black tracking-[0.2em] border-b border-slate-50">
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">Address</th>
                    <th className="px-8 py-4">Sex</th>
                    <th className="px-8 py-4">Birthday</th>
                    <th className="px-8 py-4">Age</th>
                    <th className="px-8 py-4">OSCA ID</th>
                    <th className="px-8 py-4">RRN No</th>
                    <th className="px-8 py-4">Pension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {centenariansData.length > 0 ? (
                    centenariansData.map((item) => (
                      <tr key={`cent-${item.id}`} className="hover:bg-purple-50/30 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-lg font-bold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{item.barangay || '-'}</p>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-sm font-black text-purple-700">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.pensionStatus || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-8 py-8 text-center text-sm font-semibold text-slate-400">
                        No living centenarians found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deceased</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div ref={deceasedRef} className="bg-white rounded-[2rem] border-2 border-slate-300 shadow-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-slate-800 via-slate-600 to-slate-400" />
            <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-slate-100/70">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-slate-700" />
                <div>
                  <h3 className="font-bold text-slate-800">Deceased Seniors</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Section 3 of 3</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300">
                  <MapPin size={14} className="text-slate-700" />
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
                <span className="text-xs font-black uppercase tracking-widest text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200">
                  Total: {deceasedData.length}
                </span>
              </div>
            </div>

            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-[2]">
                  <tr className="bg-white text-slate-400 uppercase text-xs font-black tracking-[0.2em] border-b border-slate-50">
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">Address</th>
                    <th className="px-8 py-4">Sex</th>
                    <th className="px-8 py-4">Birthday</th>
                    <th className="px-8 py-4">Age</th>
                    <th className="px-8 py-4">OSCA ID</th>
                    <th className="px-8 py-4">RRN No</th>
                    <th className="px-8 py-4">Pension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {deceasedData.length > 0 ? (
                    deceasedData.map((item) => (
                      <tr key={`dec-${item.id}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-lg font-bold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{item.barangay || '-'}</p>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.pensionStatus || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-8 py-8 text-center text-sm font-semibold text-slate-400">
                        No deceased records found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
