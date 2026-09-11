import { WorkItem } from '../types';

export type WorkStageCategory = 
  | 'رص سيفتي'
  | 'حفر'
  | 'تمديد'
  | 'بحص اعلى ودفان'
  | 'mc1 و rc2 واسفلت';

// Alias for backwards compatibility
export type WorkStatusCategory = WorkStageCategory;

/**
 * دالة تصنيف مراحل العمل الخمس المعتمدة للمشروع:
 * 1. رص سيفتي (حواجز السلامة وتجهيز الموقع)
 * 2. حفر (أعمال الحفريات الميدانية)
 * 3. تمديد (أعمال تركيب وتمديد خطوط الأنابيب والمواسير)
 * 4. بحص اعلى ودفان (أعمال البحص أعلى الماسورة والدفان والردم)
 * 5. mc1 و rc2 واسفلت (طبقات التشريب واللصق والأسفلت وإعادة الوضع)
 */
export function classifyWorkStatus(item: Partial<WorkItem> | string): WorkStageCategory {
  const desc = typeof item === 'string' 
    ? item.toLowerCase().trim()
    : ((item.workDescription || '') + ' ' + (item.status || '')).toLowerCase().trim();

  // 5. mc1 و rc2 واسفلت
  if (
    desc.includes('أسفلت') ||
    desc.includes('اسفلت') ||
    desc.includes('سفلت') ||
    desc.includes('ط1') ||
    desc.includes('ط2') ||
    desc.includes('طبقة أولى') ||
    desc.includes('طبقة أولى') ||
    desc.includes('طبقة اولي') ||
    desc.includes('طبقة ثانية') ||
    desc.includes('طبقة ثانيه') ||
    desc.includes('mc1') ||
    desc.includes('mc-1') ||
    desc.includes('mc 1') ||
    desc.includes('rc2') ||
    desc.includes('rc-2') ||
    desc.includes('rc 2') ||
    desc.includes('rc-') ||
    desc.includes('كشط') ||
    desc.includes('إعادة الوضع') ||
    desc.includes('اعادة الوضع') ||
    desc.includes('رش') ||
    desc.includes('بيتومين')
  ) {
    return 'mc1 و rc2 واسفلت';
  }

  // 4. بحص اعلى ودفان
  if (
    desc.includes('بحص') ||
    desc.includes('دفان') ||
    desc.includes('ردم') ||
    desc.includes('اعلى الماسورة') ||
    desc.includes('أعلى الماسورة') ||
    desc.includes('اعلي الماسوره') ||
    desc.includes('أعلى الماسوره') ||
    desc.includes('خرسانة') ||
    desc.includes('خرسانه') ||
    desc.includes('صب') ||
    desc.includes('استلام دفان') ||
    desc.includes('رص دفان') ||
    desc.includes('دمك')
  ) {
    return 'بحص اعلى ودفان';
  }

  // 3. تمديد
  if (
    desc.includes('تمديد') ||
    desc.includes('مواسير') ||
    desc.includes('ماسورة') ||
    desc.includes('ماسوره') ||
    desc.includes('انابيب') ||
    desc.includes('أنابيب') ||
    desc.includes('تركيب') ||
    desc.includes('لحام')
  ) {
    return 'تمديد';
  }

  // 2. حفر
  if (
    desc.includes('حفر') ||
    desc.includes('الحفر') ||
    desc.includes('حفريات') ||
    desc.includes('جاري حفر') ||
    desc.includes('أعمال حفر') ||
    desc.includes('اعمال حفر') ||
    desc.includes('بدء حفر')
  ) {
    return 'حفر';
  }

  // 1. رص سيفتي
  if (
    desc.includes('سيفتي') ||
    desc.includes('سلامة') ||
    desc.includes('سلامه') ||
    desc.includes('حواجز') ||
    desc.includes('رص') ||
    desc.includes('تجهيز') ||
    desc.includes('لوحات')
  ) {
    return 'رص سيفتي';
  }

  // الافتراضي في حال عدم وجود تفصيل دقيق
  return 'رص سيفتي';
}

export interface StageCategoryMeta {
  key: WorkStageCategory;
  stageNumber: number;
  title: string;
  shortName: string;
  subTitle: string;
  scopeDescription: string;
  color: string;
  bgColorLight: string;
  borderColorLight: string;
  textColorLight: string;
  bgColorDark: string;
  borderColorDark: string;
  textColorDark: string;
}

