import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { WorkItem, ProjectMetadata } from '../types';

export interface GeneratePdfOptions {
  items: WorkItem[];
  metadata: ProjectMetadata;
  onProgress?: (percent: number, message: string) => void;
}

/**
 * تقسيم العناصر إلى صفحات تتناسب تماماً مع مقاس A4 بالعرض (Landscape)
 */
export function paginateItemsForPdf(items: WorkItem[]): WorkItem[][] {
  const pages: WorkItem[][] = [];
  if (items.length === 0) return [[]];

  // إذا كان العدد قليل (حتى 13 عنصر) يكفي صفحة واحدة مع التواقيع
  if (items.length <= 13) {
    return [items];
  }

  // الصفحة الأولى: هيدر كامل + 15 عنصر
  const page1Size = 15;
  pages.push(items.slice(0, page1Size));

  let currentIndex = page1Size;

  while (currentIndex < items.length) {
    const remaining = items.length - currentIndex;

    // إذا كان المتبقي 14 أو أقل، نضعه في الصفحة الأخيرة مع التواقيع
    if (remaining <= 14) {
      pages.push(items.slice(currentIndex, items.length));
      break;
    } else {
      // صفحة وسطية تتسع لـ 17 عنصر
      const take = 17;
      pages.push(items.slice(currentIndex, currentIndex + take));
      currentIndex += take;
    }
  }

  return pages;
}

/**
 * دالة توليد وتنزيل ملف PDF الفعلي
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
      const p = Math.round(((i) / totalPages) * 90) + 5;
      onProgress(p, `جاري معالجة الصفحة ${i + 1} من ${totalPages}...`);
    }

    const canvas = await html2canvas(pageEl, {
      scale: 2, // دقة عالية جداً
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        // Ensure the cloned container and pages are visible with full opacity
        const clonedPages = clonedDoc.querySelectorAll('.pdf-page-canvas');
        clonedPages.forEach((cp) => {
          (cp as HTMLElement).style.opacity = '1';
          if (cp.parentElement) {
            cp.parentElement.style.opacity = '1';
            cp.parentElement.style.left = '0';
            cp.parentElement.style.top = '0';
          }
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage('a4', 'landscape');
    }

    // مقاس A4 بالعرض: 297mm عرض × 210mm ارتفاع
    pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
  }

  if (onProgress) {
    onProgress(98, 'جاري تنزيل ملف PDF...');
  }

  const cleanProject = (metadata.projectName || 'مشروع_شبكات_صرف_صحي_العوالى_2')
    .replace(/[^\u0621-\u064Aa-zA-Z0-9_-]/g, '_')
    .slice(0, 45);
  const cleanDate = metadata.date || new Date().toISOString().split('T')[0];
  const fileName = `تقرير_متابعة_القطاعات_المفتوحة_${cleanProject}_${cleanDate}.pdf`;

  pdf.save(fileName);

  if (onProgress) {
    onProgress(100, 'تم تنزيل ملف PDF بنجاح!');
  }

  return fileName;
}
