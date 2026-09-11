import React from 'react';
import { WorkItem } from '../types';
import { formatDays } from '../utils/formatters';
import { 
  X, 
  MapPin, 
  FileCheck, 
  Wrench, 
  Clock, 
  Edit3,
  Calendar,
  Trash2
} from 'lucide-react';

interface SectorDetailModalProps {
  isOpen: boolean;
  item: WorkItem | null;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onEdit: (item: WorkItem) => void;
  onDelete?: (item: WorkItem) => void;
}

export const SectorDetailModal: React.FC<SectorDetailModalProps> = ({
  isOpen,
  item,
  theme = 'dark',
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !item) return null;
  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border text-right ${
        isLight 
          ? 'bg-white border-slate-300 text-slate-900' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Modal Header */}
        <div className={`p-5 flex items-center justify-between border-b ${
          isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-base font-mono ${
              isLight ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-blue-500/20 border-blue-400/30 text-blue-300'
            }`}>
              #{item.serialNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">{item.sector}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {item.status || 'جاري العمل'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                عقد تنفيذ شبكات صرف صحي العوالي 2 - الرياض • شركة نظم البيئة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
          {/* Work Description Card */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div className={`flex items-center gap-2 text-xs font-bold mb-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Wrench className="w-4 h-4 text-blue-500" />
              <span>وصف العمل الحالي:</span>
            </div>
            <p className={`text-sm font-bold leading-relaxed ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {item.workDescription || <span className="text-slate-400 font-normal italic">— غير محدد</span>}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Line No */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className={`text-xs font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>رقم الخط:</div>
              <p className={`text-sm font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {item.lineNo || <span className="text-slate-400 font-sans font-normal">—</span>}
              </p>
            </div>

            {/* Sector Length */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className={`text-xs font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>طول القطاع (م.ط):</div>
              <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                {item.lengthMeters !== undefined ? `${item.lengthMeters} م.ط` : <span className="text-slate-400 font-sans font-normal">—</span>}
              </p>
            </div>

            {/* Street & Location */}
            <div className={`p-3.5 rounded-xl border sm:col-span-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className={`flex items-center gap-2 text-xs font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <MapPin className="w-4 h-4 text-red-500" />
                <span>اسم الشارع والموقع:</span>
              </div>
              <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {item.streetName || <span className="text-slate-400 font-normal">—</span>}
              </p>
              {item.location && (
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  الموقع: {item.location}
                </p>
              )}
            </div>

            {/* Open duration */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className={`flex items-center gap-2 text-xs font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <Clock className="w-4 h-4 text-amber-500" />
                <span>مدة الفتح:</span>
              </div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 font-mono">
                {item.openDays !== undefined ? `${Math.round(item.openDays)} يوم` : (item.duration ? formatDays(item.duration) : '—')}
              </p>
              {item.digPermitDate && (
                <p className={`text-xs mt-1 font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  تاريخ بدء الحفر: {item.digPermitDate}
                </p>
              )}
            </div>

            {/* Status */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className={`text-xs font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>الحالة:</div>
              {(() => {
                const isClosed = (item.status || '').includes('مغلق') || (item.status || '').includes('مكتمل');
                return (
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                    isClosed
                      ? isLight ? 'bg-blue-100 text-blue-950 border border-blue-300' : 'bg-blue-950 text-blue-300 border border-blue-800'
                      : isLight ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه'}
                  </span>
                );
              })()}
            </div>

            {/* Permit (فسح) */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                <FileCheck className="w-4 h-4" />
                <span>الفسح وتاريخ الإصدار:</span>
              </div>
              <p className={`text-sm font-mono font-bold ${isLight ? 'text-emerald-950' : 'text-white'}`}>
                {item.permit ? `رقم: ${item.permit}` : <span className="text-slate-400 font-sans font-normal">غير مسجل</span>}
              </p>
              <div className="flex items-center gap-1 mt-1.5 text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {item.permitIssueDate ? (
                  <span className={`font-bold ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                    تاريخ الفسح: {item.permitIssueDate}
                  </span>
                ) : (
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                    تاريخ الفسح: غير مسجل بقاعدة البيانات
                  </span>
                )}
              </div>
            </div>

            {/* Excavation Permit (إذن الحفر) */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                <FileCheck className="w-4 h-4" />
                <span>إذن الحفر وتاريخه:</span>
              </div>
              <p className={`text-sm font-mono font-bold ${isLight ? 'text-indigo-950' : 'text-white'}`}>
                {item.digPermitNo ? `رقم: ${item.digPermitNo}` : <span className="text-slate-400 font-sans font-normal">غير مسجل</span>}
              </p>
              <div className="flex items-center gap-1 mt-1.5 text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                {item.digPermitDate ? (
                  <span className={`font-bold ${isLight ? 'text-indigo-950' : 'text-indigo-300'}`}>
                    تاريخ الإذن: {item.digPermitDate}
                  </span>
                ) : (
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                    تاريخ الإذن: غير مسجل بقاعدة البيانات
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>تعديل هذا القطاع والتواريخ</span>
            </button>

            {onDelete && (
              <button
                onClick={() => {
                  onClose();
                  onDelete(item);
                }}
                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="حذف هذا القطاع من السجلات"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
