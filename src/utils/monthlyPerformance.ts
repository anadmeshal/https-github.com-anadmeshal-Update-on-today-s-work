import { WorkItem, ProjectMetadata } from '../types';
import { classifyWorkStatus } from './statusClassifier';

export interface MonthlyPerformanceRecord {
  monthKey: string;             // e.g. "2026-06"
  year: number;                 // 2026
  monthIndex: number;           // 5 (June = 5, 0-indexed)
  monthName: string;            // "يونيو"
  label: string;                // "يونيو 2026"
  isCurrentMonth: boolean;      // true for the active reporting month (e.g. Sep 2026)
  
  // Metrics for this specific month
  openedCount: number;          // عدد القطاعات المفتوحة خلال هذا الشهر
  completedCount: number;       // عدد القطاعات المنجزة (أسفلت) من هذا الشهر
  inProgressCount: number;      // عدد القطاعات قيد العمل (حفر/تمديد/دفان)
  totalLengthMeters: number;    // إجمالي أطوال القطاعات بالمتر
  completedLengthMeters: number;// أطوال القطاعات المنجزة بالمتر
  
  // Rates
  completionRate: number;       // نسبة الإنجاز في هذا الشهر %
  
  // Cumulative progression up to the end of this month
  cumulativeOpened: number;
  cumulativeCompleted: number;
  cumulativeRate: number;
  
  // Comparison vs previous month
  prevMonthName?: string;
  diffCompletionRate: number;   // فارق نسبة الإنجاز (مثال: +5% أو -10%)
  diffCompletedCount: number;   // فارق عدد القطاعات المنجزة
  diffOpenedCount: number;      // فارق عدد القطاعات المفتوحة
  statusTrend: 'improved' | 'lagging' | 'stable'; // حالة الأداء
  statusText: string;           // وصف حالة الأداء (تحسن / تأخر)
  explanation: string;          // شرح تفصيلي لسبب التحسن أو التأخر
}

export interface MonthlyComparisonSummary {
  currentMonth: MonthlyPerformanceRecord | null;
  previousMonth: MonthlyPerformanceRecord | null;
  records: MonthlyPerformanceRecord[];
  overallTrend: 'improved' | 'lagging' | 'stable';
  headline: string;
  recommendation: string;
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * دالة استخراج ومقارنة إنجاز الأشهر التاريخية للمشروع
 * تقارن الشهر الحالي بالأشهر السابقة لبيان مدى التحسن أو التأخر في نسب الإنجاز
 */
export function computeMonthlyPerformance(
  items: WorkItem[],
  metadata: ProjectMetadata
): MonthlyComparisonSummary {
  if (!items || items.length === 0) {
    return {
      currentMonth: null,
      previousMonth: null,
      records: [],
      overallTrend: 'stable',
      headline: 'لا توجد بيانات متاحة للمقارنة',
      recommendation: '',
    };
  }

  // Determine current report date
  const reportDateStr = metadata.date || '2026-09-07';
  const reportDate = new Date(reportDateStr);
  const validReportTime = !isNaN(reportDate.getTime())
    ? reportDate.getTime()
    : new Date('2026-09-07').getTime();

  const currentMonthKey = new Date(validReportTime).toISOString().slice(0, 7);

  // Group items by open month
  const monthMap: Record<
    string,
    {
      opened: WorkItem[];
      completed: WorkItem[];
    }
  > = {};

  items.forEach((item) => {
    let openTime = 0;
    if (item.digPermitDate) {
      const d = new Date(item.digPermitDate);
      if (!isNaN(d.getTime())) openTime = d.getTime();
    }

    if (!openTime && typeof item.openDays === 'number' && item.openDays > 0) {
      openTime = validReportTime - item.openDays * 24 * 3600 * 1000;
    }

    if (!openTime) {
      openTime = validReportTime - 30 * 24 * 3600 * 1000;
    }

    const mKey = new Date(openTime).toISOString().slice(0, 7);
    if (!monthMap[mKey]) {
      monthMap[mKey] = { opened: [], completed: [] };
    }

    monthMap[mKey].opened.push(item);
    if (classifyWorkStatus(item) === 'منجز') {
      monthMap[mKey].completed.push(item);
    }
  });

  // Ensure current month key exists even if newly started
  if (!monthMap[currentMonthKey]) {
    monthMap[currentMonthKey] = { opened: [], completed: [] };
  }

  const sortedMonthKeys = Object.keys(monthMap).sort();

  let cumOpened = 0;
  let cumCompleted = 0;

  const records: MonthlyPerformanceRecord[] = sortedMonthKeys.map((mKey, idx) => {
    const [yearStr, monthNumStr] = mKey.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthNumStr, 10) - 1;
    const monthName = ARABIC_MONTHS[monthIndex] || mKey;
    const label = `${monthName} ${year}`;
    const isCurrent = mKey === currentMonthKey;

    const data = monthMap[mKey];
    const openedCount = data.opened.length;
    const completedCount = data.completed.length;
    const inProgressCount = Math.max(0, openedCount - completedCount);

    const totalLengthMeters = Math.round(
      data.opened.reduce((acc, curr) => acc + (curr.lengthMeters || 0), 0) * 10
    ) / 10;

    const completedLengthMeters = Math.round(
      data.completed.reduce((acc, curr) => acc + (curr.lengthMeters || 0), 0) * 10
    ) / 10;

    const completionRate = openedCount > 0 ? Math.round((completedCount / openedCount) * 100) : 0;

    cumOpened += openedCount;
    cumCompleted += completedCount;
    const cumulativeRate = cumOpened > 0 ? Math.round((cumCompleted / cumOpened) * 100) : 0;

    // Compare with previous month record
    let diffCompletionRate = 0;
    let diffCompletedCount = 0;
    let diffOpenedCount = 0;
    let prevMonthName: string | undefined = undefined;
    let statusTrend: 'improved' | 'lagging' | 'stable' = 'stable';
    let statusText = 'مستقر';
    let explanation = '';

    if (idx > 0) {
      const prevKey = sortedMonthKeys[idx - 1];
      const prevData = monthMap[prevKey];
      const prevOpened = prevData.opened.length;
      const prevCompleted = prevData.completed.length;
      const prevRate = prevOpened > 0 ? Math.round((prevCompleted / prevOpened) * 100) : 0;

      const prevMonthIdx = parseInt(prevKey.split('-')[1], 10) - 1;
      prevMonthName = `${ARABIC_MONTHS[prevMonthIdx] || prevKey}`;

      diffCompletionRate = completionRate - prevRate;
      diffCompletedCount = completedCount - prevCompleted;
      diffOpenedCount = openedCount - prevOpened;

      if (diffCompletedCount > 0 || diffCompletionRate >= 5) {
        statusTrend = 'improved';
        statusText = 'تحسن ملحوظ';
        explanation = `ارتفاع عدد القطاعات المنجزة بمقدار +${diffCompletedCount} قطاع وزيادة وتيرة الإسفلت مقارنة بشهر ${prevMonthName}.`;
      } else if (diffCompletedCount < 0 || diffCompletionRate <= -5) {
        statusTrend = 'lagging';
        statusText = 'تأخر نسبي';
        explanation = `انخفاض وتيرة إتمام طبقة الأسفلت للقطاعات المفتوحة بمقدار ${Math.abs(diffCompletionRate)}% مقارنة بشهر ${prevMonthName}.`;
      } else {
        statusTrend = 'stable';
        statusText = 'أداء متقارب';
        explanation = `تقارب وتيرة الإنجاز والأعمال الميدانية مع معدلات شهر ${prevMonthName}.`;
      }
    } else {
      statusText = 'بداية التسجيل';
      explanation = 'الشهر المرجعي الأول لانطلاق أعمال المشروع.';
    }

    // Special contextual explanation for active current month (e.g. early September)
    if (isCurrent && openedCount > 0 && completedCount === 0) {
      statusTrend = 'lagging';
      statusText = 'تأخر مرحلي (قيد التنفيذ)';
      explanation = `قطاعات شهر ${monthName} الحالية (${openedCount} قطاعات) لا تزال في مراحل الحفر والتمديد والدفان ولم تصل بعد للأسفلت، مما يستدعي سرعة تسليم الأعمال وإعادة الرصف.`;
    }

    return {
      monthKey: mKey,
      year,
      monthIndex,
      monthName,
      label,
      isCurrentMonth: isCurrent,
      openedCount,
      completedCount,
      inProgressCount,
      totalLengthMeters,
      completedLengthMeters,
      completionRate,
      cumulativeOpened: cumOpened,
      cumulativeCompleted: cumCompleted,
      cumulativeRate,
      prevMonthName,
      diffCompletionRate,
      diffCompletedCount,
      diffOpenedCount,
      statusTrend,
      statusText,
      explanation,
    };
  });

