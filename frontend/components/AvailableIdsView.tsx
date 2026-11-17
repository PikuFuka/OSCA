import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { seniorsAPI } from '../services/api';
import TransitionWrapper from './TransitionWrapper';
import Skeleton from './Skeleton';
import {
  EmptyTableRow,
  TableHeadCell,
  TablePagination,
  scrollMainToTop,
} from './Table';

interface AvailableIdVacancy {
  id: number;
  oscaId: string;
  reason: 'Deceased' | 'Deleted' | string;
  pastHolder: string;
  vacatedAt: string;
}

interface AvailableIdsViewProps {
  notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const PER_PAGE = 15;

const formatVacancyDate = (value: string) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
};

const AvailableIdsSkeleton = () => (
  <table className="w-full min-w-[640px] text-left">
    <thead className="bg-slate-50/70">
      <tr className="text-[10px] font-bold tracking-widest text-slate-400 uppercase border-b border-slate-100">
        <th className="px-4 sm:px-6 py-4">OSCA ID</th>
        <th className="px-4 sm:px-6 py-4">Reason of Vacancy</th>
        <th className="px-4 sm:px-6 py-4">Past Holder</th>
        <th className="px-4 sm:px-6 py-4">Date of Vacancy</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-50">
      {[...Array(10)].map((_, index) => (
        <tr key={index}>
          <td className="px-4 sm:px-6 py-4"><Skeleton.Text className="w-20 h-4" /></td>
          <td className="px-4 sm:px-6 py-4"><Skeleton.Rect className="w-20 h-6 rounded-lg" /></td>
          <td className="px-4 sm:px-6 py-4"><Skeleton.Text className="w-40 h-4" /></td>
          <td className="px-4 sm:px-6 py-4"><Skeleton.Text className="w-24 h-4" /></td>
        </tr>
      ))}
    </tbody>
  </table>
);

const AvailableIdsView: React.FC<AvailableIdsViewProps> = ({ notify }) => {
  const [vacancies, setVacancies] = useState<AvailableIdVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const fetchVacancies = async () => {
      setLoading(true);
      try {
        const response = await seniorsAPI.getAvailableOscaIds();
        if (!cancelled) {
          setVacancies(Array.isArray(response?.data) ? response.data : []);
        }
      } catch {
        if (!cancelled) {
          setVacancies([]);
          notify('Failed to fetch available OSCA IDs.', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVacancies();

    return () => {
      cancelled = true;
    };
  }, [notify]);

  useEffect(() => {
    scrollMainToTop();
  }, [page]);

  const filteredVacancies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return vacancies;

    return vacancies.filter((vacancy) =>
      [vacancy.oscaId, vacancy.reason, vacancy.pastHolder]
        .some((value) => String(value ?? '').toLowerCase().includes(query))
    );
  }, [vacancies, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredVacancies.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleVacancies = filteredVacancies.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  );

  return (
    <div className="space-y-6 sm:space-y-8 overflow-hidden">
      <div className="flex justify-end">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by ID, holder, or reason..."
            className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:outline-none focus:border-systemBlue focus:ring-4 focus:ring-systemBlue/10"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <TransitionWrapper
        isLoading={loading}
        animateContent={false}
        skeleton={
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[420px]">
            <div className="overflow-x-auto no-scrollbar">
              <AvailableIdsSkeleton />
            </div>
          </div>
        }
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[420px]">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <TableHeadCell className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">OSCA ID</TableHeadCell>
                  <TableHeadCell className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">Reason of Vacancy</TableHeadCell>
                  <TableHeadCell className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">Past Holder</TableHeadCell>
                  <TableHeadCell className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">Date of Vacancy</TableHeadCell>
                </tr>
              </thead>
              <tbody className="stagger-sequence">
                {visibleVacancies.length > 0 ? (
                  visibleVacancies.map((vacancy) => {
                    const isDeceased = vacancy.reason === 'Deceased';

                    return (
                      <tr
                        key={vacancy.id}
                        className="group hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 sm:px-6 lg:px-8 py-4 whitespace-nowrap">
                          <span className="font-black text-[13px] text-systemBlue tracking-wider tabular-nums">
                            {vacancy.oscaId}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 lg:px-8 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                              isDeceased
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {vacancy.reason}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 lg:px-8 py-4">
                          <span className="font-bold text-[13px] text-slate-800 uppercase break-words">
                            {vacancy.pastHolder}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 lg:px-8 py-4 text-sm font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                          {formatVacancyDate(vacancy.vacatedAt)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <EmptyTableRow
                    colSpan={4}
                    title={
                      searchTerm.trim()
                        ? 'No matching available OSCA IDs'
                        : 'No available OSCA IDs'
                    }
                    message={
                      searchTerm.trim()
                        ? 'Try a different OSCA ID, holder name, or reason.'
                        : 'IDs released by deceased or deleted members will appear here.'
                    }
                  />
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredVacancies.length > 0 && (
            <TablePagination
              page={safePage}
              totalPages={totalPages}
              onPage={setPage}
              from={(safePage - 1) * PER_PAGE + 1}
              to={Math.min(safePage * PER_PAGE, filteredVacancies.length)}
              total={filteredVacancies.length}
              noun="available IDs"
            />
          )}
        </div>
      </TransitionWrapper>
    </div>
  );
};

export default AvailableIdsView;
