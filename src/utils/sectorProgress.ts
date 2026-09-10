import { WorkItem } from '../types';
import { classifyWorkStatus, WorkStatusCategory } from './statusClassifier';

export interface SectorStageInfo {
  stageOrder: number;      // 1 to 9
  stageName: string;       // e.g. "أسفلت طبقة ثانية (ط2)"
  shortName: string;       // e.g. "أسفلت ط2"
  progressPercent: number; // 10% to 100%
  color: string;
}

export const WORK_STAGES: SectorStageInfo[] = [
  { stageOrder: 1, stageName: 'رص حواجز ووسائل السلامة (سيفتي)', shortName: 'رص سيفتي', progressPercent: 10, color: '#0284c7' },
  { stageOrder: 2, stageName: 'أعمال الحفر وتثبيت الجوانب', shortName: 'حفر', progressPercent: 25, color: '#f59e0b' },
  { stageOrder: 3, stageName: 'حفر استلام وتمديد جزئي', shortName: 'حفر واستلام', progressPercent: 40, color: '#d97706' },
  { stageOrder: 4, stageName: 'تمديد أنابيب الصرف الصحي', shortName: 'تمديد', progressPercent: 50, color: '#b45309' },
  { stageOrder: 5, stageName: 'استلام أعلى طبقة البحص (Sub-base)', shortName: 'استلام بحص', progressPercent: 60, color: '#6366f1' },
  { stageOrder: 6, stageName: 'أعمال الدفان والتسوية والدك', shortName: 'دفان ودك', progressPercent: 70, color: '#8b5cf6' },
  { stageOrder: 7, stageName: 'رش طبقة التشريب الأسفلتي (MC-1)', shortName: 'MC-1', progressPercent: 80, color: '#a855f7' },
  { stageOrder: 8, stageName: 'أسفلت طبقة أولى رابطة (ط1)', shortName: 'أسفلت ط1', progressPercent: 90, color: '#059669' },
  { stageOrder: 9, stageName: 'أسفلت طبقة ثانية سطحية (ط2 - منجز)', shortName: 'أسفلت ط2', progressPercent: 100, color: '#10b981' },
];

/**
 * تحديد مرحلة العمل ونسبة الإنجاز الميداني لكل بند أو وصف عمل
 */
export function getWorkStage(workDescription: string): SectorStageInfo {
  const desc = (workDescription || '').toLowerCase().trim();

  if (
    desc.includes('ط2') ||
    desc.includes('طبقة ثاني') ||
    desc.includes('طبقة ثانية') ||
    desc.includes('طبقة ثانيه') ||
    desc.includes('منجز نهائي')
  ) {
    return WORK_STAGES[8]; // 100%
  }

  if (
    desc.includes('ط1') ||
    desc.includes('طبقة أولى') ||
    desc.includes('طبقة اولي') ||
    desc.includes('طبقة اولى')
  ) {
    return WORK_STAGES[7]; // 90%
  }

  if (desc.includes('mc-1') || desc.includes('تشريب')) {
    return WORK_STAGES[6]; // 80%
  }

  if (desc.includes('دفان') || desc.includes('دك') || desc.includes('ردم')) {
    return WORK_STAGES[5]; // 70%
  }

  if (desc.includes('بحص') || desc.includes('استلام أعلى')) {
    return WORK_STAGES[4]; // 60%
  }

  if (desc.includes('تمديد') && !desc.includes('جزوي')) {
    return WORK_STAGES[3]; // 50%
  }

  if (desc.includes('استلام') || desc.includes('جزوي') || desc.includes('جزئي')) {
    return WORK_STAGES[2]; // 40%
  }

  if (desc.includes('حفر')) {
    return WORK_STAGES[1]; // 25%
  }

  if (desc.includes('سيفتي') || desc.includes('سلامة') || desc.includes('سلامه') || desc.includes('حواجز')) {
    return WORK_STAGES[0]; // 10%
  }

  return {
    stageOrder: 1,
    stageName: workDescription || 'أعمال تمهيدية',
    shortName: 'تمهيدي',
    progressPercent: 15,
    color: '#0284c7',
  };
}

export interface SectorProfile {
  id: string;
  sectorName: string;            // مثل: "MH8 MH7"
  displayName: string;           // مثل: "MH8 MH7 (علي بن شيبان 1 - 100 م)"
  streetName: string;            // اسم الشارع
  lineNo: string;                // رقم الخط
  totalLengthMeters: number;     // الطول الكلي بالمتر
  openDays: number;              // مدة الفتح بالأيام
  progressPercent: number;       // نسبة الإنجاز %
  stage: SectorStageInfo;        // المرحلة الإنشائية
  statusCategory: WorkStatusCategory; // مفتوح | جاري | منجز
  categoryLabel: string;         // مسمى الفئة
  workDescription: string;       // وصف العمل
  permitNo?: string;             // رقم الفسح
  digPermitNo?: string;          // رقم إذن الحفر
  digPermitDate?: string;        // تاريخ إذن الحفر
  dailyRateMetersPerDay: number; // معدل الإنجاز اليومي (م/يوم)
  subItemsCount: number;         // عدد الخطوط أو المسارات التابعة
  rawItems: WorkItem[];
}

