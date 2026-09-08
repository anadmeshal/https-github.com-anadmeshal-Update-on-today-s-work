import { WorkItem, ProjectMetadata } from '../types';
import * as XLSX from 'xlsx';

export const API_URL = 'https://script.google.com/macros/s/AKfycbzo7YHLn8vxcOByh7486mDKNI5U4ZROKFrKEHeOnI_CSvVocoXGfWcoSNe_r9xyOTIs/exec';

export interface FetchResult {
  metadata: ProjectMetadata;
  items: WorkItem[];
  sheets: string[];
  rawEndpointData?: any;
  hasDetailedColumns: boolean;
}

function formatDateStr(val: any): string {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // fallback
  }
  return String(val).trim();
}

export async function fetchLiveSheetData(customUrl?: string): Promise<FetchResult> {
  const targetUrl = customUrl || API_URL;
  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`فشل الاتصال بقاعدة البيانات: كود الخطأ ${response.status}`);
  }

  const json = await response.json();
  if (!json || !json.data) {
    throw new Error('استجابة غير صحيحة من الرابط');
  }

  const sheets = Object.keys(json.data);
  const dataSheet = json.data['DATA SHEET'] || [];
  const openSectorsSheet = json.data['قطاعات مفتوحة'] || [];

  // 1. Extract real project metadata from DATA SHEET
  let projectName = 'عقد تنفيذ شبكات صرف صحي العوالى 2';
  let contractor = 'مقاولة / شركة نظم  البيئة للمقاولات';
  let date = '2026-09-07';
  let totalOpenLengthNotice = 'إجمالي الأطوال المفتوحة';

  if (Array.isArray(dataSheet) && dataSheet.length > 0) {
    const firstVal = Object.values(dataSheet[0] || {})[0];
    const secondVal = Object.values(dataSheet[1] || {})[0];
    const thirdVal = Object.values(dataSheet[2] || {})[0];

    if (typeof firstVal === 'string' && firstVal.trim()) projectName = firstVal.trim();
    if (typeof secondVal === 'string' && secondVal.trim()) contractor = secondVal.trim();
    if (typeof thirdVal === 'string' && thirdVal.trim()) {
      date = formatDateStr(thirdVal);
    }
  }

  const items: WorkItem[] = [];
  let hasDetailedColumns = false;
  let calculatedTotalOpenLength = 0;

  // 2. Check if 'قطاعات مفتوحة' has rich detailed rows (إسم الشارع, رقم الخط, القطاع, وصف العمل الحالى, طول القطاع...)
  const validOpenRows = Array.isArray(openSectorsSheet) 
    ? openSectorsSheet.filter(r => r && typeof r === 'object' && (r['القطاع'] || r['إسم الشارع'] || r['رقم الخط']))
    : [];

  if (validOpenRows.length > 0) {
    hasDetailedColumns = true;
    validOpenRows.forEach((r, idx) => {
      const serialNum = idx + 1;
      const sectorRaw = String(r['القطاع'] || '').trim();
      const streetName = String(r['إسم الشارع'] || '').trim();
      const lineNo = String(r['رقم الخط'] || '').trim();
      const workDesc = String(r['وصف العمل الحالى'] || r['وصف الأعمال'] || '').trim();
      const permitNo = String(r['رقم الفسح'] || '').trim();
      const permitDate = formatDateStr(r['تارخ اصدار الفسح (ميلادي)'] || r['تاريخ اصدار الفسح'] || '');
      const digPermit = String(r['رقم إذن الحفر'] || '').trim();
      const digDate = formatDateStr(r['تاريخ إذن الحفر \n( ميلادى)'] || r['تاريخ إذن الحفر'] || '');
      const lengthVal = Number(r['طول القطاع']);
      const lengthMeters = !isNaN(lengthVal) && lengthVal > 0 ? lengthVal : undefined;
      if (lengthMeters) calculatedTotalOpenLength += lengthMeters;

      const rawOpenDays = Number(r['مدة فتح القطاع  بالأيام'] || r['مدة فتح القطاع بالأيام']);
      const openDays = !isNaN(rawOpenDays) ? Math.round(rawOpenDays) : undefined;
      const duration = openDays !== undefined ? `${openDays} يوم` : '';

      const location = streetName ? `${streetName}${lineNo ? ` - خط ${lineNo}` : ''}` : lineNo;

      items.push({
        id: `sec-${serialNum}`,
        serialNumber: serialNum,
        sector: sectorRaw || `قطاع ${serialNum}`,
        lineNo: lineNo || undefined,
        streetName: streetName || '',
        workDescription: workDesc,
        location: location || '',
        duration: duration,
        openDays: openDays,
        permit: permitNo,
        permitIssueDate: permitDate || undefined,
        digPermitNo: digPermit || undefined,
        digPermitDate: digDate || undefined,
        lengthMeters: lengthMeters,
        status: 'مفتوح (جاري العمل به)',
        source: 'api',
        sheetOrigin: 'قطاعات مفتوحة',
        raw: r
      });
    });
  } else {
    // Fallback: If 'قطاعات مفتوحة' only contained numbers, extract from DATA SHEET
    const openSet = new Set<number | string>();
    if (Array.isArray(openSectorsSheet)) {
      openSectorsSheet.forEach((row) => {
        const val = Object.values(row)[0];
        if (val !== undefined && val !== '' && val !== 'م' && typeof val !== 'object') {
          const parsed = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''));
          if (!isNaN(parsed)) {
            openSet.add(parsed);
          } else if (String(val).trim()) {
            openSet.add(String(val).trim());
          }
        }
      });
    }

    if (Array.isArray(dataSheet) && dataSheet.length > 0) {
      let serialCounter = 1;
      dataSheet.forEach((row) => {
        const primaryVal = Object.values(row)[0];
        if (
          primaryVal !== undefined &&
          primaryVal !== '' &&
          primaryVal !== 'م' &&
          primaryVal !== projectName &&
          primaryVal !== contractor &&
          !String(primaryVal).includes('إجمالي') &&
          !String(primaryVal).includes('2026-')
        ) {
          const numVal = parseInt(String(primaryVal).replace(/\D/g, '')) || serialCounter;
          const isOpen = openSet.has(numVal) || openSet.has(primaryVal as string | number);

          const workDesc = row['وصف الأعمال'] || row['الوصف'] || row['بيان الأعمال'] || '';
          const loc = row['موقعها'] || row['الموقع'] || '';
          const street = row['اسم الشارع'] || row['الشارع'] || '';
          const duration = row['مدة التنفيذ'] || row['المدة'] || '';
          const permit = row['الفسح'] || row['رقم الفسح'] || row['تصريح'] || '';
          const status = row['الحالة'] || (isOpen ? 'مفتوح (جاري العمل به)' : 'جاري العمل');
          const lengthMeters = row['الأطوال'] || row['الطول'] || undefined;

          items.push({
            id: `sec-${numVal}`,
            serialNumber: numVal,
            sector: `قطاع ${numVal}`,
            workDescription: String(workDesc).trim(),
            location: String(loc).trim(),
            streetName: String(street).trim(),
            duration: String(duration).trim(),
            permit: String(permit).trim(),
            status: String(status).trim(),
            lengthMeters: lengthMeters ? Number(lengthMeters) : undefined,
            source: 'api',
            sheetOrigin: 'DATA SHEET',
            raw: row
          });

          serialCounter++;
        }
      });
    }
  }

  const metadata: ProjectMetadata = {
    projectName,
    contractor,
    date,
    totalOpenLengthNotice,
    totalOpenLength: Math.round(calculatedTotalOpenLength * 10) / 10,
    totalCount: items.length,
    openSectorsCount: items.filter(i => i.status?.includes('مفتوح')).length || items.length,
    totalLengthMeters: Math.round(calculatedTotalOpenLength * 10) / 10,
  };

  return {
    metadata,
    items,
    sheets,
    rawEndpointData: json.data,
    hasDetailedColumns
  };
}

