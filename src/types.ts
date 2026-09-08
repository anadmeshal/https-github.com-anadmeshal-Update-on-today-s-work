export interface WorkItem {
  id: string;
  serialNumber: number | string;
  sector: string;             // القطاع (مثل: MH8 MH7 أو قطاع 1)
  lineNo?: string;            // رقم الخط (مثل: D-14، C، خط طرد PS-3)
  workDescription: string;    // وصف الأعمال الحالية (مثل: أسفلت طبقة ثاني، جاري دفان، جاري حفر)
  location: string;           // الموقع (المربع، الحي، المعلم)
  streetName: string;         // اسم الشارع (مثل: علي بن شيبان 1)
  duration: string;           // مدة التنفيذ أو الفتح (مثل: 49 يوم)
  openDays?: number;          // مدة فتح القطاع بالأيام
  startDate?: string;         // تاريخ البدء
  endDate?: string;           // تاريخ الانتهاء
  remainingDays?: number;     // الأيام المتبقية
  permit: string;             // رقم الفسح أو التصريح
  permitIssueDate?: string;   // تاريخ إصدار الفسح
  digPermitNo?: string;       // رقم إذن الحفر (مثل: PTW-467، 812)
  digPermitDate?: string;     // تاريخ إذن الحفر
  todayDate?: string;         // تاريخ اليوم
  permitStatus?: 'valid' | 'renewing' | 'pending' | 'expired'; // حالة الفسح
  permitExpiry?: string;      // تاريخ انتهاء الفسح
  lengthMeters?: number;      // إجمالي طول القطاع (م.ط)
  excavatedMeters?: number;   // الطول المنفذ / المحفور (م.ط)
  progressPercent?: number;   // نسبة الإنجاز %
  pipeDiameter?: string;      // قطر ونوع الأنبوب (مثلاً: 300 ملم VCP)
  depthMeters?: string;       // عمق الحفر (م)
  engineerInCharge?: string;  // مهندس الموقع المشرف
  notes?: string;             // ملاحظات
  status?: string;            // حالة العمل
  source: 'api' | 'excel' | 'manual';
  sheetOrigin?: string;
  raw?: Record<string, any>;
}

export interface ProjectMetadata {
  projectName: string;
  contractor: string;
  date: string;
  totalOpenLengthNotice?: string;
  totalOpenLength?: number;
  totalCount: number;
  openSectorsCount: number;
  totalLengthMeters?: number;
  totalCompletedLengthMeters?: number;
}

export interface ApiResponseData {
  success: boolean;
  data?: Record<string, any[]>;
  error?: string;
}

export interface TableFilterState {
  search: string;
  sector: string;
  streetName: string;
  hasPermit: 'all' | 'with_permit' | 'without_permit';
  status: string;
  workType?: string;
}
