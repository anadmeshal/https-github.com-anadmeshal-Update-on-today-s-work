import React, { useState, useMemo } from 'react';
import { WorkItem } from '../types';
import { formatDays } from '../utils/formatters';
import { 
  classifyWorkStatus, 
  STAGE_CATEGORIES, 
  ORDERED_STAGES 
} from '../utils/statusClassifier';
import { 
  MapPin, 
  Clock, 
  FileCheck2, 
  Download, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  ArrowUpDown, 
  Maximize2, 
  Minimize2,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Plus,
  Printer,
  FileDown,
  Calendar,
  Columns
} from 'lucide-react';

interface WorksTableProps {
  items: WorkItem[];
  theme?: 'light' | 'dark';
  onViewDetail?: (item: WorkItem) => void;
  onEditItem?: (item: WorkItem) => void;
  onDeleteItem?: (id: string) => void;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
  onOpenUpload?: () => void;
  onOpenAddRow?: () => void;
}

type SortField = 'serialNumber' | 'sector' | 'lineNo' | 'workDescription' | 'location' | 'streetName' | 'lengthMeters' | 'duration' | 'openDays' | 'permit' | 'permitIssueDate' | 'digPermitNo' | 'digPermitDate' | 'status';

export const WorksTable: React.FC<WorksTableProps> = ({
  items,
  theme = 'dark',
  onViewDetail,
  onEditItem,
  onDeleteItem,
  onExportExcel,
  onExportPdf,
  onPrint,
  onOpenUpload,
  onOpenAddRow,
}) => {
  const isLight = theme === 'light';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('serialNumber');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(0); // 0 means show all for full clarity
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detailedDateColumns, setDetailedDateColumns] = useState(false);

  const openItemsCount = useMemo(() => {
    return items.filter(it => !it.status?.includes('مغلق') && !it.status?.includes('مكتمل')).length;
  }, [items]);

  const closedItemsCount = useMemo(() => {
    return items.filter(it => it.status?.includes('مغلق') || it.status?.includes('مكتمل')).length;
  }, [items]);

  const handlePrint = () => {
    setPageSize(0); // Show all records for paper print
    if (onPrint) {
      onPrint();
    } else {
      setTimeout(() => {
        window.print();
      }, 60);
    }
  };

  const handleExportPdf = () => {
    setPageSize(0);
    if (onExportPdf) {
      onExportPdf();
    } else if (onPrint) {
      onPrint();
    } else {
      setTimeout(() => {
        window.print();
      }, 60);
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(item => {
        const stage = classifyWorkStatus(item);
        const stageTitle = STAGE_CATEGORIES[stage]?.title?.toLowerCase() || '';
        return (
          String(item.serialNumber).includes(q) ||
          (item.sector && item.sector.toLowerCase().includes(q)) ||
          (item.lineNo && item.lineNo.toLowerCase().includes(q)) ||
          (item.workDescription && item.workDescription.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.streetName && item.streetName.toLowerCase().includes(q)) ||
          (item.duration && item.duration.toLowerCase().includes(q)) ||
          (item.permit && item.permit.toLowerCase().includes(q)) ||
          (item.permitIssueDate && item.permitIssueDate.toLowerCase().includes(q)) ||
          (item.digPermitNo && item.digPermitNo.toLowerCase().includes(q)) ||
          (item.digPermitDate && item.digPermitDate.toLowerCase().includes(q)) ||
          (item.lengthMeters && String(item.lengthMeters).includes(q)) ||
          stage.toLowerCase().includes(q) ||
          stageTitle.includes(q)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => {
        const isClosed = (item.status || '').includes('مغلق') || (item.status || '').includes('مكتمل');
        const itemStatus = isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه';
        return itemStatus === statusFilter;
      });
    }

    // Stage filter (مراحل العمل الـ 5)
    if (stageFilter !== 'all') {
      result = result.filter(item => classifyWorkStatus(item) === stageFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortField] ?? '';
      let valB: any = b[sortField] ?? '';

      if (sortField === 'serialNumber' || sortField === 'lengthMeters' || sortField === 'openDays') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, searchTerm, statusFilter, stageFilter, sortField, sortAsc]);

  // Pagination
  const totalItems = filteredAndSortedItems.length;
  const paginatedItems = useMemo(() => {
    if (pageSize <= 0) return filteredAndSortedItems;
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedItems.slice(start, start + pageSize);
  }, [filteredAndSortedItems, currentPage, pageSize]);

  const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div
      className={`rounded-xl border shadow-xl flex flex-col transition-all duration-200 ${
        isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800'
      } ${
        isFullscreen ? `fixed inset-0 z-50 rounded-none p-4 ${isLight ? 'bg-slate-100' : 'bg-black'} overflow-y-auto` : 'mb-8'
      }`}
    >
      {/* Table Action Bar */}
      <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 print:hidden ${
        isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/80 border-slate-800'
      }`}>
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث برقم القطاع، اسم الشارع، وصف الأعمال، الفسح..."
              className={`w-full pr-9 pl-3 py-2 text-xs md:text-sm rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium transition-colors ${
                isLight 
                  ? 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400' 
                  : 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500'
              }`}
            />
          </div>

          {/* Quick Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className={`w-3.5 h-3.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`text-xs rounded-lg px-2.5 py-2 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                isLight 
                  ? 'bg-white border border-slate-300 text-slate-800' 
                  : 'bg-slate-900 border border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">جميع الحالات ({items.length})</option>
              <option value="مفتوح جاري العمل عليه">مفتوح جاري العمل عليه ({openItemsCount})</option>
              <option value="مغلق مكتمل">مغلق مكتمل ({closedItemsCount})</option>
            </select>
          </div>

          {/* Quick Stage Filter (المراحل الخمس) */}
          <div className="flex items-center gap-1.5">
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`text-xs rounded-lg px-2.5 py-2 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                isLight 
                  ? 'bg-white border border-slate-300 text-slate-800' 
                  : 'bg-slate-900 border border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">مراحل العمل الـ 5 (الكل)</option>
              {ORDERED_STAGES.map((stg) => (
                <option key={`stg-opt-${stg}`} value={stg}>
                  {STAGE_CATEGORIES[stg].title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Toggle Detailed Date Columns */}
          <button
            onClick={() => setDetailedDateColumns(!detailedDateColumns)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors border cursor-pointer ${
              detailedDateColumns
                ? isLight
                  ? 'bg-blue-100 text-blue-950 border-blue-400 shadow-xs'
                  : 'bg-blue-950/90 text-blue-300 border-blue-600 shadow-xs'
                : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="فصل الفسح وإذن الحفر والتواريخ في أعمدة منفصلة"
          >
            <Columns className="w-3.5 h-3.5 text-blue-500" />
            <span>{detailedDateColumns ? 'عرض التواريخ بأعمدة منفصلة' : 'فصل أعمدة التواريخ'}</span>
          </button>

          {/* Page size toggle */}
          <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium ${
            isLight 
              ? 'bg-white border-slate-300 text-slate-700' 
              : 'bg-slate-900 border-slate-700 text-slate-300'
          }`}>
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>العرض:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`bg-transparent font-black focus:outline-hidden cursor-pointer ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              <option value={0}>عرض الكل ({items.length} قطاع)</option>
              <option value={15}>15 صف</option>
              <option value={25}>25 صف</option>
              <option value={50}>50 صف</option>
            </select>
          </div>

          {/* Add Row Button */}
          {onOpenAddRow && (
            <button
              onClick={onOpenAddRow}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
              title="إضافة قطاع جديد"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة قطاع</span>
            </button>
          )}

          {/* Upload Excel Button */}
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
              title="رفع ملف Excel به كامل الأعمدة (الوصف، الشارع، الفسح، المدة)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>رفع Excel</span>
            </button>
          )}

          {/* Export to PDF */}
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-black flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title="تصدير وطباعة تقرير رسمي معتمد لكافة القطاعات بصيغة PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-white" />
            <span>طباعة PDF احترافية</span>
          </button>

          {/* Export to Excel */}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="تصدير جدول الأعمال إلى Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>
          )}

          {/* Print Report */}
          <button
            onClick={handleExportPdf}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="طباعة ومعاينة تقرير القطاعات المفتوحة"
          >
            <Printer className="w-3.5 h-3.5 text-amber-500" />
            <span>معاينة وطباعة</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-lg border transition-colors ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title={isFullscreen ? 'تصغير الشاشة' : 'تكبير ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main High-Legibility Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse text-xs md:text-sm">
          {/* Table Headers */}
          <thead>
            <tr className={`select-none ${
              isLight 
                ? 'bg-slate-100 text-slate-900 border-b-2 border-slate-300' 
                : 'bg-slate-950 text-slate-100 border-b-2 border-slate-800'
            }`}>
              {/* 1. م */}
              <th
                onClick={() => handleSort('serialNumber')}
                className={`py-3 px-2.5 text-center w-12 font-black cursor-pointer transition-colors ${
                  isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>م</span>
                  <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
              </th>

              {/* 2. القطاع */}
              <th
                onClick={() => handleSort('sector')}
                className={`py-3 px-3 font-black cursor-pointer transition-colors min-w-[110px] ${
                  isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>القطاع</span>
                  <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
              </th>

              {/* 3. رقم الخط */}
              <th
                onClick={() => handleSort('lineNo')}
                className={`py-3 px-3 font-black cursor-pointer transition-colors min-w-[100px] ${
                  isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>رقم الخط</span>
                  <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
              </th>

              {/* 4. اسم الشارع */}
              <th
                onClick={() => handleSort('streetName')}
                className={`py-3 px-3 font-black cursor-pointer transition-colors min-w-[140px] ${
                  isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>اسم الشارع</span>
                  <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
              </th>

              {/* 5. طول القطاع */}
              <th
                onClick={() => handleSort('lengthMeters')}
                className={`py-3 px-2.5 font-black cursor-pointer transition-colors text-center w-24 ${
                  isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>طول القطاع</span>
                  <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
              </th>

              {/* 6. وصف العمل الحالي */}
              <th
                onClick={() => handleSort('workDescription')}
                className={`py-3 px-3.5 font-black cursor-pointer transition-colors min-w-[180px] ${
                  isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>وصف العمل الحالي</span>
                  <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
              </th>

              {/* 7. مدة الفتح */}
              <th
                onClick={() => handleSort('openDays')}
                className={`py-3 px-3 font-black cursor-pointer transition-colors text-center min-w-[125px] ${
                  isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>مدة الفتح</span>
                  <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
              </th>

              {detailedDateColumns ? (
                <>
                  {/* 8a. الفسح وتاريخ الإصدار */}
                  <th
                    onClick={() => handleSort('permit')}
                    className={`py-3 px-3 font-black cursor-pointer transition-colors min-w-[150px] ${
                      isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>الفسح وتاريخ الإصدار</span>
                      <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                  </th>

                  {/* 8b. إذن الحفر وتاريخه */}
                  <th
                    onClick={() => handleSort('digPermitDate')}
                    className={`py-3 px-3 font-black cursor-pointer transition-colors min-w-[150px] ${
                      isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>إذن الحفر وتاريخه</span>
                      <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                  </th>
                </>
              ) : (
                <th
                  onClick={() => handleSort('permit')}
                  className={`py-3 px-3 font-black cursor-pointer transition-colors min-w-[180px] ${
                    isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>الفسح والتصاريح والتواريخ</span>
                    <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                </th>
              )}

              {/* 9. الحالة */}
              <th
                onClick={() => handleSort('status')}
                className={`py-3 px-2.5 font-black cursor-pointer transition-colors text-center w-28 ${
                  isLight ? 'border-l border-slate-300 hover:bg-slate-200/80 text-slate-900' : 'border-l border-slate-800 hover:bg-slate-900 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>الحالة</span>
                  <ArrowUpDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
              </th>

              {/* 10. إجراءات */}
              <th className={`py-3 px-2.5 font-black text-center w-20 print:hidden ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                إجراءات
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-900' : 'divide-slate-800 text-slate-100'}`}>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={10} className={`py-12 text-center print:col-span-9 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className={`w-8 h-8 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <p className={`font-bold text-base ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>لا توجد بيانات مطابقة لبحثك</p>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>جرب البحث بكلمات أخرى أو مسح نص البحث</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, index) => {
                const isEven = index % 2 === 0;
                const rowKey = `${item.id || 'sec'}_${index}`;
                return (
                  <tr
                    key={rowKey}
                    className={`transition-colors border-b ${
                      isLight 
                        ? isEven 
                          ? 'bg-white hover:bg-blue-50/70 border-slate-200 text-slate-900' 
                          : 'bg-slate-50/90 hover:bg-blue-50/70 border-slate-200 text-slate-900'
                        : isEven 
                          ? 'bg-slate-900/90 hover:bg-slate-800/80 border-slate-800 text-slate-100' 
                          : 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800 text-slate-100'
                    }`}
                  >
                    {/* 1. م (الرقم التسلسلي) */}
                    <td className={`py-3 px-2.5 text-center font-black font-mono text-xs md:text-sm ${
                      isLight ? 'border-l border-slate-200 text-slate-700' : 'border-l border-slate-800 text-slate-400'
                    }`}>
                      {item.serialNumber}
                    </td>

                    {/* 2. القطاع */}
                    <td className={`py-3 px-3 ${isLight ? 'border-l border-slate-200' : 'border-l border-slate-800'}`}>
                      <div className={`font-black text-xs md:text-sm flex items-center gap-1.5 ${
                        isLight ? 'text-slate-950' : 'text-white'
                      }`}>
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                        <span className="font-mono tracking-wide">{item.sector}</span>
                      </div>
                    </td>

                    {/* 3. رقم الخط - Fully fixed: No dark black box */}
                    <td className={`py-3 px-3 ${isLight ? 'border-l border-slate-200' : 'border-l border-slate-800'}`}>
                      {item.lineNo ? (
                        <span className={`inline-block px-2.5 py-1 rounded font-mono font-black text-xs border ${
                          isLight 
                            ? 'bg-slate-100 text-slate-900 border-slate-300 shadow-xs' 
                            : 'bg-slate-800 text-slate-100 border-slate-700'
                        }`}>
                          {item.lineNo}
                        </span>
                      ) : (
                        <span className={isLight ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>—</span>
                      )}
                    </td>

                    {/* 4. اسم الشارع - High contrast clear typography */}
                    <td className={`py-3 px-3 ${isLight ? 'border-l border-slate-200' : 'border-l border-slate-800'}`}>
                      {item.streetName ? (
                        <div className={`font-bold text-xs md:text-sm flex items-center gap-1.5 ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}>
                          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="font-sans">{item.streetName}</span>
                        </div>
                      ) : (
                        <span className={isLight ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>—</span>
                      )}
                    </td>

                    {/* 5. طول القطاع (م.ط) */}
                    <td className={`py-3 px-2.5 text-center ${isLight ? 'border-l border-slate-200' : 'border-l border-slate-800'}`}>
                      {item.lengthMeters !== undefined ? (
                        <span className={`font-mono font-black px-2.5 py-1 rounded border text-xs shadow-xs ${
                          isLight 
                            ? 'text-blue-900 bg-blue-100 border-blue-300' 
                            : 'text-blue-300 bg-blue-950/80 border-blue-800'
                        }`}>
                          {item.lengthMeters} م
                        </span>
                      ) : (
                        <span className={isLight ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>—</span>
                      )}
                    </td>

                    {/* 6. وصف العمل الحالي - مصنف بالمراحل الـ 5 */}
                    <td className={`py-3 px-3.5 ${isLight ? 'border-l border-slate-200' : 'border-l border-slate-800'}`}>
                      {(() => {
                        const stage = classifyWorkStatus(item);
                        const meta = STAGE_CATEGORIES[stage];
                        return (
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-md border shadow-2xs ${
                              isLight 
                                ? `${meta.bgColorLight} ${meta.borderColorLight} ${meta.textColorLight}` 
                                : `${meta.bgColorDark} ${meta.borderColorDark} ${meta.textColorDark}`
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }}></span>
                              <span>{meta.title}</span>
                            </span>
                            {item.workDescription ? (
                              <span className={`font-bold text-xs md:text-sm leading-relaxed ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                                {item.workDescription}
                              </span>
                            ) : (
                              <span className={`text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>—</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 7. مدة الفتح */}
                    <td className={`py-3 px-3 text-center ${isLight ? 'border-l border-slate-200' : 'border-l border-slate-800'}`}>
                      {item.openDays !== undefined ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className={`inline-flex items-center gap-1 font-mono font-black text-xs px-2.5 py-1 rounded border shadow-xs ${
                            isLight 
                              ? 'bg-amber-100 text-amber-950 border-amber-300' 
                              : 'bg-amber-950/80 text-amber-300 border-amber-800'
                          }`}>
                            <Clock className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                            <span>{Math.round(item.openDays)} يوم</span>
                          </div>
                          {item.digPermitDate && (
                            <span className={`text-[10px] font-mono font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`} title="تاريخ بدء الحفر المسجل">
                              بدء: {item.digPermitDate}
                            </span>
                          )}
                        </div>
                      ) : item.duration ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className={`inline-flex items-center gap-1 font-mono font-black text-xs px-2.5 py-1 rounded border shadow-xs ${
                            isLight 
                              ? 'bg-amber-100 text-amber-950 border-amber-300' 
                              : 'bg-amber-950/80 text-amber-300 border-amber-800'
                          }`}>
                            <Clock className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                            <span>{formatDays(item.duration)}</span>
                          </div>
                          {item.digPermitDate && (
                            <span className={`text-[10px] font-mono font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`} title="تاريخ بدء الحفر المسجل">
                              بدء: {item.digPermitDate}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={isLight ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>—</span>
                      )}
                    </td>

                    {detailedDateColumns ? (
                      <>
                        {/* 8a. الفسح وتاريخ الإصدار */}
                        <td className={`py-3 px-3 ${isLight ? 'border-l border-slate-200' : 'border-l border-slate-800'}`}>
                          {item.permit ? (
                            <div className="flex flex-col gap-1 text-xs">
                              <div className={`font-mono font-black flex items-center gap-1 ${
                                isLight ? 'text-emerald-950' : 'text-emerald-300'
                              }`} title="رقم الفسح">
                                <FileCheck2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                                <span>فسح: {item.permit}</span>
                              </div>
                              <div className={`text-[11px] font-mono flex items-center gap-1 ${
                                item.permitIssueDate 
                                  ? isLight ? 'text-emerald-800 font-bold' : 'text-emerald-400 font-bold'
                                  : isLight ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                <Calendar className="w-3 h-3 shrink-0 opacity-70" />
                                <span>{item.permitIssueDate ? item.permitIssueDate : 'غير مسجل بقاعدة البيانات'}</span>
                              </div>
                            </div>
                          ) : (
                            <span className={isLight ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>—</span>
                          )}
                        </td>

                        {/* 8b. إذن الحفر وتاريخه */}
                        <td className={`py-3 px-3 ${isLight ? 'border-l border-slate-200' : 'border-l border-slate-800'}`}>
                          {item.digPermitNo || item.digPermitDate ? (
                            <div className="flex flex-col gap-1 text-xs">
                              {item.digPermitNo ? (
                                <div className={`font-mono text-[11px] flex items-center gap-1 ${
                                  isLight ? 'text-slate-800' : 'text-slate-300'
                                }`} title="رقم إذن الحفر">
                                  <span className={`font-sans font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>إذن:</span>
                                  <span className={`font-bold px-1.5 py-0.5 rounded font-mono ${
                                    isLight ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-200'
                                  }`}>{item.digPermitNo}</span>
                                </div>
                              ) : null}
                              <div className={`text-[11px] font-mono flex items-center gap-1 ${
                                item.digPermitDate 
                                  ? isLight ? 'text-indigo-900 font-bold' : 'text-indigo-300 font-bold'
                                  : isLight ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                <Calendar className="w-3 h-3 shrink-0 opacity-70" />
                                <span>{item.digPermitDate ? item.digPermitDate : 'غير مسجل بقاعدة البيانات'}</span>
                              </div>
                            </div>
                          ) : (
                            <span className={isLight ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>—</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <td className={`py-3 px-3 ${isLight ? 'border-l border-slate-200' : 'border-l border-slate-800'}`}>
                        <div className="flex flex-col gap-1.5 text-xs">
                          {/* الفسح */}
                          {item.permit ? (
                            <div className="flex flex-col gap-0.5">
                              <div className={`font-mono font-black flex items-center gap-1 ${
                                isLight ? 'text-emerald-950' : 'text-emerald-300'
                              }`} title="رقم الفسح">
                                <FileCheck2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                                <span>فسح: {item.permit}</span>
                              </div>
                              {item.permitIssueDate ? (
                                <div className={`text-[11px] font-mono flex items-center gap-1 mr-3.5 font-bold ${
                                  isLight ? 'text-emerald-800' : 'text-emerald-400'
                                }`}>
                                  <Calendar className="w-3 h-3 shrink-0 opacity-75" />
                                  <span>بتاريخ: {item.permitIssueDate}</span>
                                </div>
                              ) : (
                                <span className={`text-[10px] mr-3.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                  تاريخ الفسح: غير مسجل بقاعدة البيانات
                                </span>
                              )}
                            </div>
                          ) : null}

                          {/* إذن الحفر */}
                          {item.digPermitNo || item.digPermitDate ? (
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {item.digPermitNo && (
                                <div className={`font-mono text-[11px] flex items-center gap-1 ${
                                  isLight ? 'text-slate-800' : 'text-slate-300'
                                }`} title="رقم إذن الحفر">
                                  <span className={`font-sans font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>إذن حفر:</span>
                                  <span className={`font-bold px-1.5 py-0.5 rounded font-mono ${
                                    isLight ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-200'
                                  }`}>{item.digPermitNo}</span>
                                </div>
                              )}
                              {item.digPermitDate ? (
                                <div className={`text-[11px] font-mono flex items-center gap-1 mr-1 font-bold ${
                                  isLight ? 'text-indigo-900' : 'text-indigo-300'
                                }`}>
                                  <Calendar className="w-3 h-3 shrink-0 opacity-75" />
                                  <span>بتاريخ: {item.digPermitDate}</span>
                                </div>
                              ) : (
                                <span className={`text-[10px] mr-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                  تاريخ الإذن: غير مسجل بقاعدة البيانات
                                </span>
                              )}
                            </div>
                          ) : null}

                          {!item.permit && !item.digPermitNo && !item.digPermitDate && (
                            <span className={isLight ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>—</span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 9. الحالة */}
                    <td className={`py-3 px-2.5 text-center ${isLight ? 'border-l border-slate-200' : 'border-l border-slate-800'}`}>
                      {(() => {
                        const isClosed = (item.status || '').includes('مغلق') || (item.status || '').includes('مكتمل');
                        const displayStatus = isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه';
                        return (
                          <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-black border whitespace-nowrap shadow-xs ${
                            isClosed
                              ? isLight
                                ? 'bg-blue-100 text-blue-950 border-blue-300'
                                : 'bg-blue-950/80 text-blue-300 border-blue-800'
                              : isLight 
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-300' 
                                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          }`}>
                            {displayStatus}
                          </span>
                        );
                      })()}
                    </td>

                    {/* 10. الإجراءات */}
                    <td className="py-3 px-2.5 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        {onEditItem && (
                          <button
                            onClick={() => onEditItem(item)}
                            className={`p-1.5 rounded-md transition-colors ${
                              isLight 
                                ? 'text-slate-600 hover:text-blue-700 hover:bg-slate-200' 
                                : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
                            }`}
                            title="تعديل هذا القطاع"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onViewDetail && (
                          <button
                            onClick={() => onViewDetail(item)}
                            className={`p-1.5 rounded-md transition-colors ${
                              isLight 
                                ? 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200' 
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                            }`}
                            title="عرض تفاصيل القطاع"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteItem && (
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className={`p-1.5 rounded-md transition-colors ${
                              isLight 
                                ? 'text-slate-500 hover:text-red-700 hover:bg-slate-200' 
                                : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'
                            }`}
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary & Pagination */}
      <div className={`p-3.5 border-t flex flex-wrap items-center justify-between gap-3 text-xs print:hidden ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-700 font-medium' : 'bg-slate-950/80 border-slate-800 text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          <span className={isLight ? 'font-bold text-slate-600' : 'font-semibold text-slate-400'}>إجمالي المعروض:</span>
          <span className={`font-black font-mono text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>{filteredAndSortedItems.length}</span>
          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>من أصل {items.length} قطاع</span>
        </div>

        {pageSize > 0 && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-xs ${
                isLight 
                  ? 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100' 
                  : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              السابق
            </button>
            <span className={`px-2 font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-xs ${
                isLight 
                  ? 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100' 
                  : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
