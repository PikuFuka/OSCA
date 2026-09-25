
import React, { useState, useEffect } from 'react';
import TransitionWrapper from './TransitionWrapper';
import { createPortal } from 'react-dom';
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
import Skeleton from './Skeleton';
import { ReportSkeleton } from './skeletons';
import { TableAvatar, CategoryPill, EmptyTableRow, TablePagination, scrollMainToTop } from './Table';
interface ReportViewProps {
    notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    setGlobalLoading?: (loading: boolean) => void;
    initialSection?: 'masterlist' | 'centenarians' | 'deceased' | 'newly-registered';
}

const ReportView: React.FC<ReportViewProps> = ({ notify, setGlobalLoading, initialSection = 'masterlist' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedBrgy, setSelectedBrgy] = useState('All Barangays');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [staticPage, setStaticPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [seniorsData, setSeniorsData] = useState<any[]>([]);
  const [centenariansData, setCentenariansData] = useState<any[]>([]);
  const [deceasedData, setDeceasedData] = useState<any[]>([]);
  const [newlyRegisteredData, setNewlyRegisteredData] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'masterlist' | 'centenarians' | 'deceased' | 'newly-registered'>(initialSection);
  const itemsPerPage = 15;

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
        setTotalPages(masterlistResponse?.meta?.last_page || masterlistResponse?.last_page || 1);
        setTotalCount(masterlistResponse?.meta?.total ?? masterlistResponse?.total ?? masterlistData.length);
        setCentenariansData(allActiveData.filter((item: any) => Number(item.age || 0) >= 100));
        setDeceasedData(
          selectedBrgy === 'All Barangays'
            ? allDeceasedData
            : allDeceasedData.filter((item: any) => item.barangay === selectedBrgy)
        );

        const recentSeniors = [...allActiveData]
          .sort((a: any, b: any) => {
            const dateA = new Date(a.joinedDate || a.created_at || a.updatedAt || 0).getTime();
            const dateB = new Date(b.joinedDate || b.created_at || b.updatedAt || 0).getTime();
            return dateB - dateA || (Number(b.id || 0) - Number(a.id || 0));
          })
          .slice(0, 30);

        setNewlyRegisteredData(
          selectedBrgy === 'All Barangays'
            ? recentSeniors
            : recentSeniors.filter((item: any) => item.barangay === selectedBrgy)
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
    scrollMainToTop();
  }, [page, staticPage]);

  useEffect(() => {
    setActiveSection(initialSection);
    setStaticPage(1);
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

  const isDataLoading = loading;

  return (
    <TransitionWrapper isLoading={loading} skeleton={<ReportSkeleton />}>
      {!loading && (
        <div className="space-y-8 pb-12 relative">
      <div className="flex items-center justify-end gap-4 no-print">
        <button 
          onClick={handleExcelExport}
          disabled={isExporting}
          className={`py-2.5 px-6 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all active:scale-[0.98] outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto ${isExporting ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
        >
          {isExporting ? <Clock className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
          <span className="hidden sm:inline">
            {isExporting ? 'GENERATING REPORT...' : 'GENERATE EXCEL REPORT'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="w-full space-y-6">
          <div className="top-0 z-10 w-fit max-w-full bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-2 inline-flex flex-wrap items-center gap-2 shadow-sm no-print">
            <button
              type="button"
              onClick={() => { setActiveSection('masterlist'); setStaticPage(1); }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSection === 'masterlist'
                  ? 'bg-systemBlue text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Masterlist
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('centenarians'); setStaticPage(1); }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSection === 'centenarians'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Living Centenarians
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('newly-registered'); setStaticPage(1); }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSection === 'newly-registered'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              New Registered
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('deceased'); setStaticPage(1); }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSection === 'deceased'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Deceased Seniors
            </button>
          </div>

          {activeSection === 'masterlist' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-systemBlue/10 text-systemBlue rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Masterlist Preview</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <select 
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); setStaticPage(1); }}
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
                <thead className="sticky top-0 z-[2] bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
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
                <tbody className="divide-y divide-slate-100">
                  {seniorsData.length > 0 ? (
                    seniorsData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <span className="print:hidden"><TableAvatar name={item.name} /></span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px]">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center">
                          <span className="text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</span>
                        </td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-bold text-slate-900 tabular-nums">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center">
                            <CategoryPill label={item.pensionStatus || 'None'} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={8} title="No Records Found" message="No masterlist records found." />
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <TablePagination
                page={page}
                totalPages={totalPages}
                onPage={setPage}
                from={seniorsData.length ? (page - 1) * itemsPerPage + 1 : 0}
                to={(page - 1) * itemsPerPage + seniorsData.length}
                total={totalCount}
                noun="members"
              />
            )}
          </div>
          )}

          {activeSection === 'centenarians' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/10 text-purple-600 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Living Centenarians (100+)</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <select
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); setStaticPage(1); }}
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
              <table className="w-full text-left">
                <thead className="sticky top-0 z-[2] bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
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
                <tbody className="divide-y divide-slate-100">
                  {centenariansData.length > 0 ? (
                    centenariansData.slice((staticPage - 1) * itemsPerPage, staticPage * itemsPerPage).map((item) => (
                      <tr key={`cent-${item.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <span className="print:hidden"><TableAvatar name={item.name} /></span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px]">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-black text-purple-700 tabular-nums">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center">
                            <CategoryPill label={item.pensionStatus || 'None'} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={8} title="No Centenarians Found" message="No living centenarians found for this filter." />
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <TablePagination
                page={staticPage}
                totalPages={Math.max(1, Math.ceil(centenariansData.length / itemsPerPage))}
                onPage={setStaticPage}
                from={(staticPage - 1) * itemsPerPage + 1}
                to={Math.min(staticPage * itemsPerPage, centenariansData.length)}
                total={centenariansData.length}
                noun="centenarians"
              />
            )}
          </div>
          )}

          {activeSection === 'deceased' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700/10 text-slate-700 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Deceased Seniors</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <select
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); setStaticPage(1); }}
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
              <table className="w-full text-left">
                <thead className="sticky top-0 z-[2] bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
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
                <tbody className="divide-y divide-slate-100">
                  {deceasedData.length > 0 ? (
                    deceasedData.slice((staticPage - 1) * itemsPerPage, staticPage * itemsPerPage).map((item) => (
                      <tr key={`dec-${item.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <span className="print:hidden"><TableAvatar name={item.name} /></span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px]">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-bold text-slate-900 tabular-nums">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center">
                            <CategoryPill label={item.pensionStatus || 'None'} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={8} title="No Records Found" message="No deceased records found for this filter." />
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <TablePagination
                page={staticPage}
                totalPages={Math.max(1, Math.ceil(deceasedData.length / itemsPerPage))}
                onPage={setStaticPage}
                from={(staticPage - 1) * itemsPerPage + 1}
                to={Math.min(staticPage * itemsPerPage, deceasedData.length)}
                total={deceasedData.length}
                noun="seniors"
              />
            )}
          </div>
          )}

          {activeSection === 'newly-registered' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:overflow-visible print:border-none print:shadow-none print:m-0 print:p-0">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/10 text-emerald-600 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">New Registered Seniors</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <select
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); setStaticPage(1); }}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                  >
                    <option>All Barangays</option>
                    {BARANGAYS.map(b => (
                      <option key={`new-${b}`} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2"
                >
                  <FileText size={14} />
                  Print List
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  Total: {newlyRegisteredData.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto print:hidden">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-[2] print:static bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    <th className="px-8 py-4 text-left print:px-2 print:py-2">Full Name</th>
                    <th className="px-8 py-4 text-left print:px-2 print:py-2">Address</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">Sex</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">Birthday</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">Age</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">OSCA ID</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">RRN No</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">Pension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {newlyRegisteredData.length > 0 ? (
                    newlyRegisteredData.slice((staticPage - 1) * itemsPerPage, staticPage * itemsPerPage).map((item) => (
                      <tr key={`new-${item.id}`} className="print:border-b print:border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 print:px-2 print:py-2">
                          <div className="flex items-center gap-3">
                            <span className="print:hidden"><TableAvatar name={item.name} /></span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px] print:whitespace-normal print:break-words print:px-2 print:py-2">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-semibold text-slate-600 print:px-2 print:py-2">{(item as any).sex || item.gender || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600 print:px-2 print:py-2">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-black text-emerald-700 tabular-nums print:px-2 print:py-2">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider print:px-2 print:py-2">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 print:px-2 print:py-2">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center print:px-2 print:py-2">
                          <div className="flex items-center justify-center">
                            <CategoryPill label={item.pensionStatus || 'None'} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={8} title="No Records Found" message="No newly registered records found for this filter." />
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <div className="print:hidden">
              <TablePagination
                page={staticPage}
                totalPages={Math.max(1, Math.ceil(newlyRegisteredData.length / itemsPerPage))}
                onPage={setStaticPage}
                from={(staticPage - 1) * itemsPerPage + 1}
                to={Math.min(staticPage * itemsPerPage, newlyRegisteredData.length)}
                total={newlyRegisteredData.length}
                noun="seniors"
              />
              </div>
            )}

            {/* Print-only report: portaled to <body> so no screen-layout
                ancestor (max-width, padding, overflow) can shrink or clip it.
                A4 sheet, natural page flow, repeating header. */}
            {createPortal(
            <div className="hidden print:block report-a4-sheet w-full">
              <style>{`
                @page report-a4 {
                  size: A4;
                  margin: 0 0 0.4in 0;
                  @bottom-right {
                    content: 'Page ' counter(page) ' of ' counter(pages);
                    font-size: 9px;
                    color: #64748b;
                    font-weight: 600;
                  }
                }
                .report-a4-sheet { page: report-a4; }
              `}</style>
              {(() => {
                const generated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                return (
                  <>
                    {/* Branded header band (first page) */}
                    <div className="relative overflow-hidden bg-[#dbe9fb] px-6 pt-8 pb-6 text-center">
                      <div className="absolute -left-16 -top-24 h-48 w-72 rounded-full bg-white/50" />
                      <div className="absolute -right-20 -top-28 h-56 w-80 rounded-full bg-white/40" />
                      <div className="absolute -left-10 top-6 h-40 w-64 rounded-full bg-[#bcd6f5]/60" />
                      <div className="absolute -right-16 top-2 h-44 w-72 rounded-full bg-[#bcd6f5]/50" />
                      <div className="relative">
                        <h2 className="text-[26px] font-black uppercase tracking-tight text-[#0b2a5b]">
                          New Registered Seniors
                        </h2>
                        <p className="text-base font-extrabold text-[#0b2a5b] mt-1">{selectedBrgy}</p>
                        <p className="text-xs font-semibold text-slate-600 mt-1">
                          Total: {newlyRegisteredData.length} member{newlyRegisteredData.length === 1 ? '' : 's'} · Generated {generated}
                        </p>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#2b60c4]" />
                    </div>

                    <div className="px-4 pb-2">
                    <table className="w-full text-left border-collapse">
                      <thead className="print:table-header-group">
                        <tr className="bg-[#2b60c4] text-[10px] font-black tracking-wider text-white uppercase">
                          <th className="px-2 py-2.5 text-center w-8 border border-[#2b60c4]">#</th>
                          <th className="px-2 py-2.5 text-left border border-[#2b60c4]">Full Name</th>
                          <th className="px-2 py-2.5 text-left w-[26%] border border-[#2b60c4]">Address</th>
                          <th className="px-2 py-2.5 text-center border border-[#2b60c4]">Sex</th>
                          <th className="px-2 py-2.5 text-center border border-[#2b60c4]">Birthday</th>
                          <th className="px-2 py-2.5 text-center border border-[#2b60c4]">Age</th>
                          <th className="px-2 py-2.5 text-center border border-[#2b60c4]">OSCA ID</th>
                          <th className="px-2 py-2.5 text-center border border-[#2b60c4]">RRN No</th>
                          <th className="px-2 py-2.5 text-center border border-[#2b60c4]">Pension</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newlyRegisteredData.length > 0 ? (
                          newlyRegisteredData.map((item, idx) => {
                            const rowNo = idx + 1;
                            const zebra = rowNo % 2 === 0 ? 'bg-[#eaf2fd]' : 'bg-white';
                            return (
                              <tr key={`print-new-${item.id}`} className={`${zebra} break-inside-avoid`}>
                                <td className="px-2 py-2 text-center text-[11px] font-semibold text-slate-700 tabular-nums border border-slate-200">{rowNo}</td>
                                <td className="px-2 py-2 border border-slate-200">
                                  <p className="text-[10px] font-extrabold text-slate-900 uppercase leading-tight">{item.name}</p>
                                  <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider">{item.barangay || '-'}</p>
                                </td>
                                <td className="px-2 py-2 text-[9px] font-medium text-slate-700 uppercase leading-snug border border-slate-200">{item.streetAddress || '-'}</td>
                                <td className="px-2 py-2 text-center text-[10px] font-medium text-slate-700 border border-slate-200">{(item as any).sex || item.gender || '-'}</td>
                                <td className="px-2 py-2 text-center text-[10px] font-medium text-slate-700 tabular-nums whitespace-nowrap border border-slate-200">{formatDate(item.dateOfBirth)}</td>
                                <td className="px-2 py-2 text-center text-[11px] font-black text-slate-900 tabular-nums border border-slate-200">{item.age ?? '-'}</td>
                                <td className="px-2 py-2 text-center text-[9px] font-semibold text-slate-700 font-mono tabular-nums whitespace-nowrap border border-slate-200">{item.osca_id || item.oscaId || '-'}</td>
                                <td className="px-2 py-2 text-center text-[9px] font-medium text-slate-600 tabular-nums border border-slate-200">{item.rrn || '-'}</td>
                                <td className="px-2 py-2 text-center text-[9px] font-bold text-slate-700 uppercase whitespace-nowrap border border-slate-200">{item.pensionStatus || 'None'}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={9} className="px-2 py-8 text-center text-xs font-semibold text-slate-500">
                              No newly registered records found for this filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="mt-6 flex items-end justify-between text-[10px] font-semibold text-slate-600 break-inside-avoid">
                      <p>Total: {newlyRegisteredData.length} member{newlyRegisteredData.length === 1 ? '' : 's'}</p>
                      <div className="text-right">
                        <div className="border-t border-slate-900 w-48 ml-auto mb-1" />
                        <p>Authorized Signature</p>
                      </div>
                    </div>
                    </div>
                  </>
                );
              })()}
            </div>,
            document.body
            )}
          </div>
          )}
        </div>
      </div>
    </div>
      )}
    </TransitionWrapper>
  );
};

export default ReportView;
