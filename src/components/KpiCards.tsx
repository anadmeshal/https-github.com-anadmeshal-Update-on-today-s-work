import React from 'react';
import { WorkItem, ProjectMetadata } from '../types';
import { MapPin, FileCheck, Layers, Ruler, Clock } from 'lucide-react';
import { classifyWorkStatus } from '../utils/statusClassifier';

interface KpiCardsProps {
  items: WorkItem[];
  metadata: ProjectMetadata;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ items, metadata }) => {
  const totalSectors = items.length || metadata.totalCount || 0;
  
  // Real count of streets entered
  const uniqueStreets = new Set(items.map(i => i.streetName?.trim()).filter(Boolean));
  const enteredStreetsCount = uniqueStreets.size;

  // Real count of permits or dig permits entered
  const enteredPermitsCount = items.filter(i => (i.permit && i.permit.trim()) || (i.digPermitNo && i.digPermitNo.trim())).length;

  // Calculate total length in meters
  const totalLengthM = metadata.totalOpenLength || 
    Math.round(items.reduce((acc, i) => acc + (Number(i.lengthMeters) || 0), 0) * 10) / 10;

  // Helper to extract days cleanly without decimals (strictly integer)
  const getDays = (item: WorkItem): number | null => {
    if (typeof item.openDays === 'number' && !isNaN(item.openDays)) {
      return Math.round(item.openDays);
    }
    if (item.duration) {
      const match = String(item.duration).match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (!isNaN(val)) return Math.round(val);
      }
    }
    return null;
  };

  // 1. All sectors with valid duration
  const itemsWithDuration = items
    .map(i => ({ item: i, days: getDays(i) }))
    .filter((entry): entry is { item: WorkItem; days: number } => entry.days !== null && entry.days > 0);

  const totalDurationDays = itemsWithDuration.reduce((sum, e) => sum + e.days, 0);
  const avgDurationOverall = itemsWithDuration.length > 0 
    ? Math.round(totalDurationDays / itemsWithDuration.length) 
    : 0;

  // 2. Completed sectors (مرحلة 5: mc1 و rc2 واسفلت) vs Others (مراحل 1 إلى 4)
  const completedEntries = itemsWithDuration.filter(e => classifyWorkStatus(e.item) === 'mc1 و rc2 واسفلت');
  const otherEntries = itemsWithDuration.filter(e => classifyWorkStatus(e.item) !== 'mc1 و rc2 واسفلت');

  const avgDurationCompleted = completedEntries.length > 0
    ? Math.round(completedEntries.reduce((sum, e) => sum + e.days, 0) / completedEntries.length)
    : 0;

  const avgDurationOther = otherEntries.length > 0
    ? Math.round(otherEntries.reduce((sum, e) => sum + e.days, 0) / otherEntries.length)
    : 0;

  // Difference: positive means completed was faster (fewer days)
  const diffDays = avgDurationOther - avgDurationCompleted;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
      {/* 1. Total Sectors */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">القطاعات المفتوحة</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/70 border border-blue-800/70 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {totalSectors}
            </span>
            <span className="text-xs font-semibold text-slate-400">قطاع عمل</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 truncate flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0"></span>
          <span className="truncate">من شيت "قطاعات مفتوحة" المباشر</span>
        </div>
      </div>

      {/* 2. Total Length in Meters */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-blue-900/50 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400">إجمالي طول القطاعات</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/70 border border-blue-800/70 text-blue-400 flex items-center justify-center">
              <Ruler className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-300 tracking-tight font-mono">
              {totalLengthM > 0 ? totalLengthM.toLocaleString('ar-SA') : totalLengthM}
            </span>
            <span className="text-xs font-semibold text-blue-400">م.ط</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-blue-300 font-medium truncate">
          {metadata.totalOpenLengthNotice || 'مجموع أطوال الخطوط الجاري العمل بها'}
        </div>
      </div>

      {/* 3. NEW KPI: Average Execution Duration with Completed vs Others Comparison */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-900/50 shadow-xl flex flex-col justify-between sm:col-span-2 lg:col-span-1">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300">متوسط مدة التنفيذ</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-950/70 border border-indigo-800/70 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {avgDurationOverall}
            </span>
            <span className="text-xs font-semibold text-slate-400">يوم</span>
            <span className="text-[10px] text-indigo-300 bg-indigo-950/80 font-bold px-1.5 py-0.5 rounded border border-indigo-800 mr-auto">
              كافة القطاعات ({itemsWithDuration.length})
            </span>
          </div>
        </div>

        {/* Comparative breakdown: Completed vs Others */}
        <div className="mt-3 pt-2 border-t border-slate-800 flex flex-col gap-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0"></span>
              المنجزة (أسفلت):
            </span>
            <span className="font-mono font-extrabold text-emerald-300">
              {avgDurationCompleted} يوم <span className="text-[10px] text-slate-400 font-normal">({completedEntries.length})</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0"></span>
              غير المنجزة (جارية):
            </span>
            <span className="font-mono font-extrabold text-amber-300">
              {avgDurationOther} يوم <span className="text-[10px] text-slate-400 font-normal">({otherEntries.length})</span>
            </span>
          </div>

          {diffDays !== 0 && (
            <div className="mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
              <span>المقارنة:</span>
              {diffDays > 0 ? (
                <span className="text-emerald-400 font-mono">المنجزة أسرع بـ {diffDays} يوم</span>
              ) : (
                <span className="text-amber-400 font-mono">المنجزة أطول بـ {Math.abs(diffDays)} يوم</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Streets count */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الشوارع المشمولة بالعمل</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/70 border border-amber-800/70 text-amber-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {enteredStreetsCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">شارع</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 truncate">
          {enteredStreetsCount > 0 
            ? `موزعة على ${totalSectors} قطاع عمل` 
            : 'غير مسجلة بالرابط'}
        </div>
      </div>

      {/* 5. Permits count */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الفسوحات وتصاريح الحفر</span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/70 border border-purple-800/70 text-purple-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {enteredPermitsCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">تصريح موثق</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 truncate">
          {enteredPermitsCount > 0 
            ? 'تشمل أرقام الفسح وتصاريح PTW' 
            : 'غير مسجلة'}
        </div>
      </div>
    </div>
  );
};
