import React, { useState, useEffect, useMemo } from 'react';
import { WorkItem, ProjectMetadata, TableFilterState } from './types';
import { fetchLiveSheetData, exportToExcel, API_URL } from './services/api';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { WorksTable } from './components/WorksTable';
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { AddRowModal } from './components/AddRowModal';
import { EditRowModal } from './components/EditRowModal';
import { SectorDetailModal } from './components/SectorDetailModal';
import { ScriptHelperModal } from './components/ScriptHelperModal';
import { RawDataModal } from './components/RawDataModal';
import { PrintReportHeader } from './components/PrintReportHeader';
import { PrintReportFooter } from './components/PrintReportFooter';
import { StatusPieChart } from './components/StatusPieChart';
import { HistoricalPerformanceChart } from './components/HistoricalPerformanceChart';
import { SectorComparisonChart } from './components/SectorComparisonChart';
import { PdfExportModal } from './components/PdfExportModal';
import { classifyWorkStatus } from './utils/statusClassifier';
import { exportReportToPdf } from './utils/pdfExport';
import { 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Table,
  CheckCircle2,
  FileSpreadsheet,
  Code2,
  TrendingUp,
  PieChart as PieChartIcon,
  LayoutGrid,
  ArrowLeftRight,
  FileDown
} from 'lucide-react';

const STORAGE_KEY_ITEMS = 'app_work_items_v7_live_sheet';
const STORAGE_KEY_META = 'app_work_metadata_v7_live_sheet';
const STORAGE_KEY_URL = 'app_work_api_url_v7_live_sheet';