  const currentMonth = records.find((r) => r.isCurrentMonth) || records[records.length - 1] || null;
  const currIdx = currentMonth ? records.indexOf(currentMonth) : -1;
  const previousMonth = currIdx > 0 ? records[currIdx - 1] : null;

  let overallTrend: 'improved' | 'lagging' | 'stable' = 'stable';
  let headline = '';
  let recommendation = '';

  if (currentMonth && previousMonth) {
    overallTrend = currentMonth.statusTrend;

    if (currentMonth.statusTrend === 'improved') {
      headline = `تحسن إيجابي في وتيرة إنجاز شهر ${currentMonth.monthName} (+${currentMonth.diffCompletedCount} قطاع منجز)`;
      recommendation = `يُنصح بالمحافظة على جاهزية فرق الأسفلت لتعزيز هذا التسارع في بقية القطاعات المفتوحة.`;
    } else if (currentMonth.statusTrend === 'lagging') {
      headline = `تأخر نسبي في إغلاق قطاعات شهر ${currentMonth.monthName} الحالي مقارنة بشهر ${previousMonth.monthName}`;
      recommendation = `يوصى بتسريع استلام طبقات الدفان واختبارات الضغط وصب الخرسانات لإتاحة فرد طبقات الأسفلت وإغلاق القطاعات المتراكمة.`;
    } else {
      headline = `استقرار وتيرة إنجاز شهر ${currentMonth.monthName} ومقاربتها لمعدل شهر ${previousMonth.monthName}`;
      recommendation = `الاستمرار بمتابعة إنتاجية فرق التمديد والردم وفق الجدول الزمني المعتمد.`;
    }
  } else if (currentMonth) {
    headline = `متابعة إنجاز شهر ${currentMonth.monthName} (${currentMonth.completedCount} منجز من ${currentMonth.openedCount} قطاع)`;
    recommendation = `مواصلة تتبع وتيرة الأعمال للأشهر القادمة لقياس مؤشرات التحسن والتأخر بدقة.`;
  }

  return {
    currentMonth,
    previousMonth,
    records,
    overallTrend,
    headline,
    recommendation,
  };
}
