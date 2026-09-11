import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { WorkItem } from '../types';
import { 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  HardHat, 
  Pickaxe, 
  Layers, 
  Boxes, 
  Filter 
} from 'lucide-react';
import { 
  classifyWorkStatus, 
  WorkStageCategory, 
  STAGE_CATEGORIES, 
  ORDERED_STAGES 
} from '../utils/statusClassifier';

interface StatusPieChartProps {
  items: WorkItem[];
  theme?: 'light' | 'dark';
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
}

interface StageSlice {
  key: WorkStageCategory;
  stageNumber: number;
  title: string;
  shortName: string;
  subTitle: string;
  value: number;
  percentage: number;
  totalLengthMeters: number;
  color: string;
  bgColorLight: string;
  borderColorLight: string;
  textColorLight: string;
  bgColorDark: string;
  borderColorDark: string;
  textColorDark: string;
  description: string;
}

export const StatusPieChart: React.FC<StatusPieChartProps> = ({
  items,
  theme = 'dark',
  selectedStatus,
  onSelectStatus,
}) => {
  const isLight = theme === 'light';
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Divide into the 5 stages:
  // 1- رص سيفتي
  // 2- حفر
  // 3- تمديد
  // 4- بحص اعلى ودفان
  // 5- mc1 و rc2 واسفلت
  const chartData = useMemo<StageSlice[]>(() => {
    const stats: Record<WorkStageCategory, { count: number; length: number }> = {
      'رص سيفتي': { count: 0, length: 0 },
      'حفر': { count: 0, length: 0 },
      'تمديد': { count: 0, length: 0 },
      'بحص اعلى ودفان': { count: 0, length: 0 },
      'mc1 و rc2 واسفلت': { count: 0, length: 0 },
    };

    items.forEach((item) => {
      const stage = classifyWorkStatus(item);
      const len = item.lengthMeters || 0;
      if (stats[stage]) {
        stats[stage].count++;
        stats[stage].length += len;
      }
    });

    const total = items.length || 1;

    return ORDERED_STAGES.map((key) => {
      const meta = STAGE_CATEGORIES[key];
      const count = stats[key].count;
      const length = stats[key].length;

      return {
        key,
        stageNumber: meta.stageNumber,
        title: meta.title,
        shortName: meta.shortName,
        subTitle: meta.subTitle,
        value: count,
        percentage: Math.round((count / total) * 100),
        totalLengthMeters: Math.round(length * 10) / 10,
        color: meta.color,
        bgColorLight: meta.bgColorLight,
        borderColorLight: meta.borderColorLight,
        textColorLight: meta.textColorLight,
        bgColorDark: meta.bgColorDark,
        borderColorDark: meta.borderColorDark,
        textColorDark: meta.textColorDark,
        description: meta.scopeDescription,
      };
    });
  }, [items]);

  const totalSectors = items.length;
  const totalMeters = useMemo(() => {
    return Math.round(items.reduce((sum, item) => sum + (item.lengthMeters || 0), 0) * 10) / 10;
  }, [items]);

  // Helper for stage icon
  const getStageIcon = (stageNum: number) => {
    switch (stageNum) {
      case 1:
        return <HardHat className="w-4 h-4 text-sky-500" />;
      case 2:
        return <Pickaxe className="w-4 h-4 text-amber-500" />;
      case 3:
        return <Layers className="w-4 h-4 text-purple-500" />;
      case 4:
        return <Boxes className="w-4 h-4 text-teal-500" />;
      case 5:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <HardHat className="w-4 h-4 text-blue-500" />;
    }
  };

  // Custom tooltip for Pie Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: StageSlice = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl shadow-xl border text-xs font-sans min-w-[210px] z-50 backdrop-blur-xs ${
          isLight ? 'bg-white/95 text-slate-900 border-slate-300' : 'bg-slate-900/95 text-white border-slate-700'
        }`}>
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-700/50">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-black text-sm">{data.title}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>العدد:</span>
              <span className="font-bold font-mono text-sm">{data.value} قطاع</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>النسبة:</span>
              <span className="font-bold font-mono">{data.percentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>إجمالي الأطوال:</span>
              <span className="font-bold font-mono text-blue-600 dark:text-amber-300">
                {data.totalLengthMeters.toLocaleString('ar-SA')} م.ط
              </span>
            </div>
            <div className="pt-1 text-[11px] border-t border-slate-700/40 opacity-80">
              {data.description}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-xl border shadow-xl mb-5 overflow-hidden print:hidden transition-colors ${
      isLight 
        ? 'bg-white border-slate-300' 
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Chart Header */}
      <div className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
        isLight 
          ? 'bg-slate-100/90 border-slate-200' 
          : 'bg-slate-950/80 border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border ${
            isLight 
              ? 'bg-blue-100 text-blue-900 border-blue-300' 
              : 'bg-blue-950 text-blue-400 border-blue-800/80'
          }`}>
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              توزيع مراحل العمل الخمس للقطاعات
              <span className={`text-xs font-normal font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                ({totalSectors} قطاع • {totalMeters.toLocaleString('ar-SA')} م.ط)
              </span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              تقسيم مراحل التنفيذ الميداني: 1- رص سيفتي • 2- حفر • 3- تمديد • 4- بحص اعلى ودفان • 5- mc1 و rc2 واسفلت
            </p>
          </div>
        </div>

        {selectedStatus && onSelectStatus && (
          <button
            onClick={() => onSelectStatus('')}
            className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-bold transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-800 hover:text-red-700 bg-white hover:bg-red-50 border-slate-300 shadow-xs'
                : 'text-slate-200 hover:text-red-400 bg-slate-900 hover:bg-red-950/40 border-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            <span>إلغاء التصفية بالمرحلة ({selectedStatus})</span>
          </button>
        )}
      </div>

      {/* Chart Body & Stats Cards */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Pie Chart Visualizer */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
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
                    onClick={(entry: any) => {
                      if (onSelectStatus && entry) {
                        const targetKey = entry.payload?.key || entry.key;
                        if (targetKey) {
                          onSelectStatus(selectedStatus === targetKey ? '' : targetKey);
                        }
                      }
                    }}
                    cursor="pointer"
                  >
                    {chartData.map((entry, index) => {
                      const isSelected = selectedStatus === entry.key;
                      const isHovered = activeIndex === index;
                      return (
                        <Cell
                          key={`cell-${entry.key}-${index}`}
                          fill={entry.color}
                          stroke={isSelected ? '#38bdf8' : isLight ? '#e2e8f0' : '#0f172a'}
                          strokeWidth={isSelected ? 3.5 : 1.5}
                          style={{
                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
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
                <span className={`text-2xl font-black font-mono leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {totalSectors}
                </span>
                <span className={`text-[11px] font-bold mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  إجمالي القطاعات
                </span>
              </div>
            </div>

            <p className={`text-[11px] text-center mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              انقر على أي مرحلة لتصفية جدول الأعمال مباشرة
            </p>
          </div>

          {/* Interactive 5 Stages Breakdown Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {chartData.map((slice, sIdx) => {
              const isSelected = selectedStatus === slice.key;

              return (
                <button
                  key={`stage-${slice.key}-${sIdx}`}
                  onClick={() => {
                    if (onSelectStatus) {
                      onSelectStatus(isSelected ? '' : slice.key);
                    }
                  }}
                  className={`text-right p-3 rounded-xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/80 border-blue-500 scale-[1.02]'
                        : 'ring-2 ring-blue-500 shadow-lg bg-slate-950 border-blue-500 scale-[1.02]'
                      : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                        : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar Indicator */}
                  <div
                    className="absolute top-0 right-0 left-0 h-1.5"
                    style={{ backgroundColor: slice.color }}
                  />

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className={`font-black text-xs sm:text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {slice.title}
                        </span>
                      </div>

                      {getStageIcon(slice.stageNumber)}
                    </div>

                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className={`text-xl sm:text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {slice.value}
                      </span>
                      <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>قطاع</span>
                      <span
                        className={`mr-auto text-xs font-extrabold px-1.5 py-0.5 rounded font-mono border ${
                          isLight
                            ? `${slice.bgColorLight} ${slice.borderColorLight} ${slice.textColorLight}`
                            : `${slice.bgColorDark} ${slice.borderColorDark} ${slice.textColorDark}`
                        }`}
                      >
                        {slice.percentage}%
                      </span>
                    </div>

                    <p className={`text-[11px] line-clamp-1 mb-2 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                      {slice.subTitle}
                    </p>
                  </div>

                  <div className={`pt-2 border-t flex items-center justify-between text-xs ${
                    isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
                  }`}>
                    <span>طول المرحلة:</span>
                    <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
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

