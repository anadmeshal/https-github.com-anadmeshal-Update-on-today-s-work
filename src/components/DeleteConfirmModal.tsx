import React from 'react';
import { WorkItem } from '../types';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { classifyWorkStatus, STAGE_CATEGORIES } from '../utils/statusClassifier';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: WorkItem | null;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  theme = 'dark',
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !item) return null;
  const isLight = theme === 'light';

  const stage = classifyWorkStatus(item);
  const stageMeta = STAGE_CATEGORIES[stage];

  const handleConfirm = () => {
    onConfirmDelete(item.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border text-right animate-in fade-in zoom-in-95 duration-150 ${
        isLight 
          ? 'bg-white border-slate-300 text-slate-900' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b ${
          isLight ? 'bg-red-50/70 border-red-200' : 'bg-red-950/40 border-red-900/50'
        }`}>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-black">تأكيد حذف القطاع</h3>
              <p className="text-[11px] opacity-80">سيتم إزالة هذا السجل من جدول الأعمال</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5">
          <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            هل أنت متأكد من رغبتك في حذف هذا القطاع بشكل نهائي؟
          </p>

          {/* Sector Card */}
          <div className={`p-3.5 rounded-xl border space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                isLight ? 'bg-blue-100 text-blue-900' : 'bg-blue-950 text-blue-300 border border-blue-800'
              }`}>
                #{item.serialNumber}
              </span>
              <span className="font-black text-sm">{item.sector || 'قطاع غير مسمى'}</span>
            </div>

            {item.lineNo && (
              <div className="flex justify-between text-xs">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>رقم الخط:</span>
                <span className="font-mono font-bold">{item.lineNo}</span>
              </div>
            )}

            {item.streetName && (
              <div className="flex justify-between text-xs">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>الشارع:</span>
                <span className="font-medium">{item.streetName}</span>
              </div>
            )}

            {item.lengthMeters !== undefined && (
              <div className="flex justify-between text-xs">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>الطول:</span>
                <span className="font-mono font-bold">{item.lengthMeters} م.ط</span>
              </div>
            )}

            {stageMeta && (
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700/20">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>المرحلة:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isLight ? `${stageMeta.bgColorLight} ${stageMeta.textColorLight}` : `${stageMeta.bgColorDark} ${stageMeta.textColorDark}`
                }`}>
                  {stageMeta.title}
                </span>
              </div>
            )}

            {item.workDescription && (
              <div className="text-xs pt-1 text-slate-500 dark:text-slate-400 line-clamp-2">
                <span className="font-semibold text-slate-600 dark:text-slate-300">الوصف: </span>
                {item.workDescription}
              </div>
            )}
          </div>

          <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>يمكنك دائماً استعادة البيانات الأصلية بالضغط على "تحديث البيانات" من السحابة.</span>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-end gap-2.5 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>نعم، تأكيد الحذف</span>
          </button>
        </div>
      </div>
    </div>
  );
};
