import React, { useState, useRef, useMemo } from 'react';
import { 
  FileDown, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Eye, 
  Sliders, 
  Filter, 
  BarChart3, 
  PieChart, 
  Search, 
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  FileCheck,
  Building2,
  Calendar,
  HardHat,
  Pickaxe,
  Boxes
} from 'lucide-react';
import { WorkItem, ProjectMetadata } from '../types';
import { paginateItemsForPdf, downloadReportPdf } from '../utils/pdfDownloader';
import { 
  classifyWorkStatus, 
  WorkStageCategory, 
  STAGE_CATEGORIES, 
  ORDERED_STAGES 
} from '../utils/statusClassifier';

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeDonutSlice(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  let adjustedEnd = endAngle;
  if (adjustedEnd - startAngle >= 360) {
    adjustedEnd = startAngle + 359.999;
  }
  if (adjustedEnd <= startAngle) {
    adjustedEnd = startAngle + 0.1;
  }

  const startOuter = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const endOuter = polarToCartesian(centerX, centerY, outerRadius, adjustedEnd);
  const startInner = polarToCartesian(centerX, centerY, innerRadius, adjustedEnd);
  const endInner = polarToCartesian(centerX, centerY, innerRadius, startAngle);

  const arcSweep = adjustedEnd - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${arcSweep} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${arcSweep} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

const getStageBadgeStyle = (stageNumber: number) => {
  switch (stageNumber) {
    case 1:
      return { bg: '#f0f9ff', border: '#7dd3fc', text: '#0369a1' };
    case 2:
      return { bg: '#fffbeb', border: '#fcd34d', text: '#b45309' };
    case 3:
      return { bg: '#faf5ff', border: '#d8b4fe', text: '#6b21a8' };
    case 4:
      return { bg: '#f0fdfa', border: '#5eead4', text: '#0f766e' };
    case 5:
      return { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857' };
    default:
      return { bg: '#f8fafc', border: '#cbd5e1', text: '#334155' };
  }
};

const renderPdfStageIcon = (stageNumber: number, size = 16) => {
  switch (stageNumber) {
    case 1:
      return <HardHat style={{ width: size, height: size, color: '#0284c7' }} />;
    case 2:
      return <Pickaxe style={{ width: size, height: size, color: '#f59e0b' }} />;
    case 3:
      return <Layers style={{ width: size, height: size, color: '#8b5cf6' }} />;
    case 4:
      return <Boxes style={{ width: size, height: size, color: '#0d9488' }} />;
    case 5:
      return <CheckCircle2 style={{ width: size, height: size, color: '#10b981' }} />;
    default:
      return <HardHat style={{ width: size, height: size, color: '#0284c7' }} />;
  }
};

const renderPdfDonut = (
  stages: Array<{ count: number; color: string; title: string }>,
  total: number,
  size = 190
) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.27;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="#e2e8f0" strokeWidth={outerR - innerR} />
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="900" fill="#64748b">0</text>
        <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="bold" fill="#94a3b8">إجمالي القطاعات</text>
      </svg>
    );
  }

  let currentAngle = 0;
  const activeSlices = stages.filter((s) => s.count > 0);
  const hasMultiple = activeSlices.length > 1;
  const gapAngle = hasMultiple ? 3 : 0;

  const paths = stages.map((s, idx) => {
    if (s.count <= 0) return null;
    const sliceAngle = (s.count / total) * 360;
    const startAngle = currentAngle + (hasMultiple ? gapAngle / 2 : 0);
    const endAngle = currentAngle + sliceAngle - (hasMultiple ? gapAngle / 2 : 0);
    currentAngle += sliceAngle;

    const pathD = describeDonutSlice(cx, cy, innerR, outerR, startAngle, endAngle);

    return (
      <path
        key={`donut-slice-${idx}`}
        d={pathD}
        fill={s.color}
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="900"
        fill="#0f172a"
        fontFamily='"Tajawal", Arial, sans-serif'
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#64748b"
        fontFamily='"Tajawal", Arial, sans-serif'
      >
        إجمالي القطاعات
      </text>
    </svg>
  );
};

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: WorkItem[];
  metadata: ProjectMetadata;
  autoStart?: boolean;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  items,
  metadata,
}) => {
  // ==========================================
  // 1. FILTERING STATE (داخل نافذة التصدير)
  // ==========================================
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSector, setFilterSector] = useState('ALL');
  const [filterWorkType, setFilterWorkType] = useState('ALL');
  const [filterDuration, setFilterDuration] = useState('ALL');
  const [filterPermit, setFilterPermit] = useState('ALL');

  // ==========================================
  // 2. REPORT CUSTOMIZATION OPTIONS
  // ==========================================
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [consultantName, setConsultantName] = useState('دار الاستشارات الهندسية المشرف');
  const [contractNo, setContractNo] = useState('C-2024-AWL2-02');
  const [detailedDateColumns, setDetailedDateColumns] = useState(false);
  const [activePreviewPage, setActivePreviewPage] = useState(0);

  // ==========================================
  // 3. GENERATION & DOWNLOAD STATE
  // ==========================================
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Extract distinct sectors for filter dropdown
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.sector && item.sector.trim()) {
        set.add(item.sector.trim());
      }
    });
    return Array.from(set).sort();
  }, [items]);

  // Apply filters to items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search Query
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase().trim();
        const matchSector = item.sector?.toLowerCase().includes(q);
        const matchStreet = item.streetName?.toLowerCase().includes(q);
        const matchLine = item.lineNo?.toLowerCase().includes(q);
        const matchDesc = item.workDescription?.toLowerCase().includes(q);
        const matchPermit = item.permit?.toLowerCase().includes(q);
        const matchDigPermit = item.digPermitNo?.toLowerCase().includes(q);
        if (!matchSector && !matchStreet && !matchLine && !matchDesc && !matchPermit && !matchDigPermit) {
          return false;
        }
      }

      // 2. Sector Filter
      if (filterSector !== 'ALL' && item.sector !== filterSector) {
        return false;
      }

      // 3. Work Type Filter
      if (filterWorkType !== 'ALL') {
        const desc = (item.workDescription || '').toLowerCase();
        if (filterWorkType === 'ASPHALT') {
          const isAsphalt = 
            desc.includes('أسفلت') || 
            desc.includes('اسفلت') || 
            desc.includes('سفلت') || 
            desc.includes('ط1') || 
            desc.includes('ط2') || 
            desc.includes('mc-1') || 
            desc.includes('mc1') || 
            desc.includes('rc-') || 
            desc.includes('كشط') || 
            desc.includes('إعادة الوضع') || 
            desc.includes('اعادة الوضع');
          if (!isAsphalt) return false;
        } else if (filterWorkType === 'PIPES') {
          const isPipes = 
            !desc.includes('أسفلت') && !desc.includes('اسفلت') && !desc.includes('سفلت') &&
            (desc.includes('مواسير') || desc.includes('تمديد') || desc.includes('خط') || desc.includes('أنابيب') || desc.includes('انابيب'));
          if (!isPipes) return false;
        } else if (filterWorkType === 'BACKFILL') {
          const isBackfill = 
            !desc.includes('أسفلت') && !desc.includes('اسفلت') && !desc.includes('سفلت') && !desc.includes('ط1') && !desc.includes('ط2') &&
            (desc.includes('دفان') || desc.includes('ردم') || desc.includes('بحص') || desc.includes('رص'));
          if (!isBackfill) return false;
        } else if (filterWorkType === 'EXCAVATION') {
          const isExcavation = 
            !desc.includes('أسفلت') && !desc.includes('اسفلت') && !desc.includes('سفلت') &&
            desc.includes('حفر');
          if (!isExcavation) return false;
        }
      }

      // 4. Duration Filter
      const days = typeof item.openDays === 'number' ? item.openDays : (item.duration ? Number(item.duration) : null);
      if (filterDuration !== 'ALL') {
        if (filterDuration === 'CRITICAL_30' && (days === null || days <= 30)) return false;
        if (filterDuration === 'CRITICAL_60' && (days === null || days <= 60)) return false;
        if (filterDuration === 'NORMAL_30' && (days !== null && days > 30)) return false;
        if (filterDuration === 'NEW_15' && (days !== null && days > 15)) return false;
      }

      // 5. Permit Filter
      if (filterPermit !== 'ALL') {
        const hasPermit = Boolean(item.permit || item.digPermitNo);
        if (filterPermit === 'WITH_PERMIT' && !hasPermit) return false;
        if (filterPermit === 'WITHOUT_PERMIT' && hasPermit) return false;
      }

      return true;
    });
  }, [items, filterSearch, filterSector, filterWorkType, filterDuration, filterPermit]);

  const resetFilters = () => {
    setFilterSearch('');
    setFilterSector('ALL');
    setFilterWorkType('ALL');
    setFilterDuration('ALL');
    setFilterPermit('ALL');
  };

  // Dynamic pagination calculation
  const pageChunks = useMemo(() => {
    return paginateItemsForPdf(filteredItems, { 
      includeStats, 
      includeSignatures,
      includeCharts 
    });
  }, [filteredItems, includeStats, includeSignatures, includeCharts]);

  const totalPageCount = useMemo(() => {
    return includeCharts ? pageChunks.length + 1 : pageChunks.length;
  }, [includeCharts, pageChunks]);

  // Statistics calculation for KPIs and Visual Charts
  const stats = useMemo(() => {
    const totalCount = filteredItems.length;
    let totalLength = 0;
    let totalOpenDays = 0;
    let validDaysCount = 0;
    let criticalCount = 0;
    let highRiskCount = 0;
    let withPermitCount = 0;

    // 5 Stages Breakdown matching UI and standard project workflow
    const stageStats: Record<WorkStageCategory, { count: number; length: number }> = {
      'رص سيفتي': { count: 0, length: 0 },
      'حفر': { count: 0, length: 0 },
      'تمديد': { count: 0, length: 0 },
      'بحص اعلى ودفان': { count: 0, length: 0 },
      'mc1 و rc2 واسفلت': { count: 0, length: 0 },
    };

    // Duration categories
    let under15 = 0;
    let between15and30 = 0;
    let between31and60 = 0;
    let over60 = 0;

    // Sector lengths map
    const sectorLengthsMap: Record<string, number> = {};

    filteredItems.forEach((item) => {
      const len = typeof item.lengthMeters === 'number' && !isNaN(item.lengthMeters) ? item.lengthMeters : 0;
      totalLength += len;

      const stage = classifyWorkStatus(item);
      if (stageStats[stage]) {
        stageStats[stage].count++;
        stageStats[stage].length += len;
      }

      const sectorKey = item.sector || 'أخرى';
      sectorLengthsMap[sectorKey] = (sectorLengthsMap[sectorKey] || 0) + len;

      const days = typeof item.openDays === 'number' ? item.openDays : (item.duration ? Number(item.duration) : null);
      if (days !== null && !isNaN(days)) {
        totalOpenDays += days;
        validDaysCount++;
        if (days > 30) criticalCount++;
        if (days > 60) highRiskCount++;

        if (days <= 15) under15++;
        else if (days <= 30) between15and30++;
        else if (days <= 60) between31and60++;
        else over60++;
      }

      if (item.permit || item.digPermitNo) {
        withPermitCount++;
      }
    });

    const stagesBreakdown = ORDERED_STAGES.map((key) => {
      const meta = STAGE_CATEGORIES[key];
      const count = stageStats[key].count;
      const length = stageStats[key].length;
      const percentage = totalCount ? Math.round((count / totalCount) * 100) : 0;

      return {
        key,
        stageNumber: meta.stageNumber,
        title: meta.title,
        shortName: meta.shortName,
        subTitle: meta.subTitle,
        count,
        percentage,
        meters: Math.round(length * 10) / 10,
        color: meta.color,
        description: meta.scopeDescription,
      };
    });

    const avgDuration = validDaysCount > 0 ? Math.round(totalOpenDays / validDaysCount) : 0;
    const permitPercentage = totalCount > 0 ? Math.round((withPermitCount / totalCount) * 100) : 100;

    // Top sectors sorted by length
    const topSectors = Object.entries(sectorLengthsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      totalCount,
      totalLength: Math.round(totalLength * 10) / 10,
      avgDuration,
      criticalCount,
      highRiskCount,
      permitPercentage,
      withPermitCount,
      stagesBreakdown,
      // Duration breakdown
      durationBreakdown: [
        { label: 'أقل من 15 يوم (طبيعي)', count: under15, color: '#16a34a', percent: totalCount ? Math.round((under15 / totalCount) * 100) : 0 },
        { label: '15 - 30 يوم (مقبول)', count: between15and30, color: '#ca8a04', percent: totalCount ? Math.round((between15and30 / totalCount) * 100) : 0 },
        { label: '31 - 60 يوم (حرج متجاوز)', count: between31and60, color: '#ea580c', percent: totalCount ? Math.round((between31and60 / totalCount) * 100) : 0 },
        { label: 'أكثر من 60 يوم (شديد التأخير)', count: over60, color: '#dc2626', percent: totalCount ? Math.round((over60 / totalCount) * 100) : 0 },
      ],
      topSectors,
    };
  }, [filteredItems]);

  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleStartDownload = async () => {
    if (!containerRef.current) return;
    setIsGenerating(true);
    setProgress(5);
    setStatusMessage('جاري تهيئة الصفحات وعناصر التقرير والرسومات البيانية...');
    setError(null);
    setDownloadedFileName(null);

    try {
      // إعطاء فرصة كافية لتصيير الخطوط والرسومات في الذاكرة
      await new Promise((resolve) => setTimeout(resolve, 400));

      const pageElements = Array.from(
        containerRef.current.querySelectorAll('.pdf-page-canvas')
      ) as HTMLElement[];

      if (pageElements.length === 0) {
        throw new Error('تعذر العثور على صفحات التقرير، يرجى المحاولة مرة أخرى');
      }

      const fileName = await downloadReportPdf(pageElements, metadata, (percent, msg) => {
        setProgress(percent);
        setStatusMessage(msg);
      });

      setDownloadedFileName(fileName);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setError(err.message || 'حدث خطأ أثناء إنشاء ملف PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto print:hidden">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-800 overflow-hidden text-right text-slate-100 my-auto flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-700 via-rose-800 to-slate-900 text-white flex items-center justify-between border-b border-rose-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <FileDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">طباعة وتصدير تقرير رسمي معتمد (PDF)</h2>
                <span className="text-[10px] bg-red-950/80 text-red-200 border border-red-700 px-2 py-0.5 rounded-full font-bold">
                  A4 أفقي (Landscape)
                </span>
              </div>
              <p className="text-xs text-red-100 mt-0.5">
                تصدير احترافي مع الرسوم البيانية، الفلترة المتقدمة، ومصفوفة الاعتمادات الرسمية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* ==========================================
              1. SECTION: FILTERING & SUBSET SELECTION
             ========================================== */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Filter className="w-4 h-4" />
                <span>تصفية وتحديد محتويات التقرير (Filter Report Content)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-300">
                  سيتم تصدير: <strong className="text-emerald-400 font-black">{filteredItems.length}</strong> من إجمالي <strong className="text-white">{items.length} قطاع</strong>
                </span>
                {(filterSearch || filterSector !== 'ALL' || filterWorkType !== 'ALL' || filterDuration !== 'ALL' || filterPermit !== 'ALL') && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>إلغاء الفلاتر</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
              {/* Search */}
              <div>
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold">بحث بالاسم / الشارع / الرقم:</span>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="ابحث..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pr-8 pl-2 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Sector */}
              <div>
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold">القطاع:</span>
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                >
                  <option value="ALL">جميع القطاعات ({items.length})</option>
                  {availableSectors.map((s, sIdx) => (
                    <option key={`opt-sec-${s}-${sIdx}`} value={s}>
                      القطاع {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Type */}
              <div>
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold">مرحلة / نوع العمل:</span>
                <select
                  value={filterWorkType}
                  onChange={(e) => setFilterWorkType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                >
                  <option value="ALL">كافة الأعمال</option>
                  <option value="EXCAVATION">أعمال الحفر وتجهيز المسار</option>
                  <option value="PIPES">تمديد أنابيب الصرف الصحي</option>
                  <option value="BACKFILL">أعمال الردم والدفان</option>
                  <option value="ASPHALT">أعمال الأسفلت وإعادة الوضع</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold">مدة الفتح والمخاطر:</span>
                <select
                  value={filterDuration}
                  onChange={(e) => setFilterDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                >
                  <option value="ALL">كافة المدد</option>
                  <option value="CRITICAL_30">حرجة متجاوزة (&gt; 30 يوم)</option>
                  <option value="CRITICAL_60">شديدة التأخير (&gt; 60 يوم)</option>
                  <option value="NORMAL_30">اعتيادية (أقل من 30 يوم)</option>
                  <option value="NEW_15">حديثة (أقل من 15 يوم)</option>
                </select>
              </div>

              {/* Permit */}
              <div>
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold">حالة الفسح / التصريح:</span>
                <select
                  value={filterPermit}
                  onChange={(e) => setFilterPermit(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                >
                  <option value="ALL">الكل</option>
                  <option value="WITH_PERMIT">بفسح / إذن حفر ساري</option>
                  <option value="WITHOUT_PERMIT">بدون فسح / تصريح</option>
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-400 font-bold">فلاتر سريعة:</span>
              <button
                onClick={resetFilters}
                className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer border border-slate-700"
              >
                الكل ({items.length})
              </button>
              <button
                onClick={() => { resetFilters(); setFilterDuration('CRITICAL_30'); }}
                className="px-2.5 py-0.5 rounded-full text-[11px] bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-bold transition-colors cursor-pointer border border-rose-800"
              >
                القطاعات المتجاوزة &gt; 30 يوم
              </button>
              <button
                onClick={() => { resetFilters(); setFilterWorkType('EXCAVATION'); }}
                className="px-2.5 py-0.5 rounded-full text-[11px] bg-amber-950/70 hover:bg-amber-900 text-amber-300 font-bold transition-colors cursor-pointer border border-amber-800"
              >
                أعمال الحفر الجارية
              </button>
              <button
                onClick={() => { resetFilters(); setFilterWorkType('ASPHALT'); }}
                className="px-2.5 py-0.5 rounded-full text-[11px] bg-blue-950/70 hover:bg-blue-900 text-blue-300 font-bold transition-colors cursor-pointer border border-blue-800"
              >
                أعمال الأسفلت
              </button>
            </div>
          </div>

          {/* ==========================================
              2. SECTION: REPORT OPTIONS & CHARTS TOGGLE
             ========================================== */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-blue-400">
                <Sliders className="w-4 h-4" />
                <span>خيارات وضبط مخرجات التقرير (Report Customization)</span>
              </div>
              <div className="text-xs text-slate-400">
                إجمالي الصفحات المقدرة: <strong className="text-blue-400 font-mono text-sm">{totalPageCount} صفحات</strong>
              </div>
            </div>

            {/* Config Checkboxes & Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* Include Charts Toggle */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-blue-900/60 cursor-pointer hover:border-blue-700 transition-colors">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 bg-slate-950 border-slate-700"
                />
                <div>
                  <span className="text-blue-300 font-bold block flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                    صفحة الرسومات البيانية والإحصائية
                  </span>
                  <span className="text-[10px] text-slate-400">توليد لوحة رسوم بيانية ملونة بالصفحة الأولى</span>
                </div>
              </label>

              {/* Include Signatures Toggle */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 bg-slate-950 border-slate-700"
                />
                <div>
                  <span className="text-slate-200 font-bold block">مصفوفة التواقيع والاعتمادات</span>
                  <span className="text-[10px] text-slate-400">أختام وتواقيع: المقاول + الاستشاري + المالك</span>
                </div>
              </label>

              {/* Detailed Date Columns Toggle */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={detailedDateColumns}
                  onChange={(e) => setDetailedDateColumns(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 bg-slate-950 border-slate-700"
                />
                <div>
                  <span className="text-slate-200 font-bold block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    عرض التواريخ في أعمدة منفصلة
                  </span>
                  <span className="text-[10px] text-slate-400">فصل عمود تاريخ إصدار الفسح وعمود تاريخ إذن وبدء الحفر</span>
                </div>
              </label>

              {/* Consultant Name Input */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1 font-bold">الاستشاري المشرف:</span>
                <input
                  type="text"
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs font-medium focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Progress / Status Messages */}
          {isGenerating ? (
            <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-800 text-center space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-blue-300 font-bold text-sm">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                <span>{statusMessage || 'جاري توليد ملف PDF عالي الدقة مع الرسوم البيانية...'}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-300 font-mono">{progress}% مكتمل</p>
            </div>
          ) : downloadedFileName ? (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>تم إنشاء وتنزيل ملف الـ PDF بنجاح في مجلد التنزيلات!</span>
              </div>
              <p className="text-xs text-emerald-300 font-mono break-all pr-7">
                {downloadedFileName}
              </p>
              <p className="text-[11px] text-emerald-400 pr-7">
                تم تنسيق التقرير مع الرسوم البيانية والأختام وجداول الأعمال بدون أي تقطع في النصوص العربية.
              </p>
            </div>
          ) : null}

          {/* Error Message if any */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="font-bold">تعذر استكمال تصدير PDF:</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* ==========================================
              3. SECTION: LIVE PAGE PREVIEW CAROUSEL
             ========================================== */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-300 text-xs">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>معاينة صفحات التقرير ({totalPageCount} صفحات)</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {includeCharts && (
                  <button
                    onClick={() => setActivePreviewPage(0)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      activePreviewPage === 0
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>صفحة 1 (الرسومات)</span>
                  </button>
                )}
                {pageChunks.map((_, pIdx) => {
                  const actualPageNum = includeCharts ? pIdx + 1 : pIdx;
                  const isLast = pIdx === pageChunks.length - 1;
                  return (
                    <button
                      key={pIdx}
                      onClick={() => setActivePreviewPage(actualPageNum)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activePreviewPage === actualPageNum
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {isLast ? `صفحة ${actualPageNum + 1} (التواقيع)` : `صفحة ${actualPageNum + 1}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scaled Visual Preview Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs overflow-hidden">
              <div className="flex items-center justify-between mb-2 text-slate-400 text-[11px]">
                <span>
                  معاينة الصفحة {activePreviewPage + 1} من {totalPageCount}
                </span>
                <span>
                  {includeCharts && activePreviewPage === 0
                    ? 'لوحة الرسومات والمؤشرات الإحصائية'
                    : `جدول الأعمال (${filteredItems.length} قطاع مشمول)`}
                </span>
              </div>

              {/* Preview Content */}
              <div className="bg-white text-slate-900 rounded-lg p-3 shadow-inner border border-slate-300 max-h-60 overflow-y-auto font-sans">
                {includeCharts && activePreviewPage === 0 ? (
                  /* Charts Page Mini Preview */
                  <div className="space-y-3 text-right">
                    <div className="border-b border-slate-300 pb-2 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black text-slate-900">المملكة العربية السعودية • شركة المياه الوطنية</p>
                        <p className="text-[9.5px] font-bold text-blue-900">{metadata.projectName} - لوحة مراحل العمل الخمس</p>
                      </div>
                      <span className="text-[9px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-300">
                        توزيع مراحل العمل الخمس (Donut & Cards)
                      </span>
                    </div>

                    {/* 5 Stages Preview Box */}
                    <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[10px]">
                          <PieChart className="w-3.5 h-3.5 text-blue-600" />
                          <span>توزيع مراحل العمل الخمس للقطاعات ({stats.totalCount} قطاع • {stats.totalLength.toLocaleString('ar-SA')} م.ط)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        {stats.stagesBreakdown.map((stage, sIdx) => {
                          const badge = getStageBadgeStyle(stage.stageNumber);
                          return (
                            <div key={sIdx} className="bg-white border border-slate-200 rounded p-1.5 text-[9px] relative overflow-hidden">
                              <div className="absolute top-0 right-0 left-0 h-1" style={{ backgroundColor: stage.color }} />
                              <div className="flex items-center justify-between pt-1 mb-1">
                                <span className="font-black text-slate-900">{stage.title}</span>
                                <span className="text-[8px] font-mono px-1 rounded font-bold" style={{ backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                                  %{stage.percentage}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between font-mono font-bold text-slate-800">
                                <span>{stage.count} قطاع</span>
                                <span className="text-[8px] text-slate-500">{stage.meters} م</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Duration & Permits preview row */}
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div className="border border-slate-200 p-2 rounded bg-slate-50">
                        <p className="font-black text-slate-800 mb-1">تحليل فترات الفتح والمخاطر:</p>
                        <div className="space-y-1">
                          {stats.durationBreakdown.map((d, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[8px]">
                              <span style={{ color: d.color }} className="font-bold">{d.label}</span>
                              <strong className="font-mono">{d.count} قطاع ({d.percent}%)</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border border-slate-200 p-2 rounded bg-slate-50">
                        <p className="font-black text-slate-800 mb-1">مؤشر التراخيص والفسوحات الميدانية:</p>
                        <div className="flex items-center gap-3">
                          <div className="text-center font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded p-1.5 flex-shrink-0">
                            <div className="text-sm font-mono">%{stats.permitPercentage}</div>
                            <div className="text-[7.5px]">تصاريح سارية</div>
                          </div>
                          <div className="flex-1 text-[8px] space-y-1">
                            <div className="flex justify-between text-slate-700 border-b border-slate-200 pb-0.5">
                              <span>قطاعات بفسح/إذن:</span>
                              <strong className="text-emerald-700 font-mono">{stats.withPermitCount} قطاع</strong>
                            </div>
                            <div className="flex justify-between text-slate-700">
                              <span>قيد استخراج التصريح:</span>
                              <strong className="text-red-700 font-mono">{stats.totalCount - stats.withPermitCount} قطاع</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Table Pages Mini Preview */
                  <div>
                    <div className="border-b border-slate-300 pb-2 mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-slate-900">المملكة العربية السعودية • شركة المياه الوطنية</p>
                        <p className="text-[9px] text-blue-900 font-bold">{metadata.projectName}</p>
                      </div>
                      <div className="text-left text-[9px] text-slate-600">
                        <p>العقد: <strong className="text-slate-900">{contractNo}</strong></p>
                        <p>التاريخ: <strong className="text-slate-900">{metadata.date || currentDate}</strong></p>
                      </div>
                    </div>

                    {/* Table Preview */}
                    <table className="w-full text-[9px] border-collapse text-right">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300">
                          <th className="p-1 border border-slate-300 text-center w-6">م</th>
                          <th className="p-1 border border-slate-300">القطاع</th>
                          <th className="p-1 border border-slate-300 text-center">الخط</th>
                          <th className="p-1 border border-slate-300">الشارع</th>
                          <th className="p-1 border border-slate-300 text-center">الطول</th>
                          <th className="p-1 border border-slate-300">وصف العمل</th>
                          <th className="p-1 border border-slate-300 text-center">المدة والبدء</th>
                          {detailedDateColumns ? (
                            <>
                              <th className="p-1 border border-slate-300">الفسح وتاريخه</th>
                              <th className="p-1 border border-slate-300">إذن الحفر وتاريخه</th>
                            </>
                          ) : (
                            <th className="p-1 border border-slate-300">الفسح / الإذن والتواريخ</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(pageChunks[includeCharts ? activePreviewPage - 1 : activePreviewPage] || []).slice(0, 5).map((item, idx) => {
                          const permitDate = item.permitIssueDate || (item.raw && (item.raw['تارخ اصدار الفسح (ميلادي)'] || item.raw['تاريخ اصدار الفسح (ميلادي)'] || item.raw['تاريخ الفسح']));
                          const digDate = item.digPermitDate || item.startDate || (item.raw && (item.raw['تاريخ إذن الحفر \n( ميلادى)'] || item.raw['تاريخ إذن الحفر (ميلادي)'] || item.raw['تاريخ إذن الحفر']));

                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-1 border border-slate-200 text-center font-bold text-slate-600">{item.serialNumber}</td>
                              <td className="p-1 border border-slate-200 font-bold text-slate-900">{item.sector}</td>
                              <td className="p-1 border border-slate-200 text-center font-mono font-bold text-slate-800">{item.lineNo || '—'}</td>
                              <td className="p-1 border border-slate-200 truncate max-w-[120px]">{item.streetName || '—'}</td>
                              <td className="p-1 border border-slate-200 text-center font-bold text-blue-900">{item.lengthMeters ? `${item.lengthMeters}م` : '—'}</td>
                              <td className="p-1 border border-slate-200 truncate max-w-[150px]">{item.workDescription || '—'}</td>
                              <td className="p-1 border border-slate-200 text-center">
                                <span className="font-bold text-amber-900 block">{item.openDays !== undefined ? `${Math.round(item.openDays)}يوم` : (item.duration || '—')}</span>
                                {digDate && <span className="text-[7.5px] text-blue-800 font-semibold block font-mono">بدء: {digDate}</span>}
                              </td>
                              {detailedDateColumns ? (
                                <>
                                  <td className="p-1 border border-slate-200 text-[8px] text-slate-700">
                                    {item.permit ? <span className="font-bold block">فسح: {item.permit}</span> : <span className="text-slate-400">—</span>}
                                    {permitDate && <span className="text-emerald-700 font-semibold block font-mono text-[7px]">{permitDate}</span>}
                                  </td>
                                  <td className="p-1 border border-slate-200 text-[8px] text-slate-700">
                                    {item.digPermitNo ? <span className="font-semibold block">إذن: {item.digPermitNo}</span> : (!digDate && <span className="text-slate-400">—</span>)}
                                    {digDate && <span className="text-blue-700 font-semibold block font-mono text-[7px]">{digDate}</span>}
                                  </td>
                                </>
                              ) : (
                                <td className="p-1 border border-slate-200 text-[8px] text-slate-700">
                                  {item.permit && (
                                    <div>
                                      <span className="font-bold">فسح: {item.permit}</span>
                                      {permitDate && <span className="text-emerald-700 block font-mono text-[7.5px]">بتاريخ: {permitDate}</span>}
                                    </div>
                                  )}
                                  {(item.digPermitNo || digDate) && (
                                    <div className="mt-0.5">
                                      {item.digPermitNo && <span>إذن: {item.digPermitNo} </span>}
                                      {digDate && <span className="text-blue-700 font-mono text-[7.5px]">بتاريخ: {digDate}</span>}
                                    </div>
                                  )}
                                  {!item.permit && !item.digPermitNo && !digDate && <span className="text-slate-400">—</span>}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* Primary High-Def PDF Download */}
            <button
              onClick={handleStartDownload}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center gap-2 shadow-lg hover:shadow-red-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>{downloadedFileName ? 'إعادة تحميل ملف PDF' : 'تنزيل التقرير مع الرسوم البيانية (PDF)'}</span>
            </button>

            {/* Direct Browser Print */}
            <button
              onClick={handleDirectPrint}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer shadow-sm"
              title="طباعة مباشرة عبر طابعة النظام"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>طباعة فورية</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-slate-800"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* =========================================================================
          HIDDEN OFF-SCREEN CONTAINER FOR PDF GENERATION (Rendered for html2canvas-pro)
          CRITICAL: No letter-spacing to prevent breaking Arabic cursive ligatures!
         ========================================================================= */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '1120px',
          zIndex: -999,
          opacity: 0,
          pointerEvents: 'none',
          backgroundColor: '#ffffff',
          direction: 'rtl',
        }}
        dir="rtl"
      >
        {/* =======================================================
            PAGE 1: EXECUTIVE CHARTS & ANALYTICS PAGE (IF ENABLED)
           ======================================================= */}
        {includeCharts && (
          <div
            className="pdf-page-canvas"
            style={{
              width: '1120px',
              height: '792px',
              minHeight: '792px',
              maxHeight: '792px',
              padding: '24px 32px',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontFamily: '"Tajawal", "IBM Plex Sans Arabic", Arial, sans-serif',
              letterSpacing: 'normal',
            }}
          >
            {/* TOP: Official Header */}
            <div>
              <div style={{ borderBottom: '2.5px solid #0f172a', paddingBottom: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #cbd5e1' }}>
                  {/* Authority */}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: 'normal' }}>المملكة العربية السعودية</p>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#1e3a8a', margin: '2px 0 0 0', letterSpacing: 'normal' }}>شركة المياه الوطنية - القطاع الأوسط (مدينة الرياض)</p>
                    <p style={{ fontSize: '9.5px', color: '#475569', margin: '2px 0 0 0', letterSpacing: 'normal' }}>الإدارة العامة لمشاريع الصرف الصحي بمدينة الرياض</p>
                  </div>

                  {/* Title (Zero letter spacing to protect Arabic text) */}
                  <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: 'normal' }}>
                      تقرير المتابعة الميدانية والتحليل البياني للقطاعات المفتوحة
                    </h1>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1', margin: '3px 0 0 0', letterSpacing: 'normal' }}>
                      {metadata.projectName}
                    </p>
                    <span style={{ display: 'inline-block', marginTop: '3px', fontSize: '8.5px', fontWeight: 800, color: '#047857', backgroundColor: '#dcfce7', border: '1px solid #86efac', padding: '1px 8px', borderRadius: '4px', letterSpacing: 'normal' }}>
                      لوحة التحليل الإحصائي والرسومات البيانية المعتمدة
                    </span>
                  </div>

                  {/* Metadata */}
                  <div style={{ textAlign: 'left', fontSize: '9.5px', color: '#475569' }}>
                    <p style={{ margin: 0, letterSpacing: 'normal' }}>رقم العقد: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{contractNo}</strong></p>
                    <p style={{ margin: '2px 0 0 0', letterSpacing: 'normal' }}>تاريخ الإصدار: <strong style={{ color: '#0f172a' }}>{currentDate}</strong></p>
                    <p style={{ margin: '2px 0 0 0', letterSpacing: 'normal' }}>المقاول: <strong style={{ color: '#0f172a' }}>{metadata.contractor}</strong></p>
                  </div>
                </div>

                {/* 5 Executive KPI Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px' }}>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 800, display: 'block' }}>إجمالي القطاعات بالتقرير:</span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{stats.totalCount} قطاع</span>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 800, display: 'block' }}>إجمالي أطوال الحفر:</span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#1e3a8a' }}>{stats.totalLength.toLocaleString('ar-SA')} م.ط</span>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 800, display: 'block' }}>متوسط مدة الفتح:</span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: stats.avgDuration > 30 ? '#b91c1c' : '#0f172a' }}>{stats.avgDuration} يوم</span>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 800, display: 'block' }}>قطاعات متجاوزة (&gt;30 يوم):</span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: stats.criticalCount > 0 ? '#b91c1c' : '#047857' }}>{stats.criticalCount} قطاع</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 800, display: 'block' }}>نسبة تغطية الفسوحات:</span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#047857' }}>%{stats.permitPercentage}</span>
                  </div>
                </div>
              </div>

              {/* THE 5 STAGES DISTRIBUTION DASHBOARD PANEL (MATCHING UI & USER IMAGE) */}
              <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff', overflow: 'hidden', marginBottom: '10px' }}>
                {/* Header bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }}>
                      <PieChart style={{ width: '16px', height: '16px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '12.5px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: 'normal' }}>
                        توزيع مراحل العمل الخمس للقطاعات{' '}
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                          ({stats.totalCount} قطاع • {stats.totalLength.toLocaleString('ar-SA')} م.ط)
                        </span>
                      </h3>
                      <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0 0', letterSpacing: 'normal' }}>
                        تقسيم مراحل التنفيذ الميداني: 1- رص سيفتي • 2- حفر • 3- تمديد • 4- بحص اعلى ودفان • 5- mc1 و rc2 واسفلت
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#0369a1', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '4px' }}>
                    توزيع معتمد للمشروع
                  </span>
                </div>

                {/* Body: 5 Cards Grid on right, Donut on left */}
                <div style={{ display: 'flex', alignItems: 'stretch', padding: '10px 12px', gap: '12px' }}>
                  {/* Right side: 5 Cards Grid */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {stats.stagesBreakdown.map((stage, sIdx) => {
                      const badge = getStageBadgeStyle(stage.stageNumber);
                      return (
                        <div
                          key={sIdx}
                          style={{
                            border: '1.5px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            backgroundColor: '#ffffff',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '100px',
                          }}
                        >
                          {/* Top colored line indicator */}
                          <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: '4px', backgroundColor: stage.color }} />

                          <div>
                            {/* Header of card: Title + Dot and Icon */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', paddingTop: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color, display: 'inline-block' }} />
                                <span style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a' }}>{stage.title}</span>
                              </div>
                              {renderPdfStageIcon(stage.stageNumber, 15)}
                            </div>

                            {/* Metric count + Percentage Badge */}
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                                  {stage.count}
                                </span>
                                <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#64748b' }}>قطاع</span>
                              </div>

                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 900,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: badge.bg,
                                  color: badge.text,
                                  border: `1px solid ${badge.border}`,
                                  fontFamily: 'monospace',
                                }}
                              >
                                %{stage.percentage}
                              </span>
                            </div>

                            {/* Subtitle description */}
                            <p style={{ fontSize: '8.5px', color: '#64748b', margin: '0 0 4px 0', lineHeight: 1.25 }}>
                              {stage.subTitle}
                            </p>
                          </div>

                          {/* Bottom footer of card: Stage length */}
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9px' }}>
                            <span style={{ color: '#64748b', fontWeight: 700 }}>طول المرحلة:</span>
                            <span style={{ fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                              {stage.meters.toLocaleString('ar-SA')} م
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Left side: Donut Chart matching screenshot */}
                  <div style={{ width: '235px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1.5px solid #e2e8f0', paddingRight: '10px' }}>
                    {renderPdfDonut(stats.stagesBreakdown, stats.totalCount, 185)}
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                      توزيع نسب المراحل الخمس من إجمالي القطاعات
                    </span>
                  </div>
                </div>
              </div>

              {/* SECONDARY ANALYTICAL PANELS ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '10px' }}>
                {/* Duration & Aging Risk Analysis */}
                <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '10.5px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: 'normal' }}>
                      تصنيف مخاطر مدد الفتح وأعمار الحفريات
                    </h3>
                    <span style={{ fontSize: '8.5px', color: stats.criticalCount > 0 ? '#b91c1c' : '#16a34a', fontWeight: 800 }}>
                      {stats.criticalCount} قطاع متجاوز (&gt;30 يوم)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {stats.durationBreakdown.map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', fontWeight: 800, marginBottom: '2px' }}>
                          <span style={{ color: item.color }}>● {item.label}</span>
                          <span style={{ color: '#0f172a' }}>
                            <strong>{item.count}</strong> قطاع ({item.percent}%)
                          </span>
                        </div>
                        <div style={{ height: '7px', backgroundColor: '#f1f5f9', borderRadius: '3.5px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <div style={{ height: '100%', width: `${Math.max(item.percent, 2)}%`, backgroundColor: item.color, borderRadius: '3.5px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permit Compliance & Safety Status */}
                <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '10.5px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: 'normal' }}>
                      مؤشر التراخيص والفسوحات الميدانية (بلدي / الأمانة)
                    </h3>
                    <span style={{ fontSize: '8.5px', color: '#047857', fontWeight: 800 }}>امتثال ميداني</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '80px' }}>
                    {/* Visual Meter Box */}
                    <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '5px solid #16a34a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', flexShrink: 0 }}>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#15803d' }}>%{stats.permitPercentage}</span>
                      <span style={{ fontSize: '7px', fontWeight: 800, color: '#166534' }}>تصاريح سارية</span>
                    </div>

                    {/* Stats List */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '8.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '2px' }}>
                        <span style={{ color: '#475569' }}>قطاعات بفسح أو إذن حفر:</span>
                        <strong style={{ color: '#15803d' }}>{stats.withPermitCount} قطاع</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '2px' }}>
                        <span style={{ color: '#475569' }}>قطاعات قيد استخراج التصريح:</span>
                        <strong style={{ color: '#b91c1c' }}>{stats.totalCount - stats.withPermitCount} قطاع</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#475569' }}>مستوى السلامة والتنسيق:</span>
                        <strong style={{ color: stats.permitPercentage > 80 ? '#15803d' : '#b45309' }}>
                          {stats.permitPercentage > 80 ? 'ممتاز (ممتثل للأنظمة)' : 'يتطلب متابعة سريعة'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM: Footer of Page 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', paddingTop: '6px', borderTop: '1px solid #cbd5e1' }}>
              <span>نظام متابعة الأعمال والقطاعات الميدانية • مستخرج رسمياً من قاعدة البيانات الحية المعتمدة</span>
              <span style={{ fontFamily: 'monospace', color: '#334155' }}>REP-NWC-AWL2-CHART-{currentDate.replace(/\//g, '')}</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>
                الصفحة 1 من {totalPageCount} (لوحة الرسومات البيانية)
              </span>
            </div>
          </div>
        )}

        {/* =======================================================
            PAGES 2+: DETAILED WORK SECTORS TABLES & SIGNATURES
           ======================================================= */}
        {pageChunks.map((chunk, pageIndex) => {
          const isFirstTablePage = pageIndex === 0;
          const isLastTablePage = pageIndex === pageChunks.length - 1;
          const displayPageNum = includeCharts ? pageIndex + 2 : pageIndex + 1;

          return (
            <div
              key={`table-page-${pageIndex}`}
              className="pdf-page-canvas"
              style={{
                width: '1120px',
                height: '792px',
                minHeight: '792px',
                maxHeight: '792px',
                padding: '24px 32px',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily: '"Tajawal", "IBM Plex Sans Arabic", Arial, sans-serif',
                letterSpacing: 'normal',
              }}
            >
              {/* TOP SECTION */}
              <div>
                {/* 1. Header Logic */}
                {!includeCharts && isFirstTablePage ? (
                  /* Full Executive Header when Charts are not a standalone page */
                  <div style={{ borderBottom: '2.5px solid #0f172a', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #cbd5e1' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: 'normal' }}>المملكة العربية السعودية</p>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: '#1e3a8a', margin: '2px 0 0 0', letterSpacing: 'normal' }}>شركة المياه الوطنية - القطاع الأوسط (مدينة الرياض)</p>
                        <p style={{ fontSize: '9.5px', color: '#475569', margin: '2px 0 0 0', letterSpacing: 'normal' }}>الإدارة العامة لمشاريع الصرف الصحي بمدينة الرياض</p>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: 'normal' }}>
                          تقرير المتابعة الميدانية للقطاعات المفتوحة وأعمال الحفر
                        </h1>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1', margin: '3px 0 0 0', letterSpacing: 'normal' }}>
                          {metadata.projectName}
                        </p>
                        <span style={{ display: 'inline-block', marginTop: '3px', fontSize: '8.5px', fontWeight: 800, color: '#047857', backgroundColor: '#dcfce7', border: '1px solid #86efac', padding: '1px 8px', borderRadius: '4px', letterSpacing: 'normal' }}>
                          وثيقة رسمية معتمدة للاستشاري والمقاول
                        </span>
                      </div>

                      <div style={{ textAlign: 'left', fontSize: '9.5px', color: '#475569' }}>
                        <p style={{ margin: 0, letterSpacing: 'normal' }}>رقم العقد: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{contractNo}</strong></p>
                        <p style={{ margin: '2px 0 0 0', letterSpacing: 'normal' }}>تاريخ الإصدار: <strong style={{ color: '#0f172a' }}>{currentDate}</strong></p>
                        <p style={{ margin: '2px 0 0 0', letterSpacing: 'normal' }}>الوقت: <strong style={{ color: '#0f172a' }}>{currentTime}</strong></p>
                      </div>
                    </div>

                    {includeStats && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px' }}>
                        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                          <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 800, display: 'block' }}>إجمالي القطاعات:</span>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>{stats.totalCount} قطاع</span>
                        </div>
                        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                          <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 800, display: 'block' }}>إجمالي أطوال الحفر:</span>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e3a8a' }}>{stats.totalLength.toLocaleString('ar-SA')} م.ط</span>
                        </div>
                        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                          <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 800, display: 'block' }}>متوسط مدة الفتح:</span>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: stats.avgDuration > 30 ? '#b91c1c' : '#0f172a' }}>{stats.avgDuration} يوم</span>
                        </div>
                        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                          <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 800, display: 'block' }}>قطاعات متجاوزة (&gt;30 يوم):</span>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: stats.criticalCount > 0 ? '#b91c1c' : '#047857' }}>{stats.criticalCount} قطاع</span>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 800, display: 'block' }}>المقاول المنفذ:</span>
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#0f172a' }}>{metadata.contractor}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Running Mini Header on other pages */
                  <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '6px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                    <div style={{ fontWeight: 900, color: '#0f172a', letterSpacing: 'normal' }}>
                      تقرير متابعة القطاعات المفتوحة • {metadata.projectName} (جدول حصر الأعمال الميدانية)
                    </div>
                    <div style={{ color: '#475569', fontSize: '9.5px', letterSpacing: 'normal' }}>
                      العقد: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{contractNo}</strong> | المقاول: {metadata.contractor} | التاريخ: {metadata.date || currentDate}
                    </div>
                  </div>
                )}

                {/* 2. Official Engineering Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 900, border: '1px solid #0f172a' }}>
                      <th style={{ padding: '6px 4px', border: '1px solid #334155', textAlign: 'center', width: detailedDateColumns ? '28px' : '32px' }}>م</th>
                      <th style={{ padding: '6px 6px', border: '1px solid #334155', width: detailedDateColumns ? '80px' : '90px' }}>القطاع</th>
                      <th style={{ padding: '6px 4px', border: '1px solid #334155', textAlign: 'center', width: detailedDateColumns ? '48px' : '55px' }}>رقم الخط</th>
                      <th style={{ padding: '6px 6px', border: '1px solid #334155', width: detailedDateColumns ? '130px' : '155px' }}>اسم الشارع</th>
                      <th style={{ padding: '6px 4px', border: '1px solid #334155', textAlign: 'center', width: detailedDateColumns ? '48px' : '60px' }}>طول القطاع</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #334155' }}>وصف العمل الحالي المعتمد</th>
                      {detailedDateColumns ? (
                        <>
                          <th style={{ padding: '6px 4px', border: '1px solid #334155', textAlign: 'center', width: '52px' }}>مدة الفتح</th>
                          <th style={{ padding: '6px 4px', border: '1px solid #334155', textAlign: 'center', width: '74px' }}>تاريخ بدء الحفر</th>
                          <th style={{ padding: '6px 6px', border: '1px solid #334155', width: '95px' }}>الفسح وتاريخه</th>
                          <th style={{ padding: '6px 6px', border: '1px solid #334155', width: '95px' }}>إذن الحفر وتاريخه</th>
                        </>
                      ) : (
                        <>
                          <th style={{ padding: '6px 4px', border: '1px solid #334155', textAlign: 'center', width: '78px' }}>مدة الفتح والبدء</th>
                          <th style={{ padding: '6px 6px', border: '1px solid #334155', width: '135px' }}>الفسح وإذن الحفر والتواريخ</th>
                        </>
                      )}
                      <th style={{ padding: '6px 4px', border: '1px solid #334155', textAlign: 'center', width: detailedDateColumns ? '68px' : '75px' }}>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((item, rowIdx) => {
                      const isEven = rowIdx % 2 === 0;
                      const days = typeof item.openDays === 'number' ? Math.round(item.openDays) : (item.duration ? Number(item.duration) : null);
                      const isCritical = days !== null && days > 30;
                      const permitDate = item.permitIssueDate || (item.raw && (item.raw['تارخ اصدار الفسح (ميلادي)'] || item.raw['تاريخ اصدار الفسح (ميلادي)'] || item.raw['تاريخ الفسح']));
                      const digDate = item.digPermitDate || item.startDate || (item.raw && (item.raw['تاريخ إذن الحفر \n( ميلادى)'] || item.raw['تاريخ إذن الحفر (ميلادي)'] || item.raw['تاريخ إذن الحفر']));

                      return (
                        <tr
                          key={`${item.id || 'pdf-row'}_${rowIdx}`}
                          style={{
                            border: '1px solid #cbd5e1',
                            backgroundColor: isEven ? '#ffffff' : '#f8fafc',
                          }}
                        >
                          <td style={{ padding: '4.5px 4px', textAlign: 'center', fontWeight: 800, color: '#334155', border: '1px solid #cbd5e1' }}>
                            {item.serialNumber}
                          </td>
                          <td style={{ padding: '4.5px 6px', fontWeight: 900, color: '#0f172a', border: '1px solid #cbd5e1' }}>
                            {item.sector}
                          </td>
                          <td style={{ padding: '4.5px 4px', textAlign: 'center', fontWeight: 800, color: '#1e3a8a', fontFamily: 'monospace', border: '1px solid #cbd5e1' }}>
                            {item.lineNo || '—'}
                          </td>
                          <td style={{ padding: '4.5px 6px', fontWeight: 700, color: '#0f172a', border: '1px solid #cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: detailedDateColumns ? '125px' : '150px' }}>
                            {item.streetName || '—'}
                          </td>
                          <td style={{ padding: '4.5px 4px', textAlign: 'center', fontWeight: 800, color: '#0369a1', border: '1px solid #cbd5e1' }}>
                            {item.lengthMeters !== undefined ? `${item.lengthMeters} م` : '—'}
                          </td>
                          <td style={{ padding: '4.5px 6px', fontWeight: 700, color: '#0f172a', border: '1px solid #cbd5e1', lineHeight: '1.25' }}>
                            {(() => {
                              const stageKey = classifyWorkStatus(item);
                              const meta = STAGE_CATEGORIES[stageKey];
                              const badgeStyle = getStageBadgeStyle(meta.stageNumber);
                              return (
                                <div>
                                  <div style={{ marginBottom: '2px' }}>
                                    <span
                                      style={{
                                        fontSize: '7.5px',
                                        fontWeight: 800,
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        backgroundColor: badgeStyle.bg,
                                        color: badgeStyle.text,
                                        border: `1px solid ${badgeStyle.border}`,
                                        display: 'inline-block',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {meta.title}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '8.5px', color: '#0f172a' }}>
                                    {item.workDescription || '—'}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          {detailedDateColumns ? (
                            <>
                              <td style={{ padding: '4.5px 3px', textAlign: 'center', fontWeight: 900, color: isCritical ? '#b91c1c' : '#78350f', border: '1px solid #cbd5e1', fontSize: '9px' }}>
                                {days !== null ? `${days} يوم` : '—'}
                              </td>
                              <td style={{ padding: '4.5px 3px', textAlign: 'center', fontWeight: 800, color: '#1e3a8a', fontFamily: 'monospace', fontSize: '8px', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                                {digDate || '—'}
                              </td>
                              <td style={{ padding: '4.5px 5px', fontSize: '8.5px', border: '1px solid #cbd5e1', lineHeight: '1.2' }}>
                                {item.permit ? <div style={{ fontWeight: 800, color: '#0f172a' }}>فسح: {item.permit}</div> : <span style={{ color: '#94a3b8' }}>—</span>}
                                {permitDate ? (
                                  <div style={{ fontSize: '7.5px', color: '#047857', fontWeight: 800, fontFamily: 'monospace' }}>
                                    بتاريخ: {permitDate}
                                  </div>
                                ) : null}
                              </td>
                              <td style={{ padding: '4.5px 5px', fontSize: '8.5px', border: '1px solid #cbd5e1', lineHeight: '1.2' }}>
                                {item.digPermitNo ? <div style={{ color: '#1e293b', fontSize: '8px', fontWeight: 700 }}>إذن: {item.digPermitNo}</div> : (!digDate && <span style={{ color: '#94a3b8' }}>—</span>)}
                                {digDate ? (
                                  <div style={{ fontSize: '7.5px', color: '#1e40af', fontWeight: 800, fontFamily: 'monospace' }}>
                                    بتاريخ: {digDate}
                                  </div>
                                ) : null}
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '4px 3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                                <div style={{ fontWeight: 900, color: isCritical ? '#b91c1c' : '#78350f', fontSize: '9.5px' }}>
                                  {days !== null ? `${days} يوم` : '—'}
                                </div>
                                {digDate ? (
                                  <div style={{ fontSize: '7.5px', color: '#1e3a8a', fontWeight: 800, marginTop: '2px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                                    بدء: {digDate}
                                  </div>
                                ) : null}
                              </td>
                              <td style={{ padding: '4.5px 6px', fontSize: '8.5px', border: '1px solid #cbd5e1', lineHeight: '1.25' }}>
                                {item.permit ? (
                                  <div style={{ marginBottom: (item.digPermitNo || digDate) ? '3px' : '0' }}>
                                    <div style={{ fontWeight: 800, color: '#0f172a' }}>فسح: {item.permit}</div>
                                    {permitDate ? (
                                      <div style={{ fontSize: '7.5px', color: '#047857', fontWeight: 800, fontFamily: 'monospace' }}>
                                        بتاريخ: {permitDate}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}
                                {(item.digPermitNo || digDate) ? (
                                  <div>
                                    {item.digPermitNo ? (
                                      <div style={{ color: '#1e293b', fontSize: '8px', fontWeight: 700 }}>إذن: {item.digPermitNo}</div>
                                    ) : null}
                                    {digDate ? (
                                      <div style={{ fontSize: '7.5px', color: '#1e40af', fontWeight: 800, fontFamily: 'monospace' }}>
                                        بتاريخ: {digDate}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}
                                {!item.permit && !item.digPermitNo && !digDate && <span style={{ color: '#94a3b8' }}>—</span>}
                              </td>
                            </>
                          )}

                          <td style={{ padding: '4.5px 4px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 800,
                              fontSize: '8.5px',
                              backgroundColor: ((item.status || '').includes('مغلق') || (item.status || '').includes('مكتمل')) ? '#dbeafe' : '#dcfce7',
                              color: ((item.status || '').includes('مغلق') || (item.status || '').includes('مكتمل')) ? '#1e40af' : '#15803d',
                              border: ((item.status || '').includes('مغلق') || (item.status || '').includes('مكتمل')) ? '1px solid #93c5fd' : '1px solid #86efac'
                            }}>
                              {((item.status || '').includes('مغلق') || (item.status || '').includes('مكتمل')) ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* BOTTOM SECTION */}
              <div>
                {/* 3. Official Signatures Matrix on Last Table Page */}
                {includeSignatures && isLastTablePage && (
                  <div style={{ border: '1.5px solid #94a3b8', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#f8fafc', marginTop: '6px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', textAlign: 'center', fontSize: '9.5px' }}>
                      {/* Site Engineer */}
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', backgroundColor: '#ffffff' }}>
                        <p style={{ fontWeight: 900, color: '#0f172a', margin: '0 0 2px 0', letterSpacing: 'normal' }}>مهندس الموقع (المقاول المنفذ)</p>
                        <p style={{ color: '#475569', fontSize: '8.5px', margin: '0 0 14px 0', letterSpacing: 'normal' }}>{metadata.contractor}</p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '80%', margin: '0 auto 4px auto' }}></div>
                        <p style={{ fontSize: '8px', color: '#64748b', margin: 0, letterSpacing: 'normal' }}>التوقيع والختم المعتمد</p>
                      </div>

                      {/* Supervision Consultant */}
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', backgroundColor: '#ffffff' }}>
                        <p style={{ fontWeight: 900, color: '#0f172a', margin: '0 0 2px 0', letterSpacing: 'normal' }}>مهندس الإشراف وضبط الجودة (الاستشاري)</p>
                        <p style={{ color: '#475569', fontSize: '8.5px', margin: '0 0 14px 0', letterSpacing: 'normal' }}>{consultantName}</p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '80%', margin: '0 auto 4px auto' }}></div>
                        <p style={{ fontSize: '8px', color: '#64748b', margin: 0, letterSpacing: 'normal' }}>التوقيع والمصادقة</p>
                      </div>

                      {/* Project Manager */}
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', backgroundColor: '#ffffff' }}>
                        <p style={{ fontWeight: 900, color: '#0f172a', margin: '0 0 2px 0', letterSpacing: 'normal' }}>مدير إدارة مشاريع الصرف الصحي (المالك)</p>
                        <p style={{ color: '#475569', fontSize: '8.5px', margin: '0 0 14px 0', letterSpacing: 'normal' }}>شركة المياه الوطنية - القطاع الأوسط (مدينة الرياض)</p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '80%', margin: '0 auto 4px auto' }}></div>
                        <p style={{ fontSize: '8px', color: '#64748b', margin: 0, letterSpacing: 'normal' }}>الاعتماد النهائي والختم</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Official Running Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', paddingTop: '6px', marginTop: '6px', borderTop: '1px solid #cbd5e1' }}>
                  <span>نظام متابعة الأعمال والقطاعات الميدانية • مستخرج رسمياً من قاعدة البيانات الحية المعتمدة</span>
                  <span style={{ fontFamily: 'monospace', color: '#334155' }}>REP-NWC-AWL2-{currentDate.replace(/\//g, '')}</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>
                    صفحة {displayPageNum} من {totalPageCount}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