/**
 * Parse an Excel file uploaded by the user to extract full detailed columns
 * without any synthetic/mock data.
 */
export function parseUploadedExcel(fileBuffer: ArrayBuffer): {
  items: WorkItem[];
  metadataPartial?: Partial<ProjectMetadata>;
} {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) {
    throw new Error('ملف Excel فارغ');
  }

  // Find the primary data sheet
  const targetSheetName =
    sheetNames.find((s) => s.includes('DATA') || s.includes('قطاع') || s.includes('أعمال') || s.includes('متابعة')) ||
    sheetNames[0];

  const worksheet = workbook.Sheets[targetSheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawRows.length === 0) {
    throw new Error('لا توجد بيانات في صفحة Excel');
  }

  // Find the header row
  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(rawRows.length, 12); i++) {
    const row = rawRows[i];
    const rowStr = row.join(' ');
    if (
      rowStr.includes('وصف') ||
      rowStr.includes('شارع') ||
      rowStr.includes('فسح') ||
      rowStr.includes('قطاع') ||
      (row.includes('م') && row.length > 2)
    ) {
      headerRowIndex = i;
      headers = row.map((c) => String(c).trim());
      break;
    }
  }

  let items: WorkItem[] = [];
  let metadataPartial: Partial<ProjectMetadata> = {};

  // Check top rows for project metadata
  for (let i = 0; i < Math.min(headerRowIndex >= 0 ? headerRowIndex : 5, rawRows.length); i++) {
    const line = rawRows[i].filter(Boolean).map(String).join(' ');
    if (line.includes('عقد') || line.includes('مشروع')) {
      metadataPartial.projectName = line;
    }
    if (line.includes('مقاولة') || line.includes('شركة')) {
      metadataPartial.contractor = line;
    }
  }

  if (headerRowIndex >= 0) {
    const dataRows = rawRows.slice(headerRowIndex + 1);

    const colMap: Record<string, number> = {};
    headers.forEach((h, colIdx) => {
      const norm = h.replace(/\s+/g, ' ').trim();
      if (norm === 'م' || norm.includes('مسلسل')) colMap['serial'] = colIdx;
      else if (norm.includes('قطاع')) colMap['sector'] = colIdx;
      else if (norm.includes('وصف') || norm.includes('بيان')) colMap['workDescription'] = colIdx;
      else if (norm.includes('موقع')) colMap['location'] = colIdx;
      else if (norm.includes('شارع')) colMap['streetName'] = colIdx;
      else if (norm.includes('مدة') || norm.includes('تنفيذ')) colMap['duration'] = colIdx;
      else if (norm.includes('فسح') || norm.includes('تصريح')) colMap['permit'] = colIdx;
      else if (norm.includes('حالة')) colMap['status'] = colIdx;
    });

    dataRows.forEach((row, rIdx) => {
      const hasContent = row.some((cell) => String(cell).trim().length > 0);
      if (!hasContent) return;

      const firstCell = String(row[0] || '').trim();
      if (firstCell.includes('إجمالي') || firstCell.includes('المجموع')) return;

      const serial = colMap['serial'] !== undefined ? row[colMap['serial']] : rIdx + 1;
      const sector = colMap['sector'] !== undefined ? String(row[colMap['sector']]).trim() : `قطاع ${rIdx + 1}`;
      const desc = colMap['workDescription'] !== undefined ? String(row[colMap['workDescription']]).trim() : '';
      const loc = colMap['location'] !== undefined ? String(row[colMap['location']]).trim() : '';
      const street = colMap['streetName'] !== undefined ? String(row[colMap['streetName']]).trim() : '';
      const dur = colMap['duration'] !== undefined ? String(row[colMap['duration']]).trim() : '';
      const per = colMap['permit'] !== undefined ? String(row[colMap['permit']]).trim() : '';
      const stat = colMap['status'] !== undefined ? String(row[colMap['status']]).trim() : 'مفتوح (جاري العمل به)';

      items.push({
        id: `excel-${rIdx}-${serial}`,
        serialNumber: serial || rIdx + 1,
        sector: sector.startsWith('قطاع') ? sector : `قطاع ${sector}`,
        workDescription: desc,
        location: loc,
        streetName: street,
        duration: dur,
        permit: per,
        status: stat,
        source: 'excel',
        sheetOrigin: targetSheetName
      });
    });
  } else {
    // Standard key-value rows
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
    jsonData.forEach((row, idx) => {
      const entries = Object.entries(row);
      let desc = '';
      let loc = '';
      let street = '';
      let dur = '';
      let per = '';
      let sec = `قطاع ${idx + 1}`;
      let stat = 'مفتوح (جاري العمل به)';

      for (const [k, v] of entries) {
        const valStr = String(v).trim();
        if (k.includes('وصف') || k.includes('بيان')) desc = valStr;
        else if (k.includes('موقع')) loc = valStr;
        else if (k.includes('شارع')) street = valStr;
        else if (k.includes('مدة') || k.includes('تنفيذ')) dur = valStr;
        else if (k.includes('فسح') || k.includes('تصريح')) per = valStr;
        else if (k.includes('قطاع')) sec = valStr;
        else if (k.includes('حالة')) stat = valStr;
      }

      items.push({
        id: `excel-obj-${idx}`,
        serialNumber: idx + 1,
        sector: sec,
        workDescription: desc,
        location: loc,
        streetName: street,
        duration: dur,
        permit: per,
        status: stat,
        source: 'excel',
        sheetOrigin: targetSheetName,
        raw: row
      });
    });
  }

  return { items, metadataPartial };
}

export function exportToExcel(items: WorkItem[], projectName: string) {
  const exportData = items.map((item) => ({
    'م': item.serialNumber,
    'القطاع': item.sector,
    'رقم الخط': item.lineNo || '',
    'اسم الشارع': item.streetName || '',
    'وصف العمل الحالي': item.workDescription || '',
    'طول القطاع (م.ط)': item.lengthMeters || '',
    'مدة فتح القطاع (بالأيام)': item.openDays !== undefined ? item.openDays : (item.duration || ''),
    'رقم الفسح': item.permit || '',
    'تاريخ الفسح': item.permitIssueDate || '',
    'رقم إذن الحفر': item.digPermitNo || '',
    'تاريخ إذن الحفر': item.digPermitDate || '',
    'الموقع': item.location || '',
    'الحالة': item.status || 'مفتوح (جاري العمل به)'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قطاعات مفتوحة');

  const fileName = `متابعة_القطاعات_المفتوحة_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
