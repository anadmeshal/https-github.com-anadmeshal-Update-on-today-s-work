import { WorkItem } from '../types';

export type WorkStatusCategory = 'مفتوح' | 'جاري' | 'منجز';

/**
 * دالة تصنيف حالة العمل المعتمدة:
 * 1. المنجز: اسفلت (ط1 أو ط2 أو أسفلت)
 * 2. المفتوح: رص سيفتي (رص سيفتي وحواجز السلامة)
 * 3. الجاري: حفر تمديد دفان (أعمال الحفر والتمديد والدفان والاستلامات)
 */
export function classifyWorkStatus(item: Partial<WorkItem> | string): WorkStatusCategory {
  const desc = typeof item === 'string' 
    ? item.toLowerCase().trim()
    : ((item.workDescription || '') + ' ' + (item.status || '')).toLowerCase().trim();

  // 1. المنجز: اسفلت
  if (
    desc.includes('أسفلت') ||
    desc.includes('اسفلت') ||
    desc.includes('سفلتة') ||
    desc.includes('ط1') ||
    desc.includes('ط2') ||
    desc.includes('طبقة أولى') ||
    desc.includes('طبقة ثانية') ||
    desc.includes('طبقة اولي') ||
    desc.includes('طبقة ثانيه')
  ) {
    return 'منجز';
  }

  // 2. المفتوح: رص سيفتي
  if (
    desc.includes('سيفتي') ||
    desc.includes('سلامة') ||
    desc.includes('سلامه') ||
    desc.includes('حواجز') ||
    desc.includes('رص سيفتي')
  ) {
    return 'مفتوح';
  }

  // 3. الجاري: حفر تمديد دفان
  return 'جاري';
}

export interface StatusCategoryMeta {
  name: WorkStatusCategory;
  title: string;
  subTitle: string;
  scopeDescription: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const STATUS_CATEGORIES: Record<WorkStatusCategory, StatusCategoryMeta> = {
  مفتوح: {
    name: 'مفتوح',
    title: 'مفتوح',
    subTitle: 'رص سيفتي',
    scopeDescription: 'قطاعات رص سيفتي وحواجز السلامة بانتظار بدء الحفر',
    color: '#0284c7', // Sky-600
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-300',
    textColor: 'text-sky-700',
  },
  جاري: {
    name: 'جاري',
    title: 'جاري',
    subTitle: 'حفر / تمديد / دفان',
    scopeDescription: 'أعمال إنشائية نشطة (حفر، تمديد أنابيب، دفان، صب)',
    color: '#f59e0b', // Amber-500
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-700',
  },
  منجز: {
    name: 'منجز',
    title: 'منجز',
    subTitle: 'أسفلت',
    scopeDescription: 'أعمال طبقات الأسفلت المنفذة (ط1 / ط2)',
    color: '#10b981', // Emerald-500
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-700',
  },
};
