import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { WorkItem } from '../types';
import { PieChart as PieChartIcon, CheckCircle2, Clock, AlertCircle, Filter } from 'lucide-react';
import { classifyWorkStatus, WorkStatusCategory } from '../utils/statusClassifier';

interface StatusPieChartProps {
  items: WorkItem[];
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
}

interface StatusSlice {
  name: WorkStatusCategory;
  label: string;
  subLabel: string;
  value: number;
  percentage: number;
  totalLengthMeters: number;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
}

export const StatusPieChart: React.FC<StatusPieChartProps> = ({
  items,
  selectedStatus,
  onSelectStatus,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Categorize items into:
  // 1. المفتوح: رص سيفتي
  // 2. الجاري: حفر تمديد دفان
  // 3. المنجز: اسفلت
  const chartData = useMemo<StatusSlice[]>(() => {
    let openCount = 0;
    let openLength = 0;
    let inProgressCount = 0;
    let inProgressLength = 0;
    let completedCount = 0;
    let completedLength = 0;

    items.forEach((item) => {
      const category = classifyWorkStatus(item);
      const length = item.lengthMeters || 0;

      if (category === 'منجز') {
        completedCount++;
        completedLength += length;
      } else if (category === 'مفتوح') {
        openCount++;
        openLength += length;
      } else {
        inProgressCount++;
        inProgressLength += length;
      }
    });

    const total = items.length || 1;

    return [
      {
        name: 'مفتوح',
        label: 'مفتوح (رص سيفتي)',
        subLabel: 'رص سيفتي',
        value: openCount,
        percentage: Math.round((openCount / total) * 100),
        totalLengthMeters: Math.round(openLength * 10) / 10,
        color: '#0284c7', // Sky-600
        bgColor: 'bg-sky-950/80',
        borderColor: 'border-sky-800',
        textColor: 'text-sky-300',
        description: 'قطاعات رص سيفتي وحواجز السلامة بانتظار بدء الحفر',
      },
      {
        name: 'جاري',
        label: 'جاري (حفر / تمديد / دفان)',
        subLabel: 'حفر / تمديد / دفان',
        value: inProgressCount,
        percentage: Math.round((inProgressCount / total) * 100),
        totalLengthMeters: Math.round(inProgressLength * 10) / 10,
        color: '#f59e0b', // Amber-500
        bgColor: 'bg-amber-950/80',
        borderColor: 'border-amber-800',
        textColor: 'text-amber-300',
        description: 'أعمال حفر، تمديد، دفان، استلام بحص، وMC-1',
      },
      {
        name: 'منجز',
        label: 'منجز (أسفلت)',
        subLabel: 'أسفلت',
        value: completedCount,
        percentage: Math.round((completedCount / total) * 100),
        totalLengthMeters: Math.round(completedLength * 10) / 10,
        color: '#10b981', // Emerald-500
        bgColor: 'bg-emerald-950/80',
        borderColor: 'border-emerald-800',
        textColor: 'text-emerald-300',
        description: 'أعمال الأسفلت المنفذة (طبقة أولى ط1 / طبقة ثانية ط2)',
      },
    ];
  }, [items]);

  const totalSectors = items.length;
  const totalMeters = useMemo(() => {
    return Math.round(items.reduce((sum, item) => sum + (item.lengthMeters || 0), 0) * 10) / 10;
  }, [items]);

  // Custom tooltip for Pie Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: StatusSlice = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs font-sans min-w-[190px] z-50 backdrop-blur-xs">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-extrabold text-sm text-white">{data.label}</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between items-center">
              <span>العدد:</span>
              <span className="font-bold text-white font-mono text-sm">{data.value} قطاع</span>
            </div>
            <div className="flex justify-between items-center">
              <span>النسبة:</span>
              <span className="font-bold text-white font-mono">{data.percentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>إجمالي الأطوال:</span>
              <span className="font-bold text-amber-300 font-mono">
                {data.totalLengthMeters.toLocaleString('ar-SA')} م.ط
              </span>
            </div>
            <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800">
              {data.description}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl mb-5 overflow-hidden print:hidden">
      {/* Chart Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-950 text-blue-400 border border-blue-800/80 rounded-lg">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              توزيع حالة العمل للقطاعات
              <span className="text-xs font-normal text-slate-400 font-mono">
                ({totalSectors} قطاع • {totalMeters.toLocaleString('ar-SA')} م.ط)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              رسم بياني يوضح نسب توزيع الأعمال الميدانية (مفتوح، جاري، منجز)
            </p>
          </div>
        </div>

        {selectedStatus && onSelectStatus && (
          <button
            onClick={() => onSelectStatus('')}
            className="text-xs text-slate-300 hover:text-red-400 flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-red-950/40 rounded-md border border-slate-700 transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>إلغاء تصفية الرسم البياني</span>
          </button>
        )}
      </div>

      {/* Chart Body & Stats Cards */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Pie Chart Visualizer */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(entry) => {
                      if (onSelectStatus) {
                        onSelectStatus(selectedStatus === entry.name ? '' : entry.name);
                      }
                    }}
                    cursor="pointer"
                  >
                    {chartData.map((entry, index) => {
                      const isSelected = selectedStatus === entry.name;
                      const isHovered = activeIndex === index;
                      return (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={entry.color}
                          stroke={isSelected ? '#38bdf8' : '#0f172a'}
                          strokeWidth={isSelected ? 3 : 1.5}
                          style={{
                            transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                            transformOrigin: 'center center',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white font-mono leading-none">
                  {totalSectors}
                </span>
                <span className="text-[11px] font-bold text-slate-400 mt-1">
                  إجمالي القطاعات
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-1">
              انقر على أي شريحة لتصفية جدول الأعمال مباشرة
            </p>
          </div>

          {/* Interactive Status Cards (Legend & Breakdown) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {chartData.map((slice) => {
              const isSelected = selectedStatus === slice.name;

              return (
                <button
                  key={slice.name}
                  onClick={() => {
                    if (onSelectStatus) {
                      onSelectStatus(isSelected ? '' : slice.name);
                    }
                  }}
                  className={`text-right p-4 rounded-xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-blue-500 shadow-lg bg-slate-950 border-blue-500 scale-[1.02]'
                      : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar Indicator */}
                  <div
                    className="absolute top-0 right-0 left-0 h-1.5"
                    style={{ backgroundColor: slice.color }}
                  />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="font-extrabold text-sm text-white">
                          {slice.name}
                        </span>
                      </div>

                      {slice.name === 'منجز' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {slice.name === 'جاري' && (
                        <Clock className="w-4 h-4 text-amber-400" />
                      )}
                      {slice.name === 'مفتوح' && (
                        <AlertCircle className="w-4 h-4 text-sky-400" />
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-black text-white font-mono">
                        {slice.value}
                      </span>
                      <span className="text-xs font-bold text-slate-400">قطاع</span>
                      <span
                        className={`mr-auto text-xs font-extrabold px-1.5 py-0.5 rounded font-mono border ${slice.bgColor} ${slice.borderColor} ${slice.textColor}`}
                      >
                        {slice.percentage}%
                      </span>
                    </div>

                    <p className="text-[11.5pt] sm:text-xs text-slate-300 line-clamp-1 mb-2">
                      {slice.label}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>إجمالي الطول:</span>
                    <span className="font-bold text-slate-200 font-mono">
                      {slice.totalLengthMeters.toLocaleString('ar-SA')} م
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
