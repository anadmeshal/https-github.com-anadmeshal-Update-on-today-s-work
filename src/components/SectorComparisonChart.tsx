import React, { useState, useMemo } from 'react';
import { WorkItem, ProjectMetadata } from '../types';
import {
  buildSectorProfiles,
  analyzeSectorsComparison,
  SectorProfile,
  WORK_STAGES,
} from '../utils/sectorProgress';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  ArrowLeftRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Ruler,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  Calendar,
  FileText,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface SectorComparisonChartProps {
  items: WorkItem[];
  metadata?: ProjectMetadata;
  onSelectSectorItem?: (item: WorkItem) => void;
}

export const SectorComparisonChart: React.FC<SectorComparisonChartProps> = ({
  items,
  metadata,
  onSelectSectorItem,
}) => {
  // 1. Build sector profiles from all current items
  const sectorProfiles = useMemo(() => {
    return buildSectorProfiles(items);
  }, [items]);

  // 2. Select initial sectors (e.g., first and second, or MH8 MH7 and MH9 MH8 if available)
  const defaultA = useMemo(() => {
    const found = sectorProfiles.find((s) => s.sectorName === 'MH8 MH7');
    return found ? found.sectorName : sectorProfiles[0]?.sectorName || '';
  }, [sectorProfiles]);

  const defaultB = useMemo(() => {
    const found = sectorProfiles.find((s) => s.sectorName === 'MH9 MH8');
    return found ? found.sectorName : sectorProfiles[1]?.sectorName || sectorProfiles[0]?.sectorName || '';
  }, [sectorProfiles]);

  const [selectedSectorAName, setSelectedSectorAName] = useState<string>(defaultA);
  const [selectedSectorBName, setSelectedSectorBName] = useState<string>(defaultB);

  // Sync state if sectorProfiles change and selected is empty
  React.useEffect(() => {
    if (!selectedSectorAName && sectorProfiles.length > 0) {
      setSelectedSectorAName(sectorProfiles[0].sectorName);
    }
    if (!selectedSectorBName && sectorProfiles.length > 1) {
      setSelectedSectorBName(sectorProfiles[1].sectorName);
    }
  }, [sectorProfiles, selectedSectorAName, selectedSectorBName]);

  const sectorA = useMemo(() => {
    return sectorProfiles.find((s) => s.sectorName === selectedSectorAName) || sectorProfiles[0];
  }, [sectorProfiles, selectedSectorAName]);

  const sectorB = useMemo(() => {
    return sectorProfiles.find((s) => s.sectorName === selectedSectorBName) || sectorProfiles[1] || sectorProfiles[0];
  }, [sectorProfiles, selectedSectorBName]);

  // 3. Detailed Comparative Analysis
  const analysis = useMemo(() => {
    if (!sectorA || !sectorB) return null;
    return analyzeSectorsComparison(sectorA, sectorB);
  }, [sectorA, sectorB]);

  // Swap handler
  const handleSwap = () => {
    const temp = selectedSectorAName;
    setSelectedSectorAName(selectedSectorBName);
    setSelectedSectorBName(temp);
  };

  // Quick Preset Handlers
  const handlePresetTopVsLowest = () => {
    if (sectorProfiles.length < 2) return;
    const sorted = [...sectorProfiles].sort((a, b) => b.progressPercent - a.progressPercent);
    setSelectedSectorAName(sorted[0].sectorName);
    setSelectedSectorBName(sorted[sorted.length - 1].sectorName);
  };

  const handlePresetLongest = () => {
    if (sectorProfiles.length < 2) return;
    const sorted = [...sectorProfiles].sort((a, b) => b.totalLengthMeters - a.totalLengthMeters);
    setSelectedSectorAName(sorted[0].sectorName);
    setSelectedSectorBName(sorted[1].sectorName);
  };

  const handlePresetAsphaltVsExcavation = () => {
    const asphalt = sectorProfiles.find((s) => s.progressPercent === 100) || sectorProfiles[0];
    const excavation = sectorProfiles.find((s) => s.progressPercent <= 30) || sectorProfiles[sectorProfiles.length - 1];
    if (asphalt && excavation) {
      setSelectedSectorAName(asphalt.sectorName);
      setSelectedSectorBName(excavation.sectorName);
    }
  };

  // Chart data for comparing metrics directly
  const metricsComparisonData = useMemo(() => {
    if (!sectorA || !sectorB) return [];

    return [
      {
        metric: 'نسبة الإنجاز',
        unit: '%',
        sectorAVal: sectorA.progressPercent,
        sectorBVal: sectorB.progressPercent,
        sectorAName: sectorA.sectorName,
        sectorBName: sectorB.sectorName,
      },
      {
        metric: 'طول القطاع',
        unit: 'م',
        sectorAVal: sectorA.totalLengthMeters,
        sectorBVal: sectorB.totalLengthMeters,
        sectorAName: sectorA.sectorName,
        sectorBName: sectorB.sectorName,
      },
      {
        metric: 'مدة الفتح',
        unit: 'يوم',
        sectorAVal: Math.round(sectorA.openDays),
        sectorBVal: Math.round(sectorB.openDays),
        sectorAName: sectorA.sectorName,
        sectorBName: sectorB.sectorName,
      },
      {
        metric: 'المعدل اليومي',
        unit: 'م/يوم',
        sectorAVal: sectorA.dailyRateMetersPerDay,
        sectorBVal: sectorB.dailyRateMetersPerDay,
        sectorAName: sectorA.sectorName,
        sectorBName: sectorB.sectorName,
      },
    ];
  }, [sectorA, sectorB]);

  // Custom Tooltip for Metrics Comparison Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const metricItem = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px] z-50">
          <div className="font-extrabold text-sm border-b border-slate-700 pb-1.5 mb-2 text-amber-400">
            {label}
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sky-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                {sectorA?.sectorName}:
              </span>
              <span className="font-bold text-white font-mono text-sm">
                {metricItem.sectorAVal} {metricItem.unit}
              </span>
            </div>
            <div className="flex justify-between items-center text-purple-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                {sectorB?.sectorName}:
              </span>
              <span className="font-bold text-white font-mono text-sm">
                {metricItem.sectorBVal} {metricItem.unit}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>الفارق:</span>
              <span className="font-bold font-mono text-white">
                {Math.abs(Math.round((metricItem.sectorAVal - metricItem.sectorBVal) * 10) / 10)} {metricItem.unit}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (sectorProfiles.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center text-slate-400">
        لا توجد بيانات قطاعات متاحة للمقارنة حالياً.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl mb-5 overflow-hidden print:hidden">
      {/* Top Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-xs">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              أداة مقارنة أداء ونسب إنجاز القطاعات
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                مقارنة ثنائية تفاعلية
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              حدد أي قطاعين عبر القوائم المنسدلة لتحليل التباين في نسب الإنجاز، مراحل العمل الميداني، والأطوال
            </p>
          </div>
        </div>

        {/* Quick Comparison Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 font-medium">مقارنات مقترحة:</span>
          <button
            onClick={handlePresetTopVsLowest}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 shadow-sm transition-all cursor-pointer"
          >
            الأعلى vs الأقل إنجازاً
          </button>
          <button
            onClick={handlePresetLongest}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 shadow-sm transition-all cursor-pointer"
          >
            أطول قطاعين
          </button>
          <button
            onClick={handlePresetAsphaltVsExcavation}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 shadow-sm transition-all cursor-pointer"
          >
            منجز أسفلت vs جاري حفر
          </button>
        </div>
      </div>

      {/* Dropdown Selectors Bar */}
      <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          {/* Dropdown 1: Sector A */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-blue-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                القطاع الأول (القطاع أ):
              </label>
              {sectorA && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800">
                  إنجاز: {sectorA.progressPercent}% • {sectorA.stage.shortName}
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedSectorAName}
                onChange={(e) => setSelectedSectorAName(e.target.value)}
                className="w-full bg-slate-900 border-2 border-blue-900/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-900 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-100 shadow-sm cursor-pointer appearance-none text-right pr-4 pl-8"
              >
                {sectorProfiles.map((p) => (
                  <option key={`opt-a-${p.sectorName}`} value={p.sectorName} className="bg-slate-950 text-slate-200">
                    {p.displayName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-blue-400">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Swap Button (Middle) */}
          <div className="md:col-span-1 flex justify-center pt-2 md:pt-4">
            <button
              onClick={handleSwap}
              title="تبديل القطاعين"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 shadow-sm transition-all text-slate-300 active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
            </button>
          </div>

          {/* Dropdown 2: Sector B */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                القطاع الثاني (القطاع ب):
              </label>
              {sectorB && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800">
                  إنجاز: {sectorB.progressPercent}% • {sectorB.stage.shortName}
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedSectorBName}
                onChange={(e) => setSelectedSectorBName(e.target.value)}
                className="w-full bg-slate-900 border-2 border-purple-900/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-900 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-100 shadow-sm cursor-pointer appearance-none text-right pr-4 pl-8"
              >
                {sectorProfiles.map((p) => (
                  <option key={`opt-b-${p.sectorName}`} value={p.sectorName} className="bg-slate-950 text-slate-200">
                    {p.displayName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-purple-400">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      {sectorA && sectorB && analysis && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* 1. Executive Gap Headline Banner */}
          <div className="p-4 rounded-xl border bg-slate-950/80 border-indigo-900/60 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                    نتيجة تحليل مقارنة الأداء بين القطاعين
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-white">
                  {analysis.summaryHeadline}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                  {analysis.recommendation}
                </p>
              </div>

              {/* Comparative Delta Badges */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div className="bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 shadow-sm flex flex-col">
                  <span className="text-[11px] text-slate-400 font-medium">فارق الإنجاز (أ - ب):</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {analysis.progressDiff > 0 ? (
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    ) : analysis.progressDiff < 0 ? (
                      <TrendingDown className="w-4 h-4 text-purple-400" />
                    ) : null}
                    <span
                      className={`text-base font-black font-mono ${
                        analysis.progressDiff > 0
                          ? 'text-blue-400'
                          : analysis.progressDiff < 0
                          ? 'text-purple-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {analysis.progressDiff > 0
                        ? `+${analysis.progressDiff}% لصالح (أ)`
                        : analysis.progressDiff < 0
                        ? `+${Math.abs(analysis.progressDiff)}% لصالح (ب)`
                        : 'متساويان 0%'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 shadow-sm flex flex-col">
                  <span className="text-[11px] text-slate-400 font-medium">فارق الطول:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Ruler className="w-4 h-4 text-slate-400" />
                    <span className="text-base font-black font-mono text-slate-200">
                      {Math.abs(analysis.lengthDiff)} م
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sector A Card */}
            <div className="rounded-xl border border-blue-900/70 bg-blue-950/20 p-4 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 border-b border-blue-900/40 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <h4 className="text-base font-extrabold text-blue-300 font-mono">
                      {sectorA.sectorName}
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                      القطاع أ
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {sectorA.streetName} {sectorA.lineNo ? `(خط ${sectorA.lineNo})` : ''}
                  </p>
                </div>

                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                    sectorA.statusCategory === 'منجز'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : sectorA.statusCategory === 'مفتوح'
                      ? 'bg-sky-950/80 text-sky-300 border-sky-800'
                      : 'bg-amber-950/80 text-amber-300 border-amber-800'
                  }`}
                >
                  {sectorA.categoryLabel}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">نسبة الإنجاز الميداني:</span>
                  <span className="font-black font-mono text-sm text-blue-400">
                    {sectorA.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${sectorA.progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>المرحلة: <strong className="text-slate-200">{sectorA.stage.stageName}</strong></span>
                  <span className="font-mono">خطوة {sectorA.stage.stageOrder} من 9</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-blue-900/40 shadow-sm">
                  <span className="text-slate-400 text-[11px] block">الطول الإجمالي:</span>
                  <span className="font-bold font-mono text-white text-sm">
                    {sectorA.totalLengthMeters} م.ط
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-blue-900/40 shadow-sm">
                  <span className="text-slate-400 text-[11px] block">مدة الفتح بالأيام:</span>
                  <span className="font-bold font-mono text-white text-sm">
                    {Math.round(sectorA.openDays)} يوم
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-blue-900/40 shadow-sm">
                  <span className="text-slate-400 text-[11px] block">معدل الإنجاز اليومي:</span>
                  <span className="font-bold font-mono text-white text-sm">
                    {sectorA.dailyRateMetersPerDay} م/يوم
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-blue-900/40 shadow-sm">
                  <span className="text-slate-400 text-[11px] block">رقم إذن الحفر:</span>
                  <span className="font-bold font-mono text-slate-300 text-xs truncate block" title={sectorA.digPermitNo || 'غير مسجل'}>
                    {sectorA.digPermitNo || 'غير مسجل'}
                  </span>
                </div>
              </div>

              {/* Action */}
              {onSelectSectorItem && sectorA.rawItems[0] && (
                <button
                  onClick={() => onSelectSectorItem(sectorA.rawItems[0])}
                  className="w-full py-1.5 px-3 bg-slate-900 hover:bg-blue-950 text-blue-300 text-xs font-bold rounded-lg border border-blue-900/60 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>عرض السجل في جدول الأعمال</span>
                </button>
              )}
            </div>

            {/* Sector B Card */}
            <div className="rounded-xl border border-purple-900/70 bg-purple-950/20 p-4 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 border-b border-purple-900/40 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <h4 className="text-base font-extrabold text-purple-300 font-mono">
                      {sectorB.sectorName}
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                      القطاع ب
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {sectorB.streetName} {sectorB.lineNo ? `(خط ${sectorB.lineNo})` : ''}
                  </p>
                </div>

                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                    sectorB.statusCategory === 'منجز'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : sectorB.statusCategory === 'مفتوح'
                      ? 'bg-sky-950/80 text-sky-300 border-sky-800'
                      : 'bg-amber-950/80 text-amber-300 border-amber-800'
                  }`}
                >
                  {sectorB.categoryLabel}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">نسبة الإنجاز الميداني:</span>
                  <span className="font-black font-mono text-sm text-purple-400">
                    {sectorB.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${sectorB.progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>المرحلة: <strong className="text-slate-200">{sectorB.stage.stageName}</strong></span>
                  <span className="font-mono">خطوة {sectorB.stage.stageOrder} من 9</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-purple-900/40 shadow-sm">
                  <span className="text-slate-400 text-[11px] block">الطول الإجمالي:</span>
                  <span className="font-bold font-mono text-white text-sm">
                    {sectorB.totalLengthMeters} م.ط
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-purple-900/40 shadow-sm">
                  <span className="text-slate-400 text-[11px] block">مدة الفتح بالأيام:</span>
                  <span className="font-bold font-mono text-white text-sm">
                    {Math.round(sectorB.openDays)} يوم
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-purple-900/40 shadow-sm">
                  <span className="text-slate-400 text-[11px] block">معدل الإنجاز اليومي:</span>
                  <span className="font-bold font-mono text-white text-sm">
                    {sectorB.dailyRateMetersPerDay} م/يوم
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-purple-900/40 shadow-sm">
                  <span className="text-slate-400 text-[11px] block">رقم إذن الحفر:</span>
                  <span className="font-bold font-mono text-slate-300 text-xs truncate block" title={sectorB.digPermitNo || 'غير مسجل'}>
                    {sectorB.digPermitNo || 'غير مسجل'}
                  </span>
                </div>
              </div>

              {/* Action */}
              {onSelectSectorItem && sectorB.rawItems[0] && (
                <button
                  onClick={() => onSelectSectorItem(sectorB.rawItems[0])}
                  className="w-full py-1.5 px-3 bg-slate-900 hover:bg-purple-950 text-purple-300 text-xs font-bold rounded-lg border border-purple-900/60 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>عرض السجل في جدول الأعمال</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Visual Charts Grid: Metrics Bar Chart + Stage Milestones Stepper */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart A: Side-by-side Bar Chart */}
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  مقارنة المؤشرات الفنية المباشرة (أعمدة بيانية)
                </h4>
                <span className="text-[11px] text-slate-400">
                  {sectorA.sectorName} مقابل {sectorB.sectorName}
                </span>
              </div>

              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metricsComparisonData}
                    margin={{ top: 15, right: 15, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="metric"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#475569' }}
                      dy={5}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="center"
                      wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                      formatter={(value: string) => {
                        if (value === 'sectorAVal') return `القطاع (أ): ${sectorA.sectorName}`;
                        if (value === 'sectorBVal') return `القطاع (ب): ${sectorB.sectorName}`;
                        return value;
                      }}
                    />
                    <Bar
                      dataKey="sectorAVal"
                      name="sectorAVal"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="sectorBVal"
                      name="sectorBVal"
                      fill="#a855f7"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: Construction Stages Comparative Progress Track */}
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    مسار المراحل الإنشائية الـ 9 للقطاعين
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    طبيعة تقدم الأعمال
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  تتبع موضع كل قطاع في دورة حياة أعمال شبكات الصرف الصحي من رص السيفتي حتى إتمام الأسفلت:
                </p>

                {/* Stages Stepper List */}
                <div className="space-y-1.5">
                  {WORK_STAGES.map((st) => {
                    const isSectorAHere = sectorA.stage.stageOrder === st.stageOrder;
                    const isSectorBHere = sectorB.stage.stageOrder === st.stageOrder;
                    const isPassedByA = sectorA.stage.stageOrder > st.stageOrder;
                    const isPassedByB = sectorB.stage.stageOrder > st.stageOrder;

                    return (
                      <div
                        key={`stage-${st.stageOrder}`}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                          isSectorAHere || isSectorBHere
                            ? 'bg-slate-900 border-slate-700 shadow-sm font-bold text-white'
                            : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                              isPassedByA && isPassedByB
                                ? 'bg-emerald-500 text-white'
                                : isSectorAHere || isSectorBHere
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {st.stageOrder}
                          </span>
                          <span className={isSectorAHere || isSectorBHere ? 'text-white' : 'text-slate-400'}>
                            {st.stageName}
                          </span>
                        </div>

                        {/* Location badges for Sector A and Sector B */}
                        <div className="flex items-center gap-1.5">
                          {isSectorAHere && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-xs">
                              القطاع أ ({sectorA.sectorName})
                            </span>
                          )}
                          {isSectorBHere && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-xs">
                              القطاع ب ({sectorB.sectorName})
                            </span>
                          )}
                          {!isSectorAHere && !isSectorBHere && isPassedByA && isPassedByB && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Detailed Engineering Insights Box */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              ملاحظات التحليل المقارن:
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-slate-300">
              {analysis.keyInsights.map((insight, idx) => (
                <li key={`ins-${idx}`} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 shadow-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed text-slate-300">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