export const STAGE_CATEGORIES: Record<WorkStageCategory, StageCategoryMeta> = {
  'رص سيفتي': {
    key: 'رص سيفتي',
    stageNumber: 1,
    title: '1- رص سيفتي',
    shortName: 'رص سيفتي',
    subTitle: 'حواجز وأعمال السلامة ورص وتجهيز الموقع',
    scopeDescription: 'تجهيز مسار العمل، تركيب حواجز السلامة المرورية وأعمال الرص والتأمين',
    color: '#0284c7', // Sky-600
    bgColorLight: 'bg-sky-50',
    borderColorLight: 'border-sky-300',
    textColorLight: 'text-sky-800',
    bgColorDark: 'bg-sky-950/80',
    borderColorDark: 'border-sky-800',
    textColorDark: 'text-sky-300',
  },
  'حفر': {
    key: 'حفر',
    stageNumber: 2,
    title: '2- حفر',
    shortName: 'حفر',
    subTitle: 'أعمال حفر مسار الخط والمناهل',
    scopeDescription: 'حفر الخندق بالعمق المطلوب، سند جوانب الحفر وتجهيز قاع الخط',
    color: '#f59e0b', // Amber-500
    bgColorLight: 'bg-amber-50',
    borderColorLight: 'border-amber-300',
    textColorLight: 'text-amber-900',
    bgColorDark: 'bg-amber-950/80',
    borderColorDark: 'border-amber-800',
    textColorDark: 'text-amber-300',
  },
  'تمديد': {
    key: 'تمديد',
    stageNumber: 3,
    title: '3- تمديد',
    shortName: 'تمديد',
    subTitle: 'تمديد وتركيب شبكات الأنابيب والمواسير',
    scopeDescription: 'فرش طبقة التأسيس، تنزيل المواسير، وزن الميول وضبط استقامة الخط',
    color: '#8b5cf6', // Purple-500
    bgColorLight: 'bg-purple-50',
    borderColorLight: 'border-purple-300',
    textColorLight: 'text-purple-900',
    bgColorDark: 'bg-purple-950/80',
    borderColorDark: 'border-purple-800',
    textColorDark: 'text-purple-300',
  },
  'بحص اعلى ودفان': {
    key: 'بحص اعلى ودفان',
    stageNumber: 4,
    title: '4- بحص اعلى ودفان',
    shortName: 'بحص اعلى ودفان',
    subTitle: 'أعمال البحص أعلى الماسورة والدفان والدمك',
    scopeDescription: 'وضع البحص المحيط وأعلى الماسورة، الدفان على طبقات، الغمر والدمك الميكانيكي',
    color: '#0d9488', // Teal-600
    bgColorLight: 'bg-teal-50',
    borderColorLight: 'border-teal-300',
    textColorLight: 'text-teal-900',
    bgColorDark: 'bg-teal-950/80',
    borderColorDark: 'border-teal-800',
    textColorDark: 'text-teal-300',
  },
  'mc1 و rc2 واسفلت': {
    key: 'mc1 و rc2 واسفلت',
    stageNumber: 5,
    title: '5- mc1 و rc2 واسفلت',
    shortName: 'mc1 و rc2 واسفلت',
    subTitle: 'رش MC1 / RC2 وطبقات الأسفلت وإعادة الوضع',
    scopeDescription: 'رش طبقة التشريب MC1، طبقة اللصق RC2، فرش الأسفلت (ط1 / ط2) وإنهاء الموقع',
    color: '#10b981', // Emerald-600
    bgColorLight: 'bg-emerald-50',
    borderColorLight: 'border-emerald-300',
    textColorLight: 'text-emerald-900',
    bgColorDark: 'bg-emerald-950/80',
    borderColorDark: 'border-emerald-800',
    textColorDark: 'text-emerald-300',
  },
};

// For backward compatibility
export const STATUS_CATEGORIES = STAGE_CATEGORIES;

export const ORDERED_STAGES: WorkStageCategory[] = [
  'رص سيفتي',
  'حفر',
  'تمديد',
  'بحص اعلى ودفان',
  'mc1 و rc2 واسفلت',
];

