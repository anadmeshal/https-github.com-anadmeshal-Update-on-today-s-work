/**
 * وظيفة تصدير تقرير القطاعات كملف PDF
 * يقوم بإعداد عنوان الملف التلقائي وضبط تهيئة التقرير الهندسي
 */
export function exportReportToPdf(projectName?: string, date?: string) {
  const cleanProject = (projectName || 'مشروع_شبكات_الصرف_الصحي')
    .replace(/[^\u0621-\u064Aa-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const cleanDate = date || new Date().toISOString().split('T')[0];
  const pdfFileName = `تقرير_متابعة_القطاعات_المفتوحة_${cleanProject}_${cleanDate}`;

  const originalTitle = document.title;
  try {
    document.title = pdfFileName;
    window.print();
  } finally {
    // إعادة العنوان الأصلي بعد اكتمال أو إلغاء نافذة الطباعة
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  }
}