export interface SectorComparisonAnalysis {
  sectorA: SectorProfile;
  sectorB: SectorProfile;
  progressDiff: number;           // فرق نسبة الإنجاز (Sector A - Sector B)
  lengthDiff: number;             // فرق الطول بالمتر
  daysDiff: number;               // فرق مدة الفتح بالأيام
  fasterSector: 'A' | 'B' | 'equal';
  moreAdvancedSector: 'A' | 'B' | 'equal';
  efficiencyRateA: number;        // نسبة التقدم بالنسبة للأيام
  efficiencyRateB: number;
  summaryHeadline: string;
  keyInsights: string[];
  recommendation: string;
}

/**
 * تجميع وتشكيل الملفات الفنية لكل قطاع في المشروع لتغذية قوائم الاختيار والتحليل
 */
export function buildSectorProfiles(items: WorkItem[]): SectorProfile[] {
  if (!items || items.length === 0) return [];

  const map: Record<string, WorkItem[]> = {};

  items.forEach((item) => {
    const sName = (item.sector || 'قطاع عام').trim();
    if (!map[sName]) map[sName] = [];
    map[sName].push(item);
  });

  const profiles: SectorProfile[] = Object.entries(map).map(([sName, sItems], idx) => {
    const totalLength = Math.round(
      sItems.reduce((acc, it) => acc + (it.lengthMeters || 0), 0) * 10
    ) / 10;

    const maxDays = Math.max(...sItems.map((it) => it.openDays || 0));
    const firstItem = sItems[0];
    const streets = Array.from(new Set(sItems.map((it) => it.streetName).filter(Boolean))).join(' / ');
    const lines = Array.from(new Set(sItems.map((it) => it.lineNo).filter(Boolean))).join(' / ');

    // Calculate individual stages & choose highest achieved
    const stages = sItems.map((it) => getWorkStage(it.workDescription));
    stages.sort((a, b) => b.stageOrder - a.stageOrder);
    const highestStage = stages[0] || WORK_STAGES[0];

    // If explicit progressPercent exists, use average; otherwise use highestStage
    const hasExplicit = sItems.some((it) => typeof it.progressPercent === 'number' && it.progressPercent > 0);
    const avgProgress = hasExplicit
      ? Math.round(sItems.reduce((acc, it) => acc + (it.progressPercent || highestStage.progressPercent), 0) / sItems.length)
      : highestStage.progressPercent;

    const rawStatus = String(firstItem.status || '').trim();
    const isClosed = rawStatus.includes('مغلق') || rawStatus.includes('مكتمل') || avgProgress === 100;
    const statusCategory: WorkStatusCategory = isClosed ? 'منجز' : 'مفتوح';
    const categoryLabel = isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه';

    const dailyRate = maxDays > 0 ? Math.round((totalLength / maxDays) * 10) / 10 : totalLength;

    const streetLabel = streets || firstItem.location || 'حي العوالي 2';
    const lengthLabel = totalLength > 0 ? `${totalLength} م` : '';
    const displayName = `${sName} ${streetLabel ? `• ${streetLabel}` : ''} ${lengthLabel ? `(${lengthLabel})` : ''}`.trim();

    return {
      id: `sec-prof-${idx}`,
      sectorName: sName,
      displayName,
      streetName: streetLabel,
      lineNo: lines,
      totalLengthMeters: totalLength,
      openDays: Math.round(maxDays),
      progressPercent: avgProgress,
      stage: highestStage,
      statusCategory,
      categoryLabel,
      workDescription: sItems.map((it) => it.workDescription).filter(Boolean).join(' | ') || highestStage.stageName,
      permitNo: firstItem.permit,
      digPermitNo: firstItem.digPermitNo,
      digPermitDate: firstItem.digPermitDate,
      dailyRateMetersPerDay: dailyRate,
      subItemsCount: sItems.length,
      rawItems: sItems,
    };
  });

  // Sort by sector name natural order
  profiles.sort((a, b) => a.sectorName.localeCompare(b.sectorName, 'ar', { numeric: true }));

  return profiles;
}

/**
 * إجراء مقارنة تحليلية عميقة بين قطاعين تم اختيارهما
 */
