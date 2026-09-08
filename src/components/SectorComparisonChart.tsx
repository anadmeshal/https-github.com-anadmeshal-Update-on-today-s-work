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
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        لا توجد بيانات قطاعات متاحة للمقارنة حالياً.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs mb-5 overflow-hidden print:hidden">
      {/* Top Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-xs">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              أداة مقارنة أداء ونسب إنجاز القطاعات
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                مقارنة ثنائية تفاعلية
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              حدد أي قطاعين عبر القوائم المنسدلة لتحليل التباين في نسب الإنجاز، مراحل العمل الميداني، والأطوال
            </p>
          </div>
        </div>

        {/* Quick Comparison Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-slate-500 font-medium">مقارنات مقترحة:</span>
          <button
            onClick={handlePresetTopVsLowest}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            الأعلى vs الأقل إنجازاً
          </button>
          <button
            onClick={handlePresetLongest}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            أطول قطاعين
          </button>
          <button
            onClick={handlePresetAsphaltVsExcavation}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            منجز أسفلت vs جاري حفر
          </button>
        </div>
      </div>

      {/* Dropdown Selectors Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/50 via-slate-50/30 to-purple-50/50 border-b border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          {/* Dropdown 1: Sector A */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                القطاع الأول (القطاع أ):
              </label>
              {sectorA && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  إنجاز: {sectorA.progressPercent}% • {sectorA.stage.shortName}
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedSectorAName}
                onChange={(e) => setSelectedSectorAName(e.target.value)}
                className="w-full bg-white border-2 border-blue-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs cursor-pointer appearance-none text-right pr-4 pl-8"
              >
                {sectorProfiles.map((p) => (
                  <option key={`opt-a-${p.sectorName}`} value={p.sectorName}>
                    {p.displayName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-blue-600">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Swap Button (Middle) */}
          <div className="md:col-span-1 flex justify-center pt-2 md:pt-4">
            <button
              onClick={handleSwap}
              title="تبديل القطاعين"
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs hover:shadow-xs transition-all text-slate-700 active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
            </button>
          </div>

          {/* Dropdown 2: Sector B */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                القطاع الثاني (القطاع ب):
              </label>
              {sectorB && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                  إنجاز: {sectorB.progressPercent}% • {sectorB.stage.shortName}
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedSectorBName}
                onChange={(e) => setSelectedSectorBName(e.target.value)}
                className="w-full bg-white border-2 border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs cursor-pointer appearance-none text-right pr-4 pl-8"
              >
                {sectorProfiles.map((p) => (
                  <option key={`opt-b-${p.sectorName}`} value={p.sectorName}>
                    {p.displayName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-purple-600">
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
          <div className="p-4 rounded-xl border bg-gradient-to-r from-slate-50 via-indigo-50/40 to-blue-50/40 border-indigo-200 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                    نتيجة تحليل مقارنة الأداء بين القطاعين
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {analysis.summaryHeadline}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {analysis.recommendation}
                </p>
              </div>

              {/* Comparative Delta Badges */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium">فارق الإنجاز (أ - ب):</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {analysis.progressDiff > 0 ? (
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    ) : analysis.progressDiff < 0 ? (
                      <TrendingDown className="w-4 h-4 text-purple-600" />
                    ) : null}
                    <span
                      className={`text-base font-black font-mono ${
                        analysis.progressDiff > 0
                          ? 'text-blue-700'
                          : analysis.progressDiff < 0
                          ? 'text-purple-700'
                          : 'text-slate-700'
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

                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium">فارق الطول:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Ruler className="w-4 h-4 text-slate-500" />
                    <span className="text-base font-black font-mono text-slate-800">
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
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-4 space-y-4 shadow-2xs">
              <div className="flex items-start justify-between gap-2 border-b border-blue-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h4 className="text-base font-extrabold text-blue-950 font-mono">
                      {sectorA.sectorName}
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      القطاع أ
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {sectorA.streetName} {sectorA.lineNo ? `(خط ${sectorA.lineNo})` : ''}
                  </p>
                </div>

                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                    sectorA.statusCategory === 'منجز'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : sectorA.statusCategory === 'مفتوح'
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {sectorA.categoryLabel}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">نسبة الإنجاز الميداني:</span>
                  <span className="font-black font-mono text-sm text-blue-700">
                    {sectorA.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${sectorA.progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>المرحلة: <strong className="text-slate-800">{sectorA.stage.stageName}</strong></span>
                  <span className="font-mono">خطوة {sectorA.stage.stageOrder} من 9</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block">الطول الإجمالي:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {sectorA.totalLengthMeters} م.ط
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block">مدة الفتح بالأيام:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {Math.round(sectorA.openDays)} يوم
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block">معدل الإنجاز اليومي:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {sectorA.dailyRateMetersPerDay} م/يوم
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block">رقم إذن الحفر:</span>
                  <span className="font-bold font-mono text-slate-800 text-xs truncate block" title={sectorA.digPermitNo || 'غير مسجل'}>
                    {sectorA.digPermitNo || 'غير مسجل'}
                  </span>
                </div>
              </div>

              {/* Action */}
              {onSelectSectorItem && sectorA.rawItems[0] && (
                <button
                  onClick={() => onSelectSectorItem(sectorA.rawItems[0])}
                  className="w-full py-1.5 px-3 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>عرض السجل في جدول الأعمال</span>
                </button>
              )}
            </div>

            {/* Sector B Card */}
            <div className="rounded-xl border-2 border-purple-200 bg-purple-50/30 p-4 space-y-4 shadow-2xs">
              <div className="flex items-start justify-between gap-2 border-b border-purple-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <h4 className="text-base font-extrabold text-purple-950 font-mono">
                      {sectorB.sectorName}
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      القطاع ب
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {sectorB.streetName} {sectorB.lineNo ? `(خط ${sectorB.lineNo})` : ''}
                  </p>
                </div>

                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                    sectorB.statusCategory === 'منجز'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : sectorB.statusCategory === 'مفتوح'
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {sectorB.categoryLabel}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">نسبة الإنجاز الميداني:</span>
                  <span className="font-black font-mono text-sm text-purple-700">
                    {sectorB.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${sectorB.progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>المرحلة: <strong className="text-slate-800">{sectorB.stage.stageName}</strong></span>
                  <span className="font-mono">خطوة {sectorB.stage.stageOrder} من 9</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block">الطول الإجمالي:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {sectorB.totalLengthMeters} م.ط
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block">مدة الفتح بالأيام:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {Math.round(sectorB.openDays)} يوم
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block">معدل الإنجاز اليومي:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {sectorB.dailyRateMetersPerDay} م/يوم
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block">رقم إذن الحفر:</span>
                  <span className="font-bold font-mono text-slate-800 text-xs truncate block" title={sectorB.digPermitNo || 'غير مسجل'}>
                    {sectorB.digPermitNo || 'غير مسجل'}
                  </span>
                </div>
              </div>

              {/* Action */}
              {onSelectSectorItem && sectorB.rawItems[0] && (
                <button
                  onClick={() => onSelectSectorItem(sectorB.rawItems[0])}
                  className="w-full py-1.5 px-3 bg-white hover:bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>عرض السجل في جدول الأعمال</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Visual Charts Grid: Metrics Bar Chart + Stage Milestones Stepper */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart A: Side-by-side Bar Chart */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  مقارنة المؤشرات الفنية المباشرة (أعمدة بيانية)
                </h4>
                <span className="text-[11px] text-slate-500">
                  {sectorA.sectorName} مقابل {sectorB.sectorName}
                </span>
              </div>

              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metricsComparisonData}
                    margin={{ top: 15, right: 15, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="metric"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      dy={5}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
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
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="sectorBVal"
                      name="sectorBVal"
                      fill="#9333ea"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: Construction Stages Comparative Progress Track */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    مسار المراحل الإنشائية الـ 9 للقطاعين
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    طبيعة تقدم الأعمال
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-3">
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
                            ? 'bg-white border-slate-300 shadow-2xs font-bold'
                            : 'bg-slate-100/60 border-slate-200/60 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                              isPassedByA && isPassedByB
                                ? 'bg-emerald-500 text-white'
                                : isSectorAHere || isSectorBHere
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-300 text-slate-700'
                            }`}
                          >
                            {st.stageOrder}
                          </span>
                          <span className={isSectorAHere || isSectorBHere ? 'text-slate-900' : 'text-slate-600'}>
                            {st.stageName}
                          </span>
                        </div>

                        {/* Location badges for Sector A and Sector B */}
                        <div className="flex items-center gap-1.5">
                          {isSectorAHere && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-2xs">
                              القطاع أ ({sectorA.sectorName})
                            </span>
                          )}
                          {isSectorBHere && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-2xs">
                              القطاع ب ({sectorB.sectorName})
                            </span>
                          )}
                          {!isSectorAHere && !isSectorBHere && isPassedByA && isPassedByB && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              ملاحظات التحليل المقارن:
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-slate-700">
              {analysis.keyInsights.map((insight, idx) => (
                <li key={`ins-${idx}`} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
