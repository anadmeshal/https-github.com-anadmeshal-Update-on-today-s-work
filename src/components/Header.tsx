import React from 'react';
import { RefreshCw, Upload, Plus, Download, Code2, CheckCircle2, AlertCircle, Printer, FileDown } from 'lucide-react';
import { ProjectMetadata } from '../types';

interface HeaderProps {
  metadata: ProjectMetadata;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenUpload: () => void;
  onOpenAddRow: () => void;
  onExport: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
  onOpenScriptHelper: () => void;
  lastUpdated: string | null;
  hasDetailedColumns: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  isLoading,
  onRefresh,
  onOpenUpload,
  onOpenAddRow,
  onExport,
  onExportPdf,
  onPrint,
  onOpenScriptHelper,
  lastUpdated,
  hasDetailedColumns,
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title & Project Info */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                م
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  نظام متابعة الأعمال والقطاعات
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    بيانات فعلية 100%
                  </span>
                </h1>
                <p className="text-sm text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-slate-800">{metadata.projectName}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">{metadata.contractor}</span>
                  {metadata.date && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-mono text-xs">{metadata.date}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Sync from live Google Script */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              title="تحديث البيانات المباشرة من رابط Google Script"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
              <span>تحديث الرابط</span>
            </button>

            {/* Upload Excel */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
              title="رفع ملف Excel به كامل الأعمدة (وصف، شارع، موقع، مدة، فسح)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع ملف Excel</span>
            </button>

            {/* Add / Paste Row */}
            <button
              onClick={onOpenAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs"
              title="إضافة صف أو لصق بيانات فعلية"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صفوف</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={onExportPdf || handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-xs"
              title="تصدير تقرير شامل ومعتمد لكافة القطاعات بصيغة PDF"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>تصدير PDF</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
              title="تصدير جدول الأعمال الحالي إلى Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>

            {/* Print Report */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors shadow-xs"
              title="طباعة التقرير الفوري"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>طباعة</span>
            </button>

            {/* Script Helper */}
            <button
              onClick={onOpenScriptHelper}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
              title="طريقة تصدير جميع أعمدة Google Sheet بالرابط"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">إعداد الرابط</span>
            </button>
          </div>
        </div>

        {/* Live sync banner notice if detailed columns need script fix or upload */}
        {!hasDetailedColumns && (
          <div className="mt-3.5 p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 text-xs text-blue-900">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">حالة قاعدة البيانات: </span>
              تم الاتصال بنجاح بالرابط الحي وقراءة <span className="font-semibold">{metadata.totalCount} قطاع</span> للمشروع.
              رابط Google Apps Script الحالي يرسل حالياً العمود الأول فقط؛ يمكنك 
              <button 
                onClick={onOpenUpload}
                className="mx-1 text-blue-700 font-bold underline hover:text-blue-900"
              >
                رفع ملف Excel مباشرة هنا
              </button>
              لعرض أعمدة (الوصف، الشارع، الموقع، مدة التنفيذ، الفسح) بشكل فوري، أو 
              <button 
                onClick={onOpenScriptHelper}
                className="mx-1 text-amber-800 font-bold underline hover:text-amber-950"
              >
                تحديث كود Google Apps Script
              </button> 
              لتصدير كافة الأعمدة تلقائياً.
            </div>
            {lastUpdated && (
              <span className="text-slate-500 text-[11px] font-mono shrink-0">
                آخر مزامنة: {lastUpdated}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