export default function App() {
  const [apiUrl, setApiUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_URL) || API_URL;
  });
  const [items, setItems] = useState<WorkItem[]>([]);
  const [metadata, setMetadata] = useState<ProjectMetadata>({
    projectName: 'عقد تنفيذ شبكات صرف صحي العوالى 2',
    contractor: 'مقاولة / شركة نظم  البيئة للمقاولات',
    date: '2026-09-07',
    totalCount: 47,
    openSectorsCount: 46,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasDetailedColumns, setHasDetailedColumns] = useState<boolean>(false);
  const [rawEndpointData, setRawEndpointData] = useState<any>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isAddRowOpen, setIsAddRowOpen] = useState<boolean>(false);
  const [isScriptHelperOpen, setIsScriptHelperOpen] = useState<boolean>(false);
  const [isRawDataOpen, setIsRawDataOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<WorkItem | null>(null);

  // Filters
  const [filters, setFilters] = useState<TableFilterState>({
    search: '',
    sector: '',
    streetName: '',
    hasPermit: 'all',
    status: '',
  });
  const [chartStatusFilter, setChartStatusFilter] = useState<string>('');
  const [chartViewMode, setChartViewMode] = useState<'line' | 'pie' | 'compare' | 'both'>('compare');
  const [isPdfExportOpen, setIsPdfExportOpen] = useState<boolean>(false);

  const handleExportPdf = () => {
    setIsPdfExportOpen(true);
  };

  // Initial load
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(STORAGE_KEY_ITEMS);
      const savedMeta = localStorage.getItem(STORAGE_KEY_META);
      if (savedItems) {
        const raw = JSON.parse(savedItems);
        if (Array.isArray(raw)) {
          const cleaned = raw.map((it: WorkItem) => ({
            ...it,
            openDays: typeof it.openDays === 'number' ? Math.round(it.openDays) : it.openDays,
          }));
          setItems(cleaned);
        }
      }
      if (savedMeta) {
        setMetadata(JSON.parse(savedMeta));
      }
    } catch (e) {
      console.error('Failed to parse local storage', e);
    }

    loadLiveData(apiUrl);
  }, []);

  const loadLiveData = async (targetUrl?: string) => {
    const urlToUse = targetUrl || apiUrl;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchLiveSheetData(urlToUse);
      setRawEndpointData(result.rawEndpointData);
      
      setItems((prevItems) => {
        // If user made manual edits, preserve their custom edited rows
        if (prevItems.length > 0 && prevItems.some((i) => i.source === 'manual')) {
          const manualMap = new Map(prevItems.filter(i => i.source === 'manual').map(i => [i.sector, i]));
          const merged = result.items.map(item => {
            const manual = manualMap.get(item.sector);
            return manual || item;
          });
          localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(merged));
          return merged;
        }

        localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(result.items));
        return result.items;
      });

      setMetadata(result.metadata);
      setHasDetailedColumns(result.hasDetailedColumns);
      localStorage.setItem(STORAGE_KEY_META, JSON.stringify(result.metadata));
      setLastUpdated(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      setError(err.message || 'تعذر الاتصال برابط قاعدة البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUrl = (newUrl: string) => {
    setApiUrl(newUrl);
    localStorage.setItem(STORAGE_KEY_URL, newUrl);
    loadLiveData(newUrl);
  };

  // Import from Excel
  const handleExcelImport = (newItems: WorkItem[], metaPartial?: Partial<ProjectMetadata>) => {
    setItems(newItems);
    setHasDetailedColumns(true);
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(newItems));

    if (metaPartial) {
      setMetadata((prev) => {
        const updated = {
          ...prev,
          ...metaPartial,
          totalCount: newItems.length,
          openSectorsCount: newItems.filter(
            (i) => i.status?.includes('مفتوح') || i.status?.includes('جاري')
          ).length,
        };
        localStorage.setItem(STORAGE_KEY_META, JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Add new rows
  const handleAddRows = (newRows: WorkItem[]) => {
    setItems((prev) => {
      const updated = [...prev, ...newRows];
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
      return updated;
    });
  };

  // Edit item
  const handleSaveEdit = (updatedItem: WorkItem) => {
    setItems((prev) => {
      const updated = prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
      return updated;
    });
    if (selectedDetailItem && selectedDetailItem.id === updatedItem.id) {
      setSelectedDetailItem(updatedItem);
    }
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الصف؟')) {
      setItems((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
        return updated;
      });
      if (selectedDetailItem && selectedDetailItem.id === id) {
        setSelectedDetailItem(null);
      }
    }
  };

  // Unique lists for filters
  const uniqueSectors = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.sector?.trim()) set.add(item.sector.trim());
    });
    return Array.from(set).sort((a, b) => {
      const aNum = parseInt(a.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });
  }, [items]);

  const uniqueStreets = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.streetName?.trim()) set.add(item.streetName.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matches =
          (item.sector && item.sector.toLowerCase().includes(q)) ||
          (item.workDescription && item.workDescription.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.streetName && item.streetName.toLowerCase().includes(q)) ||
          (item.permit && item.permit.toLowerCase().includes(q)) ||
          (item.status && item.status.toLowerCase().includes(q)) ||
          (item.duration && item.duration.toLowerCase().includes(q)) ||
          String(item.serialNumber).includes(q);

        if (!matches) return false;
      }

      // Sector
      if (filters.sector && item.sector !== filters.sector) {
        return false;
      }

      // Street
      if (filters.streetName && item.streetName !== filters.streetName) {
        return false;
      }

      // Permit
      if (filters.hasPermit === 'with_permit' && !item.permit?.trim()) {
        return false;
      }
      if (filters.hasPermit === 'without_permit' && item.permit?.trim()) {
        return false;
      }

      // Status
      if (filters.status && item.status !== filters.status) {
        return false;
      }

      // Chart interactive status category filter (مفتوح / جاري / منجز)
      if (chartStatusFilter) {
        const itemCategory = classifyWorkStatus(item);
        if (itemCategory !== chartStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [items, filters, chartStatusFilter]);

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col selection:bg-blue-900 selection:text-white font-sans">
      {/* Header */}
      <Header
        metadata={metadata}
        isLoading={isLoading}
        onRefresh={() => loadLiveData(apiUrl)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAddRow={() => setIsAddRowOpen(true)}
        onExport={() => exportToExcel(filteredItems, metadata.projectName)}
        onExportPdf={handleExportPdf}
        onPrint={handleExportPdf}
        onOpenScriptHelper={() => setIsScriptHelperOpen(true)}
        lastUpdated={lastUpdated}
        hasDetailedColumns={hasDetailedColumns}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:py-0 print:px-0">
        {/* Official Printable Report Header - Appears ONLY when printing */}
        <PrintReportHeader
          metadata={metadata}
          totalItems={items.length}
          openSectorsCount={items.filter(i => i.status?.includes('مفتوح')).length || items.length}
        />

        {/* Error Alert if any */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-800 flex items-center justify-between text-red-200 text-sm shadow-xs print:hidden">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="font-bold text-red-300">تعذر الاتصال برابط قاعدة البيانات:</p>
                <p className="text-xs mt-0.5 text-red-400 font-mono">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadLiveData(apiUrl)}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Loading overlay if first time loading and empty */}
        {isLoading && items.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 print:hidden">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-base font-bold text-slate-200">
              جاري الاتصال المباشر برابط Google Apps Script وقراءة بيانات الجدول...
            </p>
            <p className="text-xs text-slate-400 font-mono">{apiUrl}</p>
          </div>
        )}

        {/* Core Project Info Bar */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold shadow-inner">
              <Table className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white">
                {metadata.projectName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5 font-medium">
                <span className="text-slate-300">{metadata.contractor}</span>
                <span className="text-slate-600">•</span>
                <span>تاريخ التقرير: <strong className="text-slate-200 font-mono">{metadata.date}</strong></span>
                <span className="text-slate-600">•</span>
                <span>القطاعات المستلمة من الرابط: <strong className="text-blue-400 font-mono">{items.length} قطاع</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-sm"
              title="تصدير تقرير رسمي معتمد لكافة القطاعات بصيغة PDF"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>تصدير PDF ({items.length} قطاع)</span>
            </button>
            <button
              onClick={() => setIsRawDataOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold transition-colors shadow-sm"
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>فحص JSON الرابط ({items.length} قطاع)</span>
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              بيانات فعلية من الرابط الحي
            </span>
          </div>
        </div>

        {/* Compact Summary KPIs - Screen Only */}
        <div className="print:hidden">
          <KpiCards items={items} metadata={metadata} />
        </div>

        {/* Filter Bar - Screen Only */}
        <FilterBar
          filter={filters}
          onFilterChange={setFilters}
          uniqueSectors={uniqueSectors}
          uniqueStreets={uniqueStreets}
          totalFiltered={filteredItems.length}
          totalAll={items.length}
        />

        {/* Analytics & Charts Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">طريقة عرض الرسوم البيانية:</span>
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold text-slate-300 shadow-sm">
              <button
                onClick={() => setChartViewMode('compare')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  chartViewMode === 'compare'
                    ? 'bg-slate-800 text-indigo-300 border border-indigo-700/50 shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                <span>مقارنة قطاعين (Sector Comparison)</span>
              </button>

              <button
                onClick={() => setChartViewMode('line')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  chartViewMode === 'line'
                    ? 'bg-slate-800 text-blue-300 border border-blue-700/50 shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>الأداء التاريخي (Line Chart)</span>
              </button>

              <button
                onClick={() => setChartViewMode('pie')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  chartViewMode === 'pie'
                    ? 'bg-slate-800 text-amber-300 border border-amber-700/50 shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PieChartIcon className="w-4 h-4 text-amber-400" />
                <span>توزيع الحالات (Pie Chart)</span>
              </button>

              <button
                onClick={() => setChartViewMode('both')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  chartViewMode === 'both'
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-slate-300" />
                <span>عرض شامل (كافة الرسوم)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. Sector-to-Sector Performance Comparison Tool */}
        {(chartViewMode === 'compare' || chartViewMode === 'both') && (
          <SectorComparisonChart
            items={items}
            metadata={metadata}
            onSelectSectorItem={(item) => setSelectedDetailItem(item)}
          />
        )}

        {/* 2. Historical Performance Line Chart */}
        {(chartViewMode === 'line' || chartViewMode === 'both') && (
          <HistoricalPerformanceChart
            items={items}
            metadata={metadata}
          />
        )}

        {/* 3. Work Status Distribution Pie Chart */}
        {(chartViewMode === 'pie' || chartViewMode === 'both') && (
          <StatusPieChart
            items={items}
            selectedStatus={chartStatusFilter}
            onSelectStatus={(status) => setChartStatusFilter(status)}
          />
        )}

        {/* Primary High-Clarity Works Table */}
        <WorksTable
          items={filteredItems}
          onEditItem={(item) => setEditingItem(item)}
          onDeleteItem={handleDeleteItem}
          onViewDetail={(item) => setSelectedDetailItem(item)}
          onExportExcel={() => exportToExcel(filteredItems, metadata.projectName)}
          onExportPdf={handleExportPdf}
          onPrint={handleExportPdf}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenAddRow={() => setIsAddRowOpen(true)}
        />

        {/* Official Printable Report Signatures Footer - Appears ONLY when printing */}
        <PrintReportFooter />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/90 py-4 mt-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div>
            عقد تنفيذ شبكات صرف صحي العوالى 2 • مقاولة شركة نظم  البيئة للمقاولات
          </div>
          <div className="flex items-center gap-3 font-mono">
            <a
              href={apiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 text-slate-400 hover:underline"
            >
              <span>رابط Google Apps Script المباشر</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PdfExportModal
        isOpen={isPdfExportOpen}
        onClose={() => setIsPdfExportOpen(false)}
        items={filteredItems.length > 0 ? filteredItems : items}
        metadata={metadata}
        autoStart={true}
      />

      <RawDataModal
        isOpen={isRawDataOpen}
        onClose={() => setIsRawDataOpen(false)}
        rawEndpointData={rawEndpointData}
        apiUrl={apiUrl}
        lastUpdated={lastUpdated}
      />

      <SectorDetailModal
        isOpen={selectedDetailItem !== null}
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onEdit={(item) => {
          setSelectedDetailItem(null);
          setEditingItem(item);
        }}
      />

      <ExcelUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportSuccess={handleExcelImport}
      />

      <AddRowModal
        isOpen={isAddRowOpen}
        onClose={() => setIsAddRowOpen(false)}
        onAddRows={handleAddRows}
        existingCount={items.length}
      />

      <EditRowModal
        isOpen={editingItem !== null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />

      <ScriptHelperModal
        isOpen={isScriptHelperOpen}
        onClose={() => setIsScriptHelperOpen(false)}
      />
    </div>
  );
}
