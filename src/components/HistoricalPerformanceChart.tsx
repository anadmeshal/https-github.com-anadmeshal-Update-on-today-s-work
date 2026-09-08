import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { WorkItem, ProjectMetadata } from '../types';
import { classifyWorkStatus } from '../utils/statusClassifier';
import {
  computeMonthlyPerformance,
  MonthlyPerformanceRecord,
} from '../utils/monthlyPerformance';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Clock,
  BarChart3,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface HistoricalPerformanceChartProps {
  items: WorkItem[];
  metadata: ProjectMetadata;
}

interface HistoricalPoint {
  dateKey: string;           // e.g. "2026-07-01"
  formattedDate: string;     // e.g. "01 يوليو 2026"
  reportTitle: string;       // e.g. "تقرير أسبوع 1"
  openCount: number;         // عدد القطاعات المفتوحة في هذا التاريخ
  completedCount: number;    // عدد القطاعات المنجزة في هذا التاريخ
  totalCumulative: number;   // إجمالي القطاعات التي تم فتحها حتى هذا التاريخ
  completionRate: number;    // نسبة الإنجاز %
}

export const HistoricalPerformanceChart: React.FC<HistoricalPerformanceChartProps> = ({
  items,
  metadata,
}) => {
  // Primary view mode: 'timeline' (المسار الزمني المتصل) OR 'monthly' (مقارنة أداء الأشهر)
  const [activeTab, setActiveTab] = useState<'timeline' | 'monthly'>('monthly');
  const [intervalType, setIntervalType] = useState<'biweekly' | 'weekly' | 'allDates'>('biweekly');

  // 1. Monthly Performance & Comparison Dataset (الشهر الحالي مقارنة بالأشهر السابقة)
  const monthlySummary = useMemo(() => {
    return computeMonthlyPerformance(items, metadata);
  }, [items, metadata]);

  // 2. Timeline progression points based on report dates and sector timelines
  const timelineData = useMemo<HistoricalPoint[]>(() => {
    if (!items || items.length === 0) return [];

    const reportDateStr = metadata.date || '2026-09-07';
    const reportDate = new Date(reportDateStr);
    const validReportTime = !isNaN(reportDate.getTime())
      ? reportDate.getTime()
      : new Date('2026-09-07').getTime();

    // Map each item to its opening date & completion status
    const itemRecords = items.map((item) => {
      const isCompleted = classifyWorkStatus(item) === 'منجز';

      let openTime = 0;
      if (item.digPermitDate) {
        const d = new Date(item.digPermitDate);
        if (!isNaN(d.getTime())) openTime = d.getTime();
      }

      if (!openTime && typeof item.openDays === 'number' && item.openDays > 0) {
        openTime = validReportTime - item.openDays * 24 * 3600 * 1000;
      }

      if (!openTime) {
        openTime = validReportTime - 30 * 24 * 3600 * 1000;
      }

      let completionTime = validReportTime;
      if (isCompleted) {
        const timeDiff = validReportTime - openTime;
        completionTime = openTime + timeDiff * 0.75;
      }

      return {
        id: item.id,
        sector: item.sector,
        openTime,
        completionTime,
        isCompleted,
      };
    });

    const minOpenTime = Math.min(...itemRecords.map((r) => r.openTime));
    const startTime = Math.min(minOpenTime, validReportTime - 60 * 24 * 3600 * 1000);
    const endTime = validReportTime;

    const milestoneDates: Date[] = [];

    if (intervalType === 'weekly') {
      let curr = new Date(startTime);
      while (curr.getTime() < endTime) {
        milestoneDates.push(new Date(curr));
        curr.setDate(curr.getDate() + 7);
      }
      milestoneDates.push(new Date(endTime));
    } else if (intervalType === 'biweekly') {
      let curr = new Date(startTime);
      curr.setDate(1);

      while (curr.getTime() <= endTime) {
        if (curr.getTime() >= startTime && curr.getTime() <= endTime) {
          milestoneDates.push(new Date(curr));
        }

        const midMonth = new Date(curr);
        midMonth.setDate(15);
        if (midMonth.getTime() >= startTime && midMonth.getTime() <= endTime) {
          milestoneDates.push(new Date(midMonth));
        }

        curr.setMonth(curr.getMonth() + 1);
        curr.setDate(1);
      }

      const lastPoint = milestoneDates[milestoneDates.length - 1];
      if (!lastPoint || lastPoint.toISOString().slice(0, 10) !== new Date(endTime).toISOString().slice(0, 10)) {
        milestoneDates.push(new Date(endTime));
      }
    } else {
      const distinctTimes: string[] = Array.from(
        new Set<string>(itemRecords.map((r) => new Date(r.openTime).toISOString().slice(0, 10)))
      ).sort();

      distinctTimes.forEach((dStr: string) => {
        milestoneDates.push(new Date(dStr));
      });
      if (!distinctTimes.includes(new Date(endTime).toISOString().slice(0, 10))) {
        milestoneDates.push(new Date(endTime));
      }
    }

    milestoneDates.sort((a, b) => a.getTime() - b.getTime());

    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    return milestoneDates.map((dateObj, idx) => {
      const time = dateObj.getTime();
      const dateKey = dateObj.toISOString().slice(0, 10);
      const day = dateObj.getDate();
      const month = arabicMonths[dateObj.getMonth()];
      const formattedDate = `${day} ${month}`;

      const openedSoFar = itemRecords.filter((r) => r.openTime <= time);
      const totalCumulative = openedSoFar.length;

      const completedSoFar = openedSoFar.filter(
        (r) => r.isCompleted && r.completionTime <= time
      );
      const completedCount = completedSoFar.length;

      const openCount = totalCumulative - completedCount;

      const completionRate =
        totalCumulative > 0 ? Math.round((completedCount / totalCumulative) * 100) : 0;

      const isFinalReport = idx === milestoneDates.length - 1;
      const reportTitle = isFinalReport
        ? `تقرير المتابعة الحالي (${day} ${month})`
        : `تقرير متابعة ${day} ${month}`;

      return {
        dateKey,
        formattedDate,
        reportTitle,
        openCount: Math.max(0, openCount),
        completedCount,
        totalCumulative,
        completionRate,
      };
    });
  }, [items, metadata, intervalType]);

  // Current summary metrics from latest point
  const currentSnapshot = timelineData[timelineData.length - 1] || {
    openCount: items.length,
    completedCount: 0,
    completionRate: 0,
    formattedDate: metadata.date || '07 سبتمبر',
  };

  // Custom Tooltip for Timeline Line Chart
  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: HistoricalPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-sans min-w-[210px] z-50 backdrop-blur-xs">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-extrabold text-sm text-white">{data.reportTitle}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sky-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                القطاعات المفتوحة (قيد العمل):
              </span>
              <span className="font-bold text-white font-mono text-sm">{data.openCount}</span>
            </div>

            <div className="flex justify-between items-center text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                القطاعات المنجزة (أسفلت):
              </span>
              <span className="font-bold text-white font-mono text-sm">{data.completedCount}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-300">
              <span>إجمالي القطاعات حتى التاريخ:</span>
              <span className="font-bold text-amber-400 font-mono">
                {data.totalCumulative} قطاع
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span>نسبة الإنجاز في التقرير:</span>
              <span className="font-extrabold text-emerald-400 font-mono">
                {data.completionRate}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Monthly Comparison Chart
  const CustomMonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyPerformanceRecord = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-sans min-w-[240px] z-50 backdrop-blur-xs">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-extrabold text-sm text-white">{data.label}</span>
            </div>
            {data.isCurrentMonth && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                الشهر الحالي
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sky-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                القطاعات المفتوحة في الشهر:
              </span>
              <span className="font-bold text-white font-mono text-sm">
                {data.openedCount} قطاع ({data.totalLengthMeters} م)
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                القطاعات المنجزة (أسفلت):
              </span>
              <span className="font-bold text-white font-mono text-sm">
                {data.completedCount} قطاع ({data.completedLengthMeters} م)
              </span>
            </div>

            <div className="flex justify-between items-center text-amber-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                نسبة إنجاز دفعة الشهر:
              </span>
              <span className="font-extrabold text-white font-mono text-sm">
                {data.completionRate}%
              </span>
            </div>

            {data.prevMonthName && (
              <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-300">
                <div className="flex justify-between items-center">
                  <span>المقارنة مع ({data.prevMonthName}):</span>
                  <span
                    className={`font-bold font-mono px-1.5 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                      data.statusTrend === 'improved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : data.statusTrend === 'lagging'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {data.statusTrend === 'improved' && <ArrowUpRight className="w-3 h-3" />}
                    {data.statusTrend === 'lagging' && <ArrowDownRight className="w-3 h-3" />}
                    {data.statusTrend === 'stable' && <Minus className="w-3 h-3" />}
                    <span>{data.statusText}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>فارق نسبة الإنجاز:</span>
                  <span
                    className={`font-mono font-bold ${
                      data.diffCompletionRate > 0
                        ? 'text-emerald-400'
                        : data.diffCompletionRate < 0
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {data.diffCompletionRate > 0 ? `+${data.diffCompletionRate}%` : `${data.diffCompletionRate}%`}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>فارق القطاعات المنجزة:</span>
                  <span
                    className={`font-mono font-bold ${
                      data.diffCompletedCount > 0
                        ? 'text-emerald-400'
                        : data.diffCompletedCount < 0
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {data.diffCompletedCount > 0 ? `+${data.diffCompletedCount}` : `${data.diffCompletedCount}`} قطاع
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const currentMonthRec = monthlySummary.currentMonth;
  const prevMonthRec = monthlySummary.previousMonth;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs mb-5 overflow-hidden print:hidden">
      {/* Top Header with Primary View Tabs */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              متابعة الأداء التاريخي للمشروع
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {activeTab === 'monthly' ? 'مقارنة الأشهر' : 'Line Chart'}
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {activeTab === 'monthly'
                ? 'مقارنة دقيقة بين إنجاز الشهر الحالي والأشهر السابقة لبيان مؤشرات التحسن أو التأخر'
                : 'تتبع زمني لعدد القطاعات المنجزة مقابل المفتوحة عبر تواريخ التقارير الدورية'}
            </p>
          </div>
        </div>

        {/* Primary View Toggle: Monthly Comparison vs Continuous Timeline */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-200/90 p-1 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'monthly'
                  ? 'bg-white text-purple-900 shadow-xs font-black'
                  : 'hover:text-slate-900 text-slate-600'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>مقارنة إنجاز الأشهر (التحسن / التأخر)</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white text-blue-900 shadow-xs font-black'
                  : 'hover:text-slate-900 text-slate-600'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>المسار الزمني المتصل (Timeline)</span>
            </button>
          </div>

          {/* If on timeline tab, show interval selector */}
          {activeTab === 'timeline' && (
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold text-slate-700">
              <button
                onClick={() => setIntervalType('biweekly')}
                className={`px-3 py-1 rounded-md transition-all ${
                  intervalType === 'biweekly'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                نصف شهري
              </button>
              <button
                onClick={() => setIntervalType('weekly')}
                className={`px-3 py-1 rounded-md transition-all ${
                  intervalType === 'weekly'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                أسبوعي
              </button>
              <button
                onClick={() => setIntervalType('allDates')}
                className={`px-3 py-1 rounded-md transition-all ${
                  intervalType === 'allDates'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                الكل
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: MONTHLY COMPARISON VIEW (الشهر الحالي مقارنة بالأشهر السابقة) */}
      {activeTab === 'monthly' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Executive Comparative Highlight Banner */}
          <div className="p-4 rounded-xl border bg-gradient-to-r from-slate-50 via-purple-50/40 to-blue-50/40 border-purple-200/80 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700">
                    ملخص المقارنة الشهرية للأداء
                  </span>
                  {currentMonthRec && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                      الشهر الحالي: {currentMonthRec.label}
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {monthlySummary.headline}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {monthlySummary.recommendation}
                </p>
              </div>

              {/* Quick Delta Badges */}
              {currentMonthRec && prevMonthRec && (
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
                    <span className="text-[11px] text-slate-500 font-medium">
                      فارق نسبة الإنجاز vs {prevMonthRec.monthName}:
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {currentMonthRec.diffCompletionRate >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-600" />
                      )}
                      <span
                        className={`text-lg font-black font-mono ${
                          currentMonthRec.diffCompletionRate >= 0
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {currentMonthRec.diffCompletionRate > 0
                          ? `+${currentMonthRec.diffCompletionRate}%`
                          : `${currentMonthRec.diffCompletionRate}%`}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
                    <span className="text-[11px] text-slate-500 font-medium">مؤشر التحسن / التأخر:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                          currentMonthRec.statusTrend === 'improved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : currentMonthRec.statusTrend === 'lagging'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {currentMonthRec.statusTrend === 'improved' && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
                        {currentMonthRec.statusTrend === 'lagging' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        {currentMonthRec.statusTrend === 'stable' && <Minus className="w-3.5 h-3.5 text-slate-600" />}
                        <span>{currentMonthRec.statusText}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Comparison Composed Chart (Bar + Line) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                رسم مقارنة القطاعات المفتوحة والمنجزة ونسب الإنجاز لكل شهر:
              </span>
              <span className="text-slate-500 font-mono">
                {monthlySummary.records.length} أشهر مسجلة
              </span>
            </div>

            <div className="w-full h-72 sm:h-80 bg-slate-50/50 rounded-xl p-3 border border-slate-100" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlySummary.records}
                  margin={{ top: 20, right: 30, left: 15, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    dy={10}
                  />
                  {/* Left Axis: Number of Sectors */}
                  <YAxis
                    yAxisId="left"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    dx={-10}
                    allowDecimals={false}
                    label={{
                      value: 'عدد القطاعات',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 11 },
                    }}
                  />
                  {/* Right Axis: Completion Rate % */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#8b5cf6"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    dx={10}
                    domain={[0, 100]}
                    unit="%"
                    label={{
                      value: 'نسبة الإنجاز %',
                      angle: 90,
                      position: 'insideRight',
                      style: { textAnchor: 'middle', fill: '#8b5cf6', fontSize: 11 },
                    }}
                  />
                  <Tooltip content={<CustomMonthlyTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="center"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                    formatter={(value: string) => {
                      if (value === 'openedCount') return 'القطاعات المفتوحة خلال الشهر';
                      if (value === 'completedCount') return 'القطاعات المنجزة (أسفلت)';
                      if (value === 'completionRate') return 'نسبة الإنجاز الشهري (%)';
                      return value;
                    }}
                  />

                  {/* Bar 1: Opened Sectors */}
                  <Bar
                    yAxisId="left"
                    dataKey="openedCount"
                    name="openedCount"
                    fill="#0284c7"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />

                  {/* Bar 2: Completed Sectors */}
                  <Bar
                    yAxisId="left"
                    dataKey="completedCount"
                    name="completedCount"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />

                  {/* Line: Completion Rate % */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="completionRate"
                    name="completionRate"
                    stroke="#8b5cf6"
                    strokeWidth={3.5}
                    dot={{ r: 5, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 3, fill: '#ffffff' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Month-by-Month Comparative Grid Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              تفاصيل مقارنة الأشهر (الشهر الحالي مقابل الأشهر السابقة):
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {monthlySummary.records.map((rec) => {
                const isCurrent = rec.isCurrentMonth;
                const isImproved = rec.statusTrend === 'improved';
                const isLagging = rec.statusTrend === 'lagging';

                return (
                  <div
                    key={rec.monthKey}
                    className={`rounded-xl p-4 border transition-all relative flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-blue-50/60 border-blue-300 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    {/* Month Badge & Tag */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {rec.label}
                      </span>
                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-2xs">
                          الشهر الحالي
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500">
                          سابق
                        </span>
                      )}
                    </div>

                    {/* Counts Breakdown */}
                    <div className="space-y-1.5 py-2 border-y border-slate-200/70 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>قطاعات مفتوحة:</span>
                        <span className="font-bold text-sky-800 font-mono">
                          {rec.openedCount} قطاع ({rec.totalLengthMeters} م)
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600">
                        <span>قطاعات منجزة (أسفلت):</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {rec.completedCount} قطاع
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-700 pt-1 font-semibold">
                        <span>نسبة إنجاز الدفعة:</span>
                        <span className="font-black text-purple-700 font-mono text-sm">
                          {rec.completionRate}%
                        </span>
                      </div>
                    </div>

                    {/* Trend & Delta vs Previous Month */}
                    <div className="mt-3 space-y-1.5">
                      {rec.prevMonthName ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500">
                              مقارنة بـ ({rec.prevMonthName}):
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold flex items-center gap-1 ${
                                isImproved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isLagging
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isImproved && <ArrowUpRight className="w-3 h-3 text-emerald-600" />}
                              {isLagging && <ArrowDownRight className="w-3 h-3 text-rose-600" />}
                              {rec.statusTrend === 'stable' && <Minus className="w-3 h-3 text-slate-600" />}
                              <span>{rec.statusText}</span>
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                            {rec.explanation}
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                          {rec.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CONTINUOUS TIMELINE LINE CHART VIEW */}
      {activeTab === 'timeline' && (
        <div>
          {/* Quick Monthly Comparison Summary Bar for Context */}
          {currentMonthRec && prevMonthRec && (
            <div className="px-5 py-2.5 bg-purple-50/60 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-bold text-slate-800">
                  مؤشر أداء شهر {currentMonthRec.monthName} الحالي مقارنة بشهر {prevMonthRec.monthName}:
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                    currentMonthRec.statusTrend === 'improved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentMonthRec.statusTrend === 'lagging'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {currentMonthRec.statusText}
                </span>
              </div>

              <button
                onClick={() => setActiveTab('monthly')}
                className="text-purple-700 hover:text-purple-900 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>عرض تفاصيل مقارنة الأشهر والتحسن/التأخر</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Snapshot KPI Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/40 border-b border-slate-100 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <span className="text-slate-500 font-medium">تاريخ تقرير المتابعة:</span>
              <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900 font-mono text-sm">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{metadata.date || '2026-09-07'}</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-sky-200 shadow-2xs flex flex-col justify-between">
              <span className="text-sky-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                القطاعات المفتوحة الحالية:
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-sky-800 font-mono">
                  {currentSnapshot.openCount}
                </span>
                <span className="text-slate-500 text-[11px]">قطاع مفتوح</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs flex flex-col justify-between">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                القطاعات المنجزة الحالية:
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-emerald-800 font-mono">
                  {currentSnapshot.completedCount}
                </span>
                <span className="text-slate-500 text-[11px]">قطاع منجز (أسفلت)</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                نسبة الإنجاز التراكمي:
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-slate-900 font-mono">
                  {currentSnapshot.completionRate}%
                </span>
                <span className="text-[11px] text-emerald-600 font-bold">منجز أسفلت</span>
              </div>
            </div>
          </div>

          {/* Main Line Chart Body */}
          <div className="p-4 sm:p-6">
            <div className="w-full h-72 sm:h-80" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timelineData}
                  margin={{ top: 15, right: 25, left: 10, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    dy={10}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    dx={-10}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTimelineTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="center"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                    formatter={(value: string) => {
                      if (value === 'openCount') return 'القطاعات المفتوحة (قيد العمل)';
                      if (value === 'completedCount') return 'القطاعات المنجزة (أسفلت)';
                      return value;
                    }}
                  />

                  {/* Line 1: Open Sectors (Blue) */}
                  <Line
                    type="monotone"
                    dataKey="openCount"
                    name="openCount"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 7, stroke: '#0284c7', strokeWidth: 3, fill: '#ffffff' }}
                  />

                  {/* Line 2: Completed Sectors (Green) */}
                  <Line
                    type="monotone"
                    dataKey="completedCount"
                    name="completedCount"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 3, fill: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Footer Guidance Note */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  يمثل المنحنى تتبع تقارير المتابعة الدورية لمشروع شبكات صرف صحي العوالى 2، حيث تظهر حركة فتح القطاعات الجديدة مقابل القطاعات التي اكتملت أعمالها وإعادة سفلتتها.
                </span>
              </div>
              <span className="font-mono text-slate-600 shrink-0 font-bold">
                {timelineData.length} نقاط تقرير
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
