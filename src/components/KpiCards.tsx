import React from 'react';
import { WorkItem, ProjectMetadata } from '../types';
import { MapPin, FileCheck, Layers, Ruler, CheckCircle2 } from 'lucide-react';

interface KpiCardsProps {
  items: WorkItem[];
  metadata: ProjectMetadata;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ items, metadata }) => {
  const totalSectors = items.length || metadata.totalCount || 0;
  
  // Count open sectors based on actual data
  const openSectors = items.filter(
    item => item.status?.includes('مفتوح') || item.status?.includes('جاري')
  ).length || metadata.openSectorsCount || totalSectors;

  // Real count of streets entered
  const uniqueStreets = new Set(items.map(i => i.streetName?.trim()).filter(Boolean));
  const enteredStreetsCount = uniqueStreets.size;

  // Real count of permits or dig permits entered
  const enteredPermitsCount = items.filter(i => (i.permit && i.permit.trim()) || (i.digPermitNo && i.digPermitNo.trim())).length;

  // Calculate total length in meters
  const totalLengthM = metadata.totalOpenLength || 
    Math.round(items.reduce((acc, i) => acc + (Number(i.lengthMeters) || 0), 0) * 10) / 10;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
      {/* 1. Total Sectors */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">القطاعات المفتوحة</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {totalSectors}
          </span>
          <span className="text-xs font-semibold text-slate-500">قطاع عمل</span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-500 truncate flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>من شيت "قطاعات مفتوحة" المباشر</span>
        </div>
      </div>

      {/* 2. Total Length in Meters */}
      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-700">إجمالي طول القطاعات المفتوحة</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Ruler className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-800 tracking-tight font-mono">
            {totalLengthM > 0 ? totalLengthM.toLocaleString('ar-SA') : totalLengthM}
          </span>
          <span className="text-xs font-semibold text-blue-600">م.ط</span>
        </div>
        <div className="mt-1.5 text-[11px] text-blue-700 font-medium truncate">
          {metadata.totalOpenLengthNotice || 'مجموع أطوال الخطوط الجاري العمل بها'}
        </div>
      </div>

      {/* 3. Streets count */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">الشوارع المشمولة بالعمل</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {enteredStreetsCount}
          </span>
          <span className="text-xs font-semibold text-slate-500">شارع</span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-500 truncate">
          {enteredStreetsCount > 0 
            ? `موزعة على ${totalSectors} قطاع عمل` 
            : 'غير مسجلة بالرابط'}
        </div>
      </div>

      {/* 4. Permits count */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">الفسوحات وتصاريح الحفر</span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {enteredPermitsCount}
          </span>
          <span className="text-xs font-semibold text-slate-500">تصريح موثق</span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-500 truncate">
          {enteredPermitsCount > 0 
            ? 'تشمل أرقام الفسح وتصاريح الحفر PTW' 
            : 'غير مسجلة'}
        </div>
      </div>
    </div>
  );
};
