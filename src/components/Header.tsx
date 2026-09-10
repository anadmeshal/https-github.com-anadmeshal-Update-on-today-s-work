import React from 'react';
import { RefreshCw, Upload, Plus, Download, Code2, CheckCircle2, AlertCircle, Printer, FileDown, Monitor, Maximize2, Minimize2, Sun, Moon } from 'lucide-react';
import { ProjectMetadata } from '../types';

export type LayoutWidthMode = 'comfortable' | 'full' | 'compact';
export type ThemeMode = 'dark' | 'light';

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
  layoutWidth: LayoutWidthMode;
  onLayoutWidthChange: (mode: LayoutWidthMode) => void;
  containerWidthClass: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
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
  layoutWidth,
  onLayoutWidthChange,
  containerWidthClass,
  theme,
  onToggleTheme,
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur-md print:hidden w-full">
      <div className={`${containerWidthClass} py-4`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title & Project Info */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                م
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  نظام متابعة الأعمال والقطاعات
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    بيانات فعلية 100%
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-slate-200">{metadata.projectName}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{metadata.contractor}</span>
                  {metadata.date && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 font-mono text-xs">{metadata.date}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Actions & Layout Width Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Layout Width Mode Switcher */}
            <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onLayoutWidthChange('comfortable')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  layoutWidth === 'comfortable'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض مناسب ومتوازن (1536px) - مريح للعينين ومناسب لجميع الشاشات"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>عرض مناسب</span>
              </button>
              <button
                type="button"
                onClick={() => onLayoutWidthChange('full')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  layoutWidth === 'full'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="ملء الشاشة بالكامل (100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ملء الشاشة</span>
              </button>
              <button
                type="button"
                onClick={() => onLayoutWidthChange('compact')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  layoutWidth === 'compact'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض قياسي (1280px)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">قياسي</span>
              </button>
            </div>
            {/* Theme Toggle: Explicit 2-button Segmented Control */}
            <div className={`flex items-center rounded-lg p-0.5 text-xs border transition-colors ${
              theme === 'light' 
                ? 'bg-slate-100 border-slate-300' 
                : 'bg-slate-950 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => theme !== 'dark' && onToggleTheme()}
                className={`px-2.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-amber-300 shadow-xs border border-slate-700'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="تفعيل الوضع الليلي (Dark Mode)"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>ليلي</span>
              </button>
              <button
                type="button"
                onClick={() => theme !== 'light' && onToggleTheme()}
                className={`px-2.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-300'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="تفعيل الوضع الفاتح (Light Mode)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>فاتح</span>
              </button>
            </div>

            {/* Sync from live Google Script */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
              title="تحديث البيانات المباشرة من رابط Google Script"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : 'text-slate-300'}`} />
              <span>تحديث الرابط</span>
            </button>

            {/* Upload Excel */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-300 bg-blue-950/70 hover:bg-blue-900/80 border border-blue-800/80 rounded-lg transition-colors shadow-xs"
              title="رفع ملف Excel به كامل الأعمدة (وصف، شارع، موقع، مدة، فسح)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع ملف Excel</span>
            </button>

            {/* Add / Paste Row */}
            <button
              onClick={onOpenAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/80 rounded-lg transition-colors shadow-xs"
              title="إضافة صف أو لصق بيانات فعلية"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صفوف</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={onExportPdf || handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all shadow-sm cursor-pointer"
              title="تصدير وطباعة تقرير رسمي معتمد لكافة القطاعات بصيغة PDF"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>طباعة PDF احترافية</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="تصدير جدول الأعمال الحالي إلى Excel"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>تصدير Excel</span>
            </button>

            {/* Print Report */}
            <button
              onClick={onExportPdf || handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="فتح خيارات الطباعة الرسمية للتقرير"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>طباعة</span>
            </button>

            {/* Script Helper */}
            <button
              onClick={onOpenScriptHelper}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-amber-300 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-800/80 rounded-lg transition-colors"
              title="طريقة تصدير جميع أعمدة Google Sheet بالرابط"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">إعداد الرابط</span>
            </button>
          </div>
        </div>

        {/* Live sync banner notice if detailed columns need script fix or upload */}
        {!hasDetailedColumns && (
          <div className="mt-3.5 p-3 rounded-lg bg-blue-950/50 border border-blue-800/70 flex items-start gap-3 text-xs text-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-blue-300">حالة قاعدة البيانات: </span>
              تم الاتصال بنجاح بالرابط الحي وقراءة <span className="font-semibold text-white">{metadata.totalCount} قطاع</span> للمشروع.
              رابط Google Apps Script الحالي يرسل حالياً العمود الأول فقط؛ يمكنك 
              <button 
                onClick={onOpenUpload}
                className="mx-1 text-blue-400 font-bold underline hover:text-blue-300"
              >
                رفع ملف Excel مباشرة هنا
              </button>
              لعرض أعمدة (الوصف، الشارع، الموقع، مدة التنفيذ، الفسح) بشكل فوري، أو 
              <button 
                onClick={onOpenScriptHelper}
                className="mx-1 text-amber-400 font-bold underline hover:text-amber-300"
              >
                تحديث كود Google Apps Script
              </button> 
              لتصدير كافة الأعمدة تلقائياً.
            </div>
            {lastUpdated && (
              <span className="text-slate-400 text-[11px] font-mono shrink-0">
                آخر مزامنة: {lastUpdated}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
