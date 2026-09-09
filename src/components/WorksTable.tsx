import React, { useState, useMemo } from 'react';
import { WorkItem } from '../types';
import { formatDays } from '../utils/formatters';
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
  FileDown
} from 'lucide-react';

interface WorksTableProps {
  items: WorkItem[];
  onViewDetail?: (item: WorkItem) => void;
  onEditItem?: (item: WorkItem) => void;
  onDeleteItem?: (id: string) => void;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
  onOpenUpload?: () => void;
  onOpenAddRow?: () => void;
}

type SortField = 'serialNumber' | 'sector' | 'lineNo' | 'workDescription' | 'location' | 'streetName' | 'lengthMeters' | 'duration' | 'openDays' | 'permit' | 'status';

export const WorksTable: React.FC<WorksTableProps> = ({
  items,
  onViewDetail,
  onEditItem,
  onDeleteItem,
  onExportExcel,
  onExportPdf,
  onPrint,
  onOpenUpload,
  onOpenAddRow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('serialNumber');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(0); // 0 means show all for full clarity
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      result = result.filter(item => 
        String(item.serialNumber).includes(q) ||
        (item.sector && item.sector.toLowerCase().includes(q)) ||
        (item.lineNo && item.lineNo.toLowerCase().includes(q)) ||
        (item.workDescription && item.workDescription.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.streetName && item.streetName.toLowerCase().includes(q)) ||
        (item.duration && item.duration.toLowerCase().includes(q)) ||
        (item.permit && item.permit.toLowerCase().includes(q)) ||
        (item.digPermitNo && item.digPermitNo.toLowerCase().includes(q)) ||
        (item.lengthMeters && String(item.lengthMeters).includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
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
  }, [items, searchTerm, statusFilter, sortField, sortAsc]);

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
      className={`bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl flex flex-col transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none p-4 bg-black overflow-y-auto' : 'mb-8'
      }`}
    >
      {/* Table Action Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 print:hidden">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث برقم القطاع، اسم الشارع، وصف الأعمال، الفسح..."
              className="w-full pr-9 pl-3 py-2 text-xs md:text-sm bg-slate-900 border border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Quick Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all" className="bg-slate-950 text-slate-200">جميع الحالات ({items.length})</option>
              <option value="مفتوح (جاري العمل به)" className="bg-slate-950 text-slate-200">مفتوح (جاري العمل به)</option>
              <option value="جاري العمل" className="bg-slate-950 text-slate-200">جاري العمل</option>
              <option value="مكتمل" className="bg-slate-950 text-slate-200">مكتمل</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Page size toggle */}
          <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300">
            <span className="text-slate-400">العرض:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-100 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value={0} className="bg-slate-950 text-slate-200">عرض الكل ({items.length} قطاع)</option>
              <option value={15} className="bg-slate-950 text-slate-200">15 صف</option>
              <option value={25} className="bg-slate-950 text-slate-200">25 صف</option>
              <option value={50} className="bg-slate-950 text-slate-200">50 صف</option>
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
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title="تصدير تقرير رسمي معتمد لكافة القطاعات بصيغة PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-white" />
            <span>تصدير PDF</span>
          </button>

          {/* Export to Excel */}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
              title="تصدير جدول الأعمال إلى Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>
          )}

          {/* Print Report */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title="طباعة تقرير القطاعات المفتوحة"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>طباعة التقرير</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition-colors"
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
            <tr className="bg-slate-950 text-slate-200 border-b-2 border-slate-800 select-none">
              {/* 1. م */}
              <th
                onClick={() => handleSort('serialNumber')}
                className="py-3 px-2.5 border-l border-slate-800 text-center w-12 font-extrabold cursor-pointer hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>م</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 2. القطاع */}
              <th
                onClick={() => handleSort('sector')}
                className="py-3 px-3 border-l border-slate-800 font-extrabold cursor-pointer hover:bg-slate-900 transition-colors min-w-[110px]"
              >
                <div className="flex items-center gap-1">
                  <span>القطاع</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 3. رقم الخط */}
              <th
                onClick={() => handleSort('lineNo')}
                className="py-3 px-3 border-l border-slate-800 font-extrabold cursor-pointer hover:bg-slate-900 transition-colors min-w-[100px]"
              >
                <div className="flex items-center gap-1">
                  <span>رقم الخط</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 4. اسم الشارع */}
              <th
                onClick={() => handleSort('streetName')}
                className="py-3 px-3 border-l border-slate-800 font-extrabold cursor-pointer hover:bg-slate-900 transition-colors min-w-[140px]"
              >
                <div className="flex items-center gap-1">
                  <span>اسم الشارع</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 5. طول القطاع */}
              <th
                onClick={() => handleSort('lengthMeters')}
                className="py-3 px-2.5 border-l border-slate-800 font-extrabold cursor-pointer hover:bg-slate-900 transition-colors text-center w-24"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>طول القطاع</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 6. وصف العمل الحالي */}
              <th
                onClick={() => handleSort('workDescription')}
                className="py-3 px-3.5 border-l border-slate-800 font-extrabold cursor-pointer hover:bg-slate-900 transition-colors min-w-[180px]"
              >
                <div className="flex items-center gap-1">
                  <span>وصف العمل الحالي</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 7. مدة الفتح */}
              <th
                onClick={() => handleSort('openDays')}
                className="py-3 px-3 border-l border-slate-800 font-extrabold cursor-pointer hover:bg-slate-900 transition-colors text-center min-w-[110px]"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>مدة الفتح</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 8. الفسح وإذن الحفر */}
              <th
                onClick={() => handleSort('permit')}
                className="py-3 px-3 border-l border-slate-800 font-extrabold cursor-pointer hover:bg-slate-900 transition-colors min-w-[150px]"
              >
                <div className="flex items-center gap-1">
                  <span>الفسح والتصاريح</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 9. الحالة */}
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-2.5 border-l border-slate-800 font-extrabold cursor-pointer hover:bg-slate-900 transition-colors text-center w-28"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>الحالة</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 10. إجراءات */}
              <th className="py-3 px-2.5 font-extrabold text-center w-20 print:hidden text-slate-200">
                إجراءات
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 print:col-span-9">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-500" />
                    <p className="font-bold text-base text-slate-300">لا توجد بيانات مطابقة لبحثك</p>
                    <p className="text-xs text-slate-500">جرب البحث بكلمات أخرى أو مسح نص البحث</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, index) => {
                const isEven = index % 2 === 0;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-800/80 border-b border-slate-800/80 ${
                      isEven ? 'bg-slate-900/60' : 'bg-slate-950/40'
                    }`}
                  >
                    {/* 1. م (الرقم التسلسلي) */}
                    <td className="py-3 px-2.5 border-l border-slate-800 text-center font-bold text-slate-400 font-mono">
                      {item.serialNumber}
                    </td>

                    {/* 2. القطاع */}
                    <td className="py-3 px-3 border-l border-slate-800">
                      <div className="font-extrabold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="font-mono text-xs sm:text-sm">{item.sector}</span>
                      </div>
                    </td>

                    {/* 3. رقم الخط */}
                    <td className="py-3 px-3 border-l border-slate-800">
                      {item.lineNo ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold text-xs border border-slate-700">
                          {item.lineNo}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>

                    {/* 4. اسم الشارع */}
                    <td className="py-3 px-3 border-l border-slate-800">
                      {item.streetName ? (
                        <div className="font-bold text-slate-200 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>{item.streetName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>

                    {/* 5. طول القطاع (م.ط) */}
                    <td className="py-3 px-2.5 border-l border-slate-800 text-center">
                      {item.lengthMeters !== undefined ? (
                        <span className="font-mono font-bold text-blue-300 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800 text-xs">
                          {item.lengthMeters} م
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>

                    {/* 6. وصف العمل الحالي */}
                    <td className="py-3 px-3.5 border-l border-slate-800">
                      {item.workDescription ? (
                        <div className="font-bold text-slate-200 leading-relaxed flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            item.workDescription.includes('أسفلت') ? 'bg-indigo-400' :
                            item.workDescription.includes('حفر') ? 'bg-amber-400' :
                            item.workDescription.includes('دفان') ? 'bg-stone-400' :
                            item.workDescription.includes('تمديد') ? 'bg-emerald-400' :
                            'bg-blue-400'
                          }`}></span>
                          <span>{item.workDescription}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">—</span>
                      )}
                    </td>

                    {/* 7. مدة الفتح */}
                    <td className="py-3 px-3 border-l border-slate-800 text-center">
                      {item.openDays !== undefined ? (
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{Math.round(item.openDays)} يوم</span>
                        </div>
                      ) : item.duration ? (
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{formatDays(item.duration)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>

                    {/* 8. الفسح وإذن الحفر */}
                    <td className="py-3 px-3 border-l border-slate-800">
                      <div className="flex flex-col gap-0.5 text-xs">
                        {item.permit ? (
                          <div className="font-mono font-bold text-slate-100 flex items-center gap-1" title="رقم الفسح">
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>فسح: {item.permit}</span>
                          </div>
                        ) : null}
                        {item.digPermitNo ? (
                          <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1" title="رقم إذن الحفر">
                            <span className="text-slate-500 font-sans">إذن حفر:</span>
                            <span className="font-bold text-slate-300">{item.digPermitNo}</span>
                          </div>
                        ) : null}
                        {!item.permit && !item.digPermitNo && (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </div>
                    </td>

                    {/* 9. الحالة */}
                    <td className="py-3 px-2.5 border-l border-slate-800 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800 whitespace-nowrap">
                        {item.status || 'مفتوح (جاري)'}
                      </span>
                    </td>

                    {/* 10. الإجراءات */}
                    <td className="py-3 px-2.5 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        {onEditItem && (
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
                            title="تعديل هذا القطاع"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onViewDetail && (
                          <button
                            onClick={() => onViewDetail(item)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
                            title="عرض تفاصيل القطاع"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteItem && (
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">إجمالي المعروض:</span>
          <span className="font-bold text-white font-mono">{filteredAndSortedItems.length}</span>
          <span>من أصل {items.length} قطاع</span>
        </div>

        {pageSize > 0 && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none font-medium text-slate-300"
            >
              السابق
            </button>
            <span className="px-2 font-semibold text-slate-300">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none font-medium text-slate-300"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
