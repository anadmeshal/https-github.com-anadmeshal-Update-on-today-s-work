import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { WorkItem, ProjectMetadata } from '../types';

export interface GeneratePdfOptions {
  items: WorkItem[];
  metadata: ProjectMetadata;
  includeStats?: boolean;
  includeSignatures?: boolean;
  includeCharts?: boolean;
  onProgress?: (percent: number, message: string) => void;
}

/**
 * تقسيم ديناميكي ذكي للعناصر حسب مقاسات صفحة A4 بالعرض (Landscape)
 * يراعي بدقة وجود صفحة الرسومات البيانية أو الترويسة التنفيذية في الصفحة الأولى، ومصفوفة التواقيع في الصفحة الأخيرة
 */
export function paginateItemsForPdf(
  items: WorkItem[],
  options?: { 
    includeStats?: boolean; 
    includeSignatures?: boolean; 
    includeCharts?: boolean;
    rowsPerPage?: number;
  }
): WorkItem[][] {
  const includeStats = options?.includeStats ?? true;
  const includeSignatures = options?.includeSignatures ?? true;
  const includeCharts = options?.includeCharts ?? false;
  // سعة الأسطر الأساسية في كل صفحة (الافتراضي 10 أسطر لضمان عدم قص أي نص أو انقطاعه هندسياً)
  const baseCapacity = Math.min(13, Math.max(7, options?.rowsPerPage ?? 10));

  if (!items || items.length === 0) return [[]];

  // إذا تم تفعيل صفحة الرسومات البيانية المستقلة (الصفحة 1):
  if (includeCharts) {
    // صفحة التواقيع الأخيرة تأخذ مساحة تعادل نحو 2-3 أسطر
    const lastPageCapacity = includeSignatures ? Math.max(5, baseCapacity - 3) : baseCapacity;

    if (items.length <= lastPageCapacity) {
      return [items];
    }

    const pages: WorkItem[][] = [];
    let currentIndex = 0;

    while (currentIndex < items.length) {
      const remaining = items.length - currentIndex;

      if (remaining <= lastPageCapacity) {
        pages.push(items.slice(currentIndex, items.length));
        break;
      } else if (remaining <= baseCapacity + lastPageCapacity) {
        // توزيع متوازن ومريح على الصفحتين الأخيرتين
        const firstBatch = Math.min(baseCapacity, Math.ceil(remaining / 2));
        pages.push(items.slice(currentIndex, currentIndex + firstBatch));
        currentIndex += firstBatch;
        pages.push(items.slice(currentIndex, items.length));
        break;
      } else {
        pages.push(items.slice(currentIndex, currentIndex + baseCapacity));
        currentIndex += baseCapacity;
      }
    }
    return pages;
  }

  // عند عدم تفعيل صفحة الرسومات المستقلة (الصفحة الأولى تشتمل على الترويسة التنفيذية ومؤشرات الـ KPIs):
  const page1Capacity = includeStats ? Math.max(5, baseCapacity - 3) : Math.max(6, baseCapacity - 1);
  const lastPageCapacity = includeSignatures ? Math.max(5, baseCapacity - 3) : baseCapacity;

  // إذا كان التقرير صفحة واحدة شاملة الترويسة والتواقيع
  const singlePageMax = Math.max(4, baseCapacity - (includeStats ? 3 : 1) - (includeSignatures ? 3 : 0));
  if (items.length <= singlePageMax) {
    return [items];
  }

  const pages: WorkItem[][] = [];

  // الصفحة الأولى
  const firstBatchCount = Math.min(items.length, page1Capacity);
  pages.push(items.slice(0, firstBatchCount));
  let currentIndex = firstBatchCount;

  while (currentIndex < items.length) {
    const remaining = items.length - currentIndex;

    if (remaining <= lastPageCapacity) {
      pages.push(items.slice(currentIndex, items.length));
      break;
    } else if (remaining <= baseCapacity + lastPageCapacity) {
      const firstBatch = Math.min(baseCapacity, Math.ceil(remaining / 2));
      pages.push(items.slice(currentIndex, currentIndex + firstBatch));
      currentIndex += firstBatch;
      pages.push(items.slice(currentIndex, items.length));
      break;
    } else {
      pages.push(items.slice(currentIndex, currentIndex + baseCapacity));
      currentIndex += baseCapacity;
    }
  }

  return pages;
}

/**
 * دالة توليد وتنزيل ملف PDF عالي الدقة بمعايير هندسية معتمدة
 */
export async function downloadReportPdf(
  pageElements: HTMLElement[],
  metadata: ProjectMetadata,
  onProgress?: (percent: number, message: string) => void
): Promise<string> {
  if (!pageElements || pageElements.length === 0) {
    throw new Error('لا توجد صفحات مهيأة للطباعة');
  }

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const totalPages = pageElements.length;

  for (let i = 0; i < totalPages; i++) {
    const pageEl = pageElements[i];
    if (onProgress) {
      const p = Math.round((i / totalPages) * 85) + 5;
      onProgress(p, `جاري معالجة الصفحة ${i + 1} من ${totalPages} بدقة متناهية...`);
    }

    const canvas = await html2canvas(pageEl, {
      scale: 2.2, // دقة طباعة فائقة الوضوح (Retina Sharpness)
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // حماية تامة من تباعد الحروف العربية وتفككها
        const style = clonedDoc.createElement('style');
        style.innerHTML = `
          * {
            letter-spacing: normal !important;
            word-spacing: normal !important;
          }
          .pdf-page-canvas h1, .pdf-page-canvas h2, .pdf-page-canvas h3, 
          .pdf-page-canvas p, .pdf-page-canvas span, .pdf-page-canvas td, 
          .pdf-page-canvas th, .pdf-page-canvas div {
            letter-spacing: normal !important;
            font-feature-settings: "liga" 1, "calt" 1 !important;
          }
        `;
        clonedDoc.head.appendChild(style);

        // ضمان ظهور الصفحة والخطوط بنسبة 100% داخل البيئة المستنسخة
        const clonedPages = clonedDoc.querySelectorAll('.pdf-page-canvas');
        clonedPages.forEach((cp) => {
          const el = cp as HTMLElement;
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          if (el.parentElement) {
            el.parentElement.style.opacity = '1';
            el.parentElement.style.visibility = 'visible';
            el.parentElement.style.left = '0';
            el.parentElement.style.top = '0';
          }
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    if (i > 0) {
      pdf.addPage('a4', 'landscape');
    }

    // مقاس A4 بالعرض القياسي العالمي: 297mm عرض × 210mm ارتفاع
    pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
  }

  if (onProgress) {
    onProgress(95, 'جاري تجميع وحفظ ملف الـ PDF النهائي...');
  }

  const cleanProject = (metadata.projectName || 'مشروع_شبكات_صرف_صحي_العوالي_2_الرياض')
    .replace(/[^\u0621-\u064Aa-zA-Z0-9_-]/g, '_')
    .slice(0, 45);
  const cleanDate = metadata.date || new Date().toISOString().split('T')[0];
  const fileName = `تقرير_متابعة_القطاعات_المفتوحة_${cleanProject}_${cleanDate}.pdf`;

  pdf.save(fileName);

  if (onProgress) {
    onProgress(100, 'تم إنشاء وحفظ ملف الـ PDF بنجاح!');
  }

  return fileName;
}