export function analyzeSectorsComparison(
  sectorA: SectorProfile,
  sectorB: SectorProfile
): SectorComparisonAnalysis {
  const progressDiff = sectorA.progressPercent - sectorB.progressPercent;
  const lengthDiff = Math.round((sectorA.totalLengthMeters - sectorB.totalLengthMeters) * 10) / 10;
  const daysDiff = sectorA.openDays - sectorB.openDays;

  const moreAdvancedSector: 'A' | 'B' | 'equal' =
    progressDiff > 0 ? 'A' : progressDiff < 0 ? 'B' : 'equal';

  // Efficiency: progress percent per day open
  const efficiencyRateA = sectorA.openDays > 0 ? Math.round((sectorA.progressPercent / sectorA.openDays) * 100) / 100 : sectorA.progressPercent;
  const efficiencyRateB = sectorB.openDays > 0 ? Math.round((sectorB.progressPercent / sectorB.openDays) * 100) / 100 : sectorB.progressPercent;

  const fasterSector: 'A' | 'B' | 'equal' =
    efficiencyRateA > efficiencyRateB ? 'A' : efficiencyRateA < efficiencyRateB ? 'B' : 'equal';

  let summaryHeadline = '';
  if (moreAdvancedSector === 'A') {
    summaryHeadline = `القطاع (${sectorA.sectorName}) متقدم في نسبة الإنجاز بفارق +${progressDiff}% عن القطاع (${sectorB.sectorName})`;
  } else if (moreAdvancedSector === 'B') {
    summaryHeadline = `القطاع (${sectorB.sectorName}) متقدم في نسبة الإنجاز بفارق +${Math.abs(progressDiff)}% عن القطاع (${sectorA.sectorName})`;
  } else {
    summaryHeadline = `كلا القطاعين متطابقان في نسبة الإنجاز (${sectorA.progressPercent}%) مع اختلاف في الأطوال ومدة الفتح`;
  }

  const keyInsights: string[] = [];

  // Insight 1: Stage comparison
  if (sectorA.stage.stageOrder !== sectorB.stage.stageOrder) {
    const leading = sectorA.stage.stageOrder > sectorB.stage.stageOrder ? sectorA : sectorB;
    const trailing = sectorA.stage.stageOrder > sectorB.stage.stageOrder ? sectorB : sectorA;
    keyInsights.push(
      `القطاع (${leading.sectorName}) وصل إلى مرحلة "${leading.stage.shortName}" بينما القطاع (${trailing.sectorName}) لا يزال في مرحلة "${trailing.stage.shortName}".`
    );
  } else {
    keyInsights.push(
      `كلا القطاعين يمران حالياً بنفس المرحلة الميدانية: "${sectorA.stage.shortName}".`
    );
  }

  // Insight 2: Length comparison
  if (lengthDiff !== 0) {
    const longer = lengthDiff > 0 ? sectorA : sectorB;
    const shorter = lengthDiff > 0 ? sectorB : sectorA;
    keyInsights.push(
      `القطاع (${longer.sectorName}) أطول بمقدار ${Math.abs(lengthDiff)} م.ط (${longer.totalLengthMeters} م مقابل ${shorter.totalLengthMeters} م).`
    );
  } else {
    keyInsights.push(`القطاعان متساويان تماماً في الطول الإجمالي (${sectorA.totalLengthMeters} م).`);
  }

  // Insight 3: Open duration vs completion rate
  if (daysDiff !== 0) {
    const older = daysDiff > 0 ? sectorA : sectorB;
    const newer = daysDiff > 0 ? sectorB : sectorA;
    keyInsights.push(
      `القطاع (${older.sectorName}) مفتوح منذ ${older.openDays} يوماً (أقدم بفارق ${Math.abs(daysDiff)} يوم عن ${newer.sectorName}).`
    );
  }

  let recommendation = '';
  if (moreAdvancedSector === 'A' && sectorB.progressPercent < 80) {
    recommendation = `يُوصى بتوجيه فرق العمل لتسريع استلام واختبارات قطاع (${sectorB.sectorName}) للانتقال من مرحلة ${sectorB.stage.shortName} إلى فرد طبقة الأسفلت وإغلاقه.`;
  } else if (moreAdvancedSector === 'B' && sectorA.progressPercent < 80) {
    recommendation = `يُوصى بتركيز فرق التنفيذ على قطاع (${sectorA.sectorName}) لرفع وتيرة الدفان واختبارات الضغط لمواكبة تقدم قطاع (${sectorB.sectorName}).`;
  } else if (sectorA.progressPercent === 100 && sectorB.progressPercent === 100) {
    recommendation = `كلا القطاعين منجزان بالكامل بطبقة الأسفلت السطحية، والخطوات القادمة تشمل استكمال محاضر الاستلام النهائي وإغلاق التصاريح.`;
  } else {
    recommendation = `استمرار المتابعة اليومية لإنتاجية فرق التمديد والردم في كلا القطاعين وفق الجدول الزمني المحدد.`;
  }

  return {
    sectorA,
    sectorB,
    progressDiff,
    lengthDiff,
    daysDiff,
    fasterSector,
    moreAdvancedSector,
    efficiencyRateA,
    efficiencyRateB,
    summaryHeadline,
    keyInsights,
    recommendation,
  };
}
