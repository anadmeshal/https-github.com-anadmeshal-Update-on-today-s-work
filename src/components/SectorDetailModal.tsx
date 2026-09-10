import React from 'react';
import { WorkItem } from '../types';
import { formatDays } from '../utils/formatters';
import { 
  X, 
  MapPin, 
  FileCheck, 
  Wrench, 
  Clock, 
  Edit3
} from 'lucide-react';

interface SectorDetailModalProps {
  isOpen: boolean;
  item: WorkItem | null;
  onClose: () => void;
  onEdit: (item: WorkItem) => void;
}

export const SectorDetailModal: React.FC<SectorDetailModalProps> = ({
  isOpen,
  item,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-800 text-slate-100">
        {/* Modal Header */}
        <div className="bg-slate-950 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold text-base font-mono">
              #{item.serialNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">{item.sector}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {item.status || 'جاري العمل'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                عقد تنفيذ شبكات صرف صحي العوالي 2 - الرياض • شركة نظم البيئة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-slate-200 text-sm max-h-[75vh] overflow-y-auto">
          {/* Work Description Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5">
              <Wrench className="w-4 h-4 text-blue-400" />
              <span>وصف العمل الحالي:</span>
            </div>
            <p className="text-sm font-bold text-white leading-relaxed">
              {item.workDescription || <span className="text-slate-500 font-normal italic">— غير محدد</span>}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Line No */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs font-bold text-slate-400 mb-1">رقم الخط:</div>
              <p className="text-sm font-mono font-bold text-white">
                {item.lineNo || <span className="text-slate-500 font-sans font-normal">—</span>}
              </p>
            </div>

            {/* Sector Length */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs font-bold text-slate-400 mb-1">طول القطاع (م.ط):</div>
              <p className="text-sm font-mono font-bold text-blue-400">
                {item.lengthMeters !== undefined ? `${item.lengthMeters} م.ط` : <span className="text-slate-500 font-sans font-normal">—</span>}
              </p>
            </div>

            {/* Street & Location */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 sm:col-span-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                <MapPin className="w-4 h-4 text-red-400" />
                <span>اسم الشارع والموقع:</span>
              </div>
              <p className="text-sm font-bold text-white">
                {item.streetName || <span className="text-slate-500 font-normal">—</span>}
              </p>
              {item.location && (
                <p className="text-xs text-slate-400 mt-1">
                  الموقع: {item.location}
                </p>
              )}
            </div>

            {/* Open duration */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>مدة الفتح:</span>
              </div>
              <p className="text-sm font-bold text-amber-400 font-mono">
                {item.openDays !== undefined ? `${Math.round(item.openDays)} يوم` : (item.duration ? formatDays(item.duration) : '—')}
              </p>
            </div>

            {/* Status */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs font-bold text-slate-400 mb-1">الحالة:</div>
              {(() => {
                const isClosed = (item.status || '').includes('مغلق') || (item.status || '').includes('مكتمل');
                return (
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                    isClosed
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه'}
                  </span>
                );
              })()}
            </div>

            {/* Permit (فسح) */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>الفسح:</span>
              </div>
              <p className="text-sm font-mono font-bold text-white">
                {item.permit ? `رقم: ${item.permit}` : <span className="text-slate-500 font-sans font-normal">غير مسجل</span>}
              </p>
              {item.permitIssueDate && (
                <p className="text-xs text-slate-400 mt-1">
                  تاريخ الفسح: {item.permitIssueDate}
                </p>
              )}
            </div>

            {/* Excavation Permit (إذن الحفر) */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                <span>إذن الحفر:</span>
              </div>
              <p className="text-sm font-mono font-bold text-white">
                {item.digPermitNo ? `رقم: ${item.digPermitNo}` : <span className="text-slate-500 font-sans font-normal">غير مسجل</span>}
              </p>
              {item.digPermitDate && (
                <p className="text-xs text-slate-400 mt-1">
                  تاريخ إذن الحفر: {item.digPermitDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>تعديل هذا القطاع</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
