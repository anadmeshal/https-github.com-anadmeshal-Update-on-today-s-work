import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { TableFilterState } from '../types';

interface FilterBarProps {
  filter: TableFilterState;
  onFilterChange: (newFilter: TableFilterState) => void;
  uniqueSectors: string[];
  uniqueStreets: string[];
  totalFiltered: number;
  totalAll: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  uniqueSectors,
  uniqueStreets,
  totalFiltered,
  totalAll,
}) => {
  const handleReset = () => {
    onFilterChange({
      search: '',
      sector: '',
      streetName: '',
      hasPermit: 'all',
      status: '',
    });
  };

  const isFiltered =
    Boolean(filter.search) ||
    Boolean(filter.sector) ||
    Boolean(filter.streetName) ||
    filter.hasPermit !== 'all' ||
    Boolean(filter.status);

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs mb-5 print:hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            placeholder="بحث فوري في وصف الأعمال، اسم الشارع، رقم القطاع، رقم الفسح..."
            className="w-full pr-10 pl-16 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all font-medium"
          />
          {filter.search && (
            <button
              onClick={() => onFilterChange({ ...filter, search: '' })}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 hover:text-slate-700 font-semibold"
            >
              مسح
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sector filter */}
          {uniqueSectors.length > 0 && (
            <div className="relative min-w-[130px]">
              <select
                value={filter.sector}
                onChange={(e) => onFilterChange({ ...filter, sector: e.target.value })}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium cursor-pointer"
              >
                <option value="">كل القطاعات ({uniqueSectors.length})</option>
                {uniqueSectors.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Street filter */}
          {uniqueStreets.length > 0 && (
            <div className="relative min-w-[140px]">
              <select
                value={filter.streetName}
                onChange={(e) => onFilterChange({ ...filter, streetName: e.target.value })}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium cursor-pointer"
              >
                <option value="">كل الشوارع ({uniqueStreets.length})</option>
                {uniqueStreets.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Permit status */}
          <div className="relative min-w-[125px]">
            <select
              value={filter.hasPermit}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  hasPermit: e.target.value as 'all' | 'with_permit' | 'without_permit',
                })
              }
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium cursor-pointer"
            >
              <option value="all">حالة الفسح (الكل)</option>
              <option value="with_permit">يوجد فسح مسجل</option>
              <option value="without_permit">بدون فسح مسجل</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="إعادة تعيين الفلاتر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تفريغ</span>
            </button>
          )}

          {/* Count Badge */}
          <div className="text-xs font-bold text-slate-700 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
            {totalFiltered} من أصل {totalAll}
          </div>
        </div>
      </div>
    </div>
  );
};
