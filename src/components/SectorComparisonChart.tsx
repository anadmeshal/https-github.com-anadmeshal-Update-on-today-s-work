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
  theme?: 'light' | 'dark';
}

export const SectorComparisonChart: React.FC<SectorComparisonChartProps> = ({
  items,
  metadata,
  onSelectSectorItem,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
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
    <div
      className={`rounded-2xl border mb-5 overflow-hidden print:hidden transition-all shadow-md ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-slate-900/90 border-slate-800 text-white shadow-xl'
      }`}
    >
      {/* Top Header */}
      <div
        className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-xs">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              أداة مقارنة أداء ونسب إنجاز القطاعات
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950/80 text-indigo-300 border-indigo-800'}`}>
                مقارنة ثنائية تفاعلية
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              حدد أي قطاعين عبر القوائم المنسدلة لتحليل التباين في نسب الإنجاز، مراحل العمل الميداني، والأطوال
            </p>
          </div>
        </div>

        {/* Quick Comparison Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400 font-medium'}>مقارنات مقترحة:</span>
          <button
            onClick={handlePresetTopVsLowest}
            className={`px-2.5 py-1 rounded-lg border shadow-xs transition-all cursor-pointer font-bold ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            الأعلى vs الأقل إنجازاً
          </button>
          <button
            onClick={handlePresetLongest}
            className={`px-2.5 py-1 rounded-lg border shadow-xs transition-all cursor-pointer font-bold ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            أطول قطاعين
          </button>
          <button
            onClick={handlePresetAsphaltVsExcavation}
            className={`px-2.5 py-1 rounded-lg border shadow-xs transition-all cursor-pointer font-bold ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            مغلق مكتمل vs مفتوح جاري
          </button>
        </div>
      </div>

      {/* Dropdown Selectors Bar */}
      <div className={`p-4 sm:p-5 border-b ${isLight ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          {/* Dropdown 1: Sector A */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-black flex items-center gap-1.5 ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                القطاع الأول (القطاع أ):
              </label>
              {sectorA && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  isLight ? 'bg-blue-100 text-blue-900 border-blue-200' : 'bg-blue-950 text-blue-300 border-blue-800'
                }`}>
                  إنجاز: {sectorA.progressPercent}% • {sectorA.stage.shortName}
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedSectorAName}
                onChange={(e) => setSelectedSectorAName(e.target.value)}
                className={`w-full border-2 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm cursor-pointer appearance-none text-right pr-4 pl-8 transition-colors ${
                  isLight
                    ? 'bg-white border-blue-300 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                    : 'bg-slate-900 border-blue-900/80 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-900'
                }`}
              >
                {sectorProfiles.map((p, idx) => (
                  <option key={`opt-a-${p.sectorName}-${idx}`} value={p.sectorName} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-200'}>
                    {p.displayName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-blue-500">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Swap Button (Middle) */}
          <div className="md:col-span-1 flex justify-center pt-2 md:pt-4">
            <button
              onClick={handleSwap}
              title="تبديل القطاعين"
              className={`p-2.5 rounded-xl border shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
            </button>
          </div>

          {/* Dropdown 2: Sector B */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-black flex items-center gap-1.5 ${isLight ? 'text-purple-900' : 'text-purple-300'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                القطاع الثاني (القطاع ب):
              </label>
              {sectorB && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  isLight ? 'bg-purple-100 text-purple-900 border-purple-200' : 'bg-purple-950 text-purple-300 border-purple-800'
                }`}>
                  إنجاز: {sectorB.progressPercent}% • {sectorB.stage.shortName}
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedSectorBName}
                onChange={(e) => setSelectedSectorBName(e.target.value)}
                className={`w-full border-2 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm cursor-pointer appearance-none text-right pr-4 pl-8 transition-colors ${
                  isLight
                    ? 'bg-white border-purple-300 text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100'
                    : 'bg-slate-900 border-purple-900/80 text-slate-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-900'
                }`}
              >
                {sectorProfiles.map((p, idx) => (
                  <option key={`opt-b-${p.sectorName}-${idx}`} value={p.sectorName} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-200'}>
                    {p.displayName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-purple-500">
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
          <div className={`p-4 rounded-xl border shadow-sm ${
            isLight ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-950/80 border-indigo-900/60'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-indigo-800' : 'text-indigo-400'}`}>
                    نتيجة تحليل مقارنة الأداء بين القطاعين
                  </span>
                </div>
                <h4 className={`text-sm sm:text-base font-extrabold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {analysis.summaryHeadline}
                </h4>
                <p className={`text-xs leading-relaxed max-w-3xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {analysis.recommendation}
                </p>
              </div>

              {/* Comparative Delta Badges */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div className={`px-3 py-2 rounded-xl border shadow-xs flex flex-col ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>فارق الإنجاز (أ - ب):</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {analysis.progressDiff > 0 ? (
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    ) : analysis.progressDiff < 0 ? (
                      <TrendingDown className="w-4 h-4 text-purple-600" />
                    ) : null}
                    <span
                      className={`text-base font-black font-mono ${
                        analysis.progressDiff > 0
                          ? 'text-blue-600'
                          : analysis.progressDiff < 0
                          ? 'text-purple-600'
                          : isLight ? 'text-slate-700' : 'text-slate-400'
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

                <div className={`px-3 py-2 rounded-xl border shadow-xs flex flex-col ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>فارق الطول:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Ruler className={`w-4 h-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} />
                    <span className={`text-base font-black font-mono ${isLight ? 'text-slate-950' : 'text-slate-200'}`}>
                      {Math.abs(analysis.lengthDiff)} م
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sector A Card */}
            <div className={`rounded-2xl border-2 p-5 space-y-4 shadow-sm transition-all ${
              isLight
                ? 'bg-white border-blue-200 hover:border-blue-300'
                : 'bg-slate-900/95 border-blue-900/70'
            }`}>
              <div className={`flex items-start justify-between gap-2 border-b pb-3.5 ${
                isLight ? 'border-slate-200' : 'border-blue-900/40'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <h4 className={`text-lg font-black font-mono tracking-tight ${
                      isLight ? 'text-blue-950' : 'text-blue-300'
                    }`}>
                      {sectorA.sectorName}
                    </h4>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isLight
                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      القطاع أ
                    </span>
                  </div>
                  <p className={`text-xs mt-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {sectorA.streetName} {sectorA.lineNo ? `(خط ${sectorA.lineNo})` : ''}
                  </p>
                </div>

                {/* Status Badge: High Contrast & Unified Status */}
                {(() => {
                  const isClosed = sectorA.categoryLabel?.includes('مغلق') || sectorA.categoryLabel?.includes('مكتمل') || sectorA.progressPercent === 100;
                  const label = isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه';
                  return (
                    <span
                      className={`text-xs font-black px-3 py-1.5 rounded-lg border shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
                        isClosed
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-emerald-600 text-white border-emerald-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white shrink-0"></span>
                      {label}
                    </span>
                  );
                })()}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    نسبة الإنجاز الميداني:
                  </span>
                  <span className={`font-black font-mono text-base ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                    {sectorA.progressPercent}%
                  </span>
                </div>
                <div className={`w-full h-3.5 rounded-full overflow-hidden p-0.5 border ${
                  isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${sectorA.progressPercent}%` }}
                  ></div>
                </div>
                <div className={`flex justify-between items-center text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span>
                    المرحلة: <strong className={isLight ? 'text-slate-900 font-black' : 'text-slate-200'}>{sectorA.stage.stageName}</strong>
                  </span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    خطوة {sectorA.stage.stageOrder} من 9
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className={`p-3 rounded-xl border shadow-2xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-blue-900/40'
                }`}>
                  <span className={`text-[11px] font-bold block mb-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    الطول الإجمالي:
                  </span>
                  <span className={`font-black font-mono text-sm block ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {sectorA.totalLengthMeters} م.ط
                  </span>
                </div>

                <div className={`p-3 rounded-xl border shadow-2xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-blue-900/40'
                }`}>
                  <span className={`text-[11px] font-bold block mb-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    مدة الفتح بالأيام:
                  </span>
                  <span className={`font-black font-mono text-sm block ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {Math.round(sectorA.openDays)} يوم
                  </span>
                </div>

                <div className={`p-3 rounded-xl border shadow-2xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-blue-900/40'
                }`}>
                  <span className={`text-[11px] font-bold block mb-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    معدل الإنجاز اليومي:
                  </span>
                  <span className={`font-black font-mono text-sm block ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {sectorA.dailyRateMetersPerDay} م/يوم
                  </span>
                </div>

                <div className={`p-3 rounded-xl border shadow-2xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-blue-900/40'
                }`}>
                  <span className={`text-[11px] font-bold block mb-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    رقم إذن الحفر:
                  </span>
                  <span
                    className={`font-black font-mono text-xs truncate block ${isLight ? 'text-slate-800' : 'text-slate-300'}`}
                    title={sectorA.digPermitNo || 'غير مسجل'}
                  >
                    {sectorA.digPermitNo || 'غير مسجل'}
                  </span>
                </div>
              </div>

              {/* Action */}
              {onSelectSectorItem && sectorA.rawItems[0] && (
                <button
                  onClick={() => onSelectSectorItem(sectorA.rawItems[0])}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                    isLight
                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                      : 'bg-slate-950 hover:bg-blue-950 text-blue-300 border-blue-900/60'
                  }`}
                >
                  <span>عرض السجل في جدول الأعمال</span>
                </button>
              )}
            </div>

            {/* Sector B Card */}
            <div className={`rounded-2xl border-2 p-5 space-y-4 shadow-sm transition-all ${
              isLight
                ? 'bg-white border-purple-200 hover:border-purple-300'
                : 'bg-slate-900/95 border-purple-900/70'
            }`}>
              <div className={`flex items-start justify-between gap-2 border-b pb-3.5 ${
                isLight ? 'border-slate-200' : 'border-purple-900/40'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <h4 className={`text-lg font-black font-mono tracking-tight ${
                      isLight ? 'text-purple-950' : 'text-purple-300'
                    }`}>
                      {sectorB.sectorName}
                    </h4>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isLight
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : 'bg-purple-950 text-purple-300 border border-purple-800'
                    }`}>
                      القطاع ب
                    </span>
                  </div>
                  <p className={`text-xs mt-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {sectorB.streetName} {sectorB.lineNo ? `(خط ${sectorB.lineNo})` : ''}
                  </p>
                </div>

                {/* Status Badge: High Contrast & Unified Status */}
                {(() => {
                  const isClosed = sectorB.categoryLabel?.includes('مغلق') || sectorB.categoryLabel?.includes('مكتمل') || sectorB.progressPercent === 100;
                  const label = isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه';
                  return (
                    <span
                      className={`text-xs font-black px-3 py-1.5 rounded-lg border shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
                        isClosed
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-emerald-600 text-white border-emerald-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white shrink-0"></span>
                      {label}
                    </span>
                  );
                })()}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    نسبة الإنجاز الميداني:
                  </span>
                  <span className={`font-black font-mono text-base ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                    {sectorB.progressPercent}%
                  </span>
                </div>
                <div className={`w-full h-3.5 rounded-full overflow-hidden p-0.5 border ${
                  isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${sectorB.progressPercent}%` }}
                  ></div>
                </div>
                <div className={`flex justify-between items-center text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span>
                    المرحلة: <strong className={isLight ? 'text-slate-900 font-black' : 'text-slate-200'}>{sectorB.stage.stageName}</strong>
                  </span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    خطوة {sectorB.stage.stageOrder} من 9
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className={`p-3 rounded-xl border shadow-2xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-purple-900/40'
                }`}>
                  <span className={`text-[11px] font-bold block mb-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    الطول الإجمالي:
                  </span>
                  <span className={`font-black font-mono text-sm block ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {sectorB.totalLengthMeters} م.ط
                  </span>
                </div>

                <div className={`p-3 rounded-xl border shadow-2xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-purple-900/40'
                }`}>
                  <span className={`text-[11px] font-bold block mb-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    مدة الفتح بالأيام:
                  </span>
                  <span className={`font-black font-mono text-sm block ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {Math.round(sectorB.openDays)} يوم
                  </span>
                </div>

                <div className={`p-3 rounded-xl border shadow-2xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-purple-900/40'
                }`}>
                  <span className={`text-[11px] font-bold block mb-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    معدل الإنجاز اليومي:
                  </span>
                  <span className={`font-black font-mono text-sm block ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {sectorB.dailyRateMetersPerDay} م/يوم
                  </span>
                </div>

                <div className={`p-3 rounded-xl border shadow-2xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-purple-900/40'
                }`}>
                  <span className={`text-[11px] font-bold block mb-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    رقم إذن الحفر:
                  </span>
                  <span
                    className={`font-black font-mono text-xs truncate block ${isLight ? 'text-slate-800' : 'text-slate-300'}`}
                    title={sectorB.digPermitNo || 'غير مسجل'}
                  >
                    {sectorB.digPermitNo || 'غير مسجل'}
                  </span>
                </div>
              </div>

              {/* Action */}
              {onSelectSectorItem && sectorB.rawItems[0] && (
                <button
                  onClick={() => onSelectSectorItem(sectorB.rawItems[0])}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                    isLight
                      ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200'
                      : 'bg-slate-950 hover:bg-purple-950 text-purple-300 border-purple-900/60'
                  }`}
                >
                  <span>عرض السجل في جدول الأعمال</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Visual Charts Grid: Metrics Bar Chart + Stage Milestones Stepper */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart A: Side-by-side Bar Chart */}
            <div className={`rounded-xl p-4 border shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  مقارنة المؤشرات الفنية المباشرة (أعمدة بيانية)
                </h4>
                <span className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {sectorA.sectorName} مقابل {sectorB.sectorName}
                </span>
              </div>

              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metricsComparisonData}
                    margin={{ top: 15, right: 15, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#334155'} vertical={false} />
                    <XAxis
                      dataKey="metric"
                      stroke={isLight ? '#64748b' : '#94a3b8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: isLight ? '#cbd5e1' : '#475569' }}
                      dy={5}
                    />
                    <YAxis
                      stroke={isLight ? '#64748b' : '#94a3b8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: isLight ? '#cbd5e1' : '#475569' }}
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
            <div className={`rounded-xl p-4 border flex flex-col justify-between shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    <Layers className="w-4 h-4 text-purple-500" />
                    مسار المراحل الإنشائية الـ 9 للقطاعين
                  </h4>
                  <span className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    طبيعة تقدم الأعمال
                  </span>
                </div>
                <p className={`text-[11px] mb-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
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
                          isLight
                            ? isSectorAHere || isSectorBHere
                              ? 'bg-slate-100 border-slate-300 shadow-2xs font-black text-slate-900'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                            : isSectorAHere || isSectorBHere
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
                                : isLight
                                ? 'bg-slate-200 text-slate-600 border border-slate-300'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {st.stageOrder}
                          </span>
                          <span className={
                            isLight
                              ? isSectorAHere || isSectorBHere ? 'text-slate-950 font-black' : 'text-slate-700 font-medium'
                              : isSectorAHere || isSectorBHere ? 'text-white' : 'text-slate-400'
                          }>
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
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
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
          <div className={`p-4 rounded-xl border space-y-2 shadow-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950/70 border-slate-800 text-slate-200'
          }`}>
            <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              <Sparkles className="w-4 h-4 text-blue-500" />
              ملاحظات التحليل المقارن:
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              {analysis.keyInsights.map((insight, idx) => (
                <li
                  key={`ins-${idx}`}
                  className={`p-2.5 rounded-lg border shadow-xs flex items-start gap-2 ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed font-medium">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
