import React, { useState, useRef, useEffect } from 'react';
import { FileDown, Printer, CheckCircle2, AlertCircle, RefreshCw, X, Eye } from 'lucide-react';
import { WorkItem, ProjectMetadata } from '../types';
import { paginateItemsForPdf, downloadReportPdf } from '../utils/pdfDownloader';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: WorkItem[];
  metadata: ProjectMetadata;
  autoStart?: boolean;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  items,
  metadata,
  autoStart = true,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageChunks = paginateItemsForPdf(items);

  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleStartDownload = async () => {
    if (!containerRef.current) return;
    setIsGenerating(true);
    setProgress(5);
    setStatusMessage('جاري إعداد محتوى التقرير...');
    setError(null);
    setDownloadedFileName(null);

    try {
      // إعطاء فرصة للمتصفح لرسم العناصر والخطوط بالكامل
      await new Promise((resolve) => setTimeout(resolve, 300));

      const pageElements = Array.from(
        containerRef.current.querySelectorAll('.pdf-page-canvas')
      ) as HTMLElement[];

      if (pageElements.length === 0) {
        throw new Error('تعذر العثور على صفحات التقرير');
      }

      const fileName = await downloadReportPdf(pageElements, metadata, (percent, msg) => {
        setProgress(percent);
        setStatusMessage(msg);
      });

      setDownloadedFileName(fileName);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setError(err.message || 'حدث خطأ أثناء إنشاء ملف PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // تشغيل التوليد التلقائي عند فتح النافذة
  useEffect(() => {
    if (isOpen && autoStart && !downloadedFileName && !isGenerating) {
      const timer = setTimeout(() => {
        handleStartDownload();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto print:hidden">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-800 overflow-hidden text-right text-slate-100">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-700 to-rose-900 text-white flex items-center justify-between border-b border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <FileDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">تصدير تقرير رسمي معتمد (PDF)</h2>
              <p className="text-xs text-red-200 mt-0.5">
                توليد ملف PDF عالي الدقة (A4 أفقي) جاهز للطباعة والاعتماد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">اسم المشروع:</span>
              <span className="font-extrabold text-white">{metadata.projectName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">المقاول المنفذ:</span>
              <span className="font-bold text-slate-200">{metadata.contractor}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">إجمالي القطاعات المشمولة:</span>
              <span className="font-extrabold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {items.length} قطاع بالكامل
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">عدد الصفحات المتوقع:</span>
              <span className="font-mono font-bold text-blue-400">
                {pageChunks.length} صفحات A4 (أفقي)
              </span>
            </div>
          </div>

          {/* Progress / Status */}
          {isGenerating ? (
            <div className="p-5 rounded-xl bg-blue-950/40 border border-blue-800 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-blue-300 font-bold text-sm">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                <span>{statusMessage || 'جاري توليد ملف PDF...'}</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-blue-300 font-mono">{progress}% مكتمل</p>
            </div>
          ) : downloadedFileName ? (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>تم تنزيل ملف الـ PDF بنجاح على جهازك!</span>
              </div>
              <p className="text-xs text-emerald-300 font-mono break-all pr-7">
                {downloadedFileName}
              </p>
              <p className="text-[11px] text-emerald-400 pr-7">
                تم حفظ التقرير في مجلد التنزيلات (Downloads) بجهازك بكامل البيانات والجداول.
              </p>
            </div>
          ) : null}

          {/* Error Message if any */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="font-bold">تعذر استكمال التنزيل:</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartDownload}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{downloadedFileName ? 'إعادة تحميل ملف PDF' : 'تحميل ملف PDF الآن'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                title="طباعة مباشرة عبر طابعة النظام"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <span>طباعة بالمستعرض</span>
              </button>
            </div>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? 'إخفاء المعاينة' : 'معاينة الصفحات'}</span>
            </button>
          </div>

          {/* Live Preview If Toggled */}
          {showPreview && (
            <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-60 overflow-y-auto text-xs text-center">
              <p className="font-bold text-slate-300 mb-2">معاينة مصغرة لصفحات التقرير ({pageChunks.length} صفحات)</p>
              <p className="text-slate-400 text-[11px]">
                الملف الذي سيتم تنزيله يتضمن الترويسة المعتمدة، جدول الأعمال، والأختام والتواقيع الثلاثية.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 
        Container for PDF Pages 
        Positioned at top: 0, left: 0 with z-index: -999 and opacity: 0
        so html2canvas-pro can accurately calculate bounding rects in positive coordinate space
      */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '1120px',
          zIndex: -999,
          opacity: 0,
          pointerEvents: 'none',
          backgroundColor: '#ffffff',
        }}
        dir="rtl"
      >
        {pageChunks.map((chunk, pageIndex) => {
          const isFirstPage = pageIndex === 0;
          const isLastPage = pageIndex === pageChunks.length - 1;

          return (
            <div
              key={pageIndex}
              className="pdf-page-canvas"
              style={{
                width: '1120px',
                height: '792px',
                minHeight: '792px',
                maxHeight: '792px',
                padding: '24px 32px',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily: 'Tajawal, "IBM Plex Sans Arabic", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              {/* TOP HEADER */}
              <div>
                {isFirstPage ? (
                  <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0 }}>المملكة العربية السعودية</p>
                        <p style={{ fontSize: '10.5px', fontWeight: 700, color: '#334155', margin: '2px 0 0 0' }}>مشروع شبكات الصرف الصحي</p>
                        <p style={{ fontSize: '9.5px', color: '#64748b', margin: '2px 0 0 0' }}>إدارة التنفيذ والمتابعة الميدانية</p>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                          تقرير متابعة القطاعات المفتوحة
                        </h1>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#1e3a8a', margin: '3px 0 0 0' }}>
                          {metadata.projectName}
                        </p>
                      </div>

                      <div style={{ textAlign: 'left', fontSize: '9.5px', color: '#475569' }}>
                        <p style={{ margin: 0 }}>التاريخ: <strong style={{ color: '#0f172a' }}>{currentDate}</strong></p>
                        <p style={{ margin: '2px 0 0 0' }}>الوقت: <strong style={{ color: '#0f172a' }}>{currentTime}</strong></p>
                        <p style={{ color: '#047857', fontWeight: 700, margin: '2px 0 0 0' }}>بيانات حية معتمدة</p>
                      </div>
                    </div>

                    {/* Quick Metadata Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '4px', fontSize: '10px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 700, display: 'block' }}>المقاول المنفذ:</span>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{metadata.contractor}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 700, display: 'block' }}>إجمالي القطاعات:</span>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{items.length} قطاع عمل</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 700, display: 'block' }}>إجمالي أطوال القطاعات:</span>
                        <span style={{ fontWeight: 800, color: '#1e3a8a' }}>{metadata.totalOpenLength ? `${metadata.totalOpenLength} م.ط` : '2,577.8 م.ط'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 700, display: 'block' }}>تاريخ الشيت:</span>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{metadata.date || '2026-09-07'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Running mini header for subsequent pages */
                  <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '6px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>
                      تقرير متابعة القطاعات المفتوحة • {metadata.projectName}
                    </div>
                    <div style={{ color: '#475569', fontSize: '9.5px' }}>
                      المقاول: {metadata.contractor} | التاريخ: {metadata.date || currentDate}
                    </div>
                  </div>
                )}

                {/* TABLE FOR THIS PAGE */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 900, border: '1px solid #94a3b8' }}>
                      <th style={{ padding: '6px 4px', border: '1px solid #94a3b8', textAlign: 'center', width: '32px' }}>م</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #94a3b8', width: '96px' }}>القطاع</th>
                      <th style={{ padding: '6px 4px', border: '1px solid #94a3b8', textAlign: 'center', width: '56px' }}>رقم الخط</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #94a3b8', width: '176px' }}>اسم الشارع</th>
                      <th style={{ padding: '6px 4px', border: '1px solid #94a3b8', textAlign: 'center', width: '64px' }}>الطول</th>
                      <th style={{ padding: '6px 10px', border: '1px solid #94a3b8' }}>وصف العمل الحالي</th>
                      <th style={{ padding: '6px 4px', border: '1px solid #94a3b8', textAlign: 'center', width: '64px' }}>مدة الفتح</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #94a3b8', width: '112px' }}>الفسح / إذن الحفر</th>
                      <th style={{ padding: '6px 4px', border: '1px solid #94a3b8', textAlign: 'center', width: '80px' }}>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((item, rowIdx) => {
                      const isEven = rowIdx % 2 === 0;
                      return (
                        <tr
                          key={item.id || rowIdx}
                          style={{
                            border: '1px solid #cbd5e1',
                            backgroundColor: isEven ? '#ffffff' : '#f8fafc',
                          }}
                        >
                          <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700, color: '#334155', border: '1px solid #cbd5e1' }}>
                            {item.serialNumber}
                          </td>
                          <td style={{ padding: '5px 8px', fontWeight: 800, color: '#0f172a', border: '1px solid #cbd5e1' }}>
                            {item.sector}
                          </td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700, color: '#1e293b', border: '1px solid #cbd5e1' }}>
                            {item.lineNo || '—'}
                          </td>
                          <td style={{ padding: '5px 8px', fontWeight: 700, color: '#0f172a', border: '1px solid #cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                            {item.streetName || '—'}
                          </td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700, color: '#1e3a8a', border: '1px solid #cbd5e1' }}>
                            {item.lengthMeters !== undefined ? `${item.lengthMeters} م` : '—'}
                          </td>
                          <td style={{ padding: '5px 10px', fontWeight: 700, color: '#0f172a', border: '1px solid #cbd5e1' }}>
                            {item.workDescription || '—'}
                          </td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 800, color: '#78350f', border: '1px solid #cbd5e1' }}>
                            {item.openDays !== undefined ? `${Math.round(item.openDays)} يوم` : (item.duration ? `${item.duration} يوم` : '—')}
                          </td>
                          <td style={{ padding: '5px 8px', fontSize: '9.5px', border: '1px solid #cbd5e1' }}>
                            {item.permit ? <div>فسح: {item.permit}</div> : null}
                            {item.digPermitNo ? <div style={{ color: '#475569' }}>إذن: {item.digPermitNo}</div> : null}
                            {!item.permit && !item.digPermitNo ? '—' : null}
                          </td>
                          <td style={{ padding: '5px 4px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '9px',
                              backgroundColor: '#d1fae5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0'
                            }}>
                              {item.status || 'مفتوح (جاري)'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* BOTTOM SECTION */}
              <div>
                {/* SIGNATURES BLOCK ON LAST PAGE */}
                {isLastPage && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px', backgroundColor: '#f8fafc', marginTop: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center', fontSize: '9.5px' }}>
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px', backgroundColor: '#ffffff' }}>
                        <p style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>مهندس الموقع (المقاول)</p>
                        <p style={{ color: '#475569', fontSize: '8.5px', margin: '0 0 16px 0' }}>شركة نظم البيئة للمقاولات</p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '75%', margin: '0 auto 4px auto' }}></div>
                        <p style={{ fontSize: '8px', color: '#64748b', margin: 0 }}>التوقيع والختم</p>
                      </div>

                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px', backgroundColor: '#ffffff' }}>
                        <p style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>مهندس الإشراف (الاستشاري)</p>
                        <p style={{ color: '#475569', fontSize: '8.5px', margin: '0 0 16px 0' }}>استشاري المشروع</p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '75%', margin: '0 auto 4px auto' }}></div>
                        <p style={{ fontSize: '8px', color: '#64748b', margin: 0 }}>التوقيع والاعتماد</p>
                      </div>

                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px', backgroundColor: '#ffffff' }}>
                        <p style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>مدير المشروع</p>
                        <p style={{ color: '#475569', fontSize: '8.5px', margin: '0 0 16px 0' }}>إدارة مشاريع الصرف الصحي</p>
                        <div style={{ borderBottom: '1px dashed #94a3b8', width: '75%', margin: '0 auto 4px auto' }}></div>
                        <p style={{ fontSize: '8px', color: '#64748b', margin: 0 }}>الاعتماد النهائي</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* RUNNING FOOTER */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', paddingTop: '8px', marginTop: '8px', borderTop: '1px solid #cbd5e1' }}>
                  <span>نظام متابعة الأعمال والقطاعات الميدانية • مستخرج رسمياً من قاعدة البيانات الحية</span>
                  <span style={{ fontWeight: 700, color: '#334155' }}>
                    صفحة {pageIndex + 1} من {pageChunks.length}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
