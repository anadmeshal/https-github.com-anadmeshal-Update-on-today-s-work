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

export function formatDateStr(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  
  if (typeof val === 'string') {
    const str = val.trim();
    if (!str || str === '`' || str === '-') return '';
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    // ISO string like 2026-03-29T...
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
      return str.split('T')[0];
    }
    // Slash formats: YYYY/MM/DD or DD/MM/YYYY
    const slashParts = str.split('/');
    if (slashParts.length === 3) {
      if (slashParts[0].length === 4) {
        return `${slashParts[0]}-${slashParts[1].padStart(2, '0')}-${slashParts[2].padStart(2, '0')}`;
      } else if (slashParts[2].length === 4) {
        return `${slashParts[2]}-${slashParts[1].padStart(2, '0')}-${slashParts[0].padStart(2, '0')}`;
      }
    }

    // Dash formats: DD-MM-YYYY
    const dashParts = str.split('-');
    if (dashParts.length === 3) {
      if (dashParts[2].length === 4) {
        return `${dashParts[2]}-${dashParts[1].padStart(2, '0')}-${dashParts[0].padStart(2, '0')}`;
      }
    }
  }

  // Excel serial number (e.g. 40000 - 60000)
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }

  try {
    const d = new Date(val);
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // fallback
  }

  return String(val).trim();
}

/**
 * Robust extractor for permit issue date from any row key
 */
export function extractPermitDate(row: any): string {
  if (!row || typeof row !== 'object') return '';
  // Check exact standard keys first
  const candidates = [
    'تارخ اصدار الفسح (ميلادي)',
    'تاريخ اصدار الفسح (ميلادي)',
    'تاريخ إصدار الفسح (ميلادي)',
    'تاريخ اصدار الفسح',
    'تاريخ إصدار الفسح',
    'تارخ اصدار الفسح',
    'تاريخ الفسح',
    'تارخ الفسح',
  ];
  for (const cand of candidates) {
    if (row[cand]) {
      const formatted = formatDateStr(row[cand]);
      if (formatted) return formatted;
    }
  }

  // Fallback: search keys
  const keys = Object.keys(row);
  for (const k of keys) {
    const norm = k.replace(/\s+/g, ' ').trim();
    if (norm.includes('فسح') && (norm.includes('تاريخ') || norm.includes('تارخ') || norm.includes('اصدار'))) {
      const formatted = formatDateStr(row[k]);
      if (formatted) return formatted;
    }
  }
  return '';
}

/**
 * Robust extractor for excavation permit date from any row key
 */
export function extractDigPermitDate(row: any): string {
  if (!row || typeof row !== 'object') return '';
  const candidates = [
    'تاريخ إذن الحفر \n( ميلادى)',
    'تاريخ إذن الحفر \n(ميلادي)',
    'تاريخ إذن الحفر (ميلادي)',
    'تاريخ إذن الحفر ( ميلادى)',
    'تاريخ إذن الحفر',
    'تاريخ اذن الحفر',
    'تاريخ الحفر',
    'تارخ إذن الحفر',
  ];
  for (const cand of candidates) {
    if (row[cand]) {
      const formatted = formatDateStr(row[cand]);
      if (formatted) return formatted;
    }
  }

  // Fallback: search keys
  const keys = Object.keys(row);
  for (const k of keys) {
    const norm = k.replace(/\s+/g, ' ').trim();
    if ((norm.includes('حفر') || norm.includes('إذن')) && (norm.includes('تاريخ') || norm.includes('تارخ'))) {
      const formatted = formatDateStr(row[k]);
      if (formatted) return formatted;
    }
  }
  return '';
}

// دالة لتنظيف اسم المقاول بحذف كلمة "المقاولة" أو بادئة "مقاولة / "
export function cleanContractorName(raw: string): string {
  if (!raw) return 'شركة نظم البيئة';
  return raw
    .replace(/^مقاولة\s*[\/:\-]*\s*/gi, '')
    .replace(/المقاولة/gi, '')
    .replace(/للمقاولات/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || 'شركة نظم البيئة';
}

export function formatProjectName(raw: string): string {
  if (!raw) return 'عقد تنفيذ شبكات صرف صحي العوالي 2 - الرياض';
  const trimmed = raw.trim();
  if (trimmed.includes('الرياض')) return trimmed;
  return `${trimmed} - الرياض`;
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
  let projectName = 'عقد تنفيذ شبكات صرف صحي العوالي 2 - الرياض';
  let contractor = 'شركة نظم البيئة';
  let date = '2026-09-07';
  let totalOpenLengthNotice = 'إجمالي الأطوال المفتوحة';

  if (Array.isArray(dataSheet) && dataSheet.length > 0) {
    const firstVal = Object.values(dataSheet[0] || {})[0];
    const secondVal = Object.values(dataSheet[1] || {})[0];
    const thirdVal = Object.values(dataSheet[2] || {})[0];

    if (typeof firstVal === 'string' && firstVal.trim()) projectName = formatProjectName(firstVal);
    if (typeof secondVal === 'string' && secondVal.trim()) contractor = cleanContractorName(secondVal);
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
    const seenIds = new Set<string>();
    validOpenRows.forEach((r, idx) => {
      const serialNum = idx + 1;
      const sectorRaw = String(r['القطاع'] || '').trim();
      const streetName = String(r['إسم الشارع'] || '').trim();
      const lineNo = String(r['رقم الخط'] || '').trim();
      const workDesc = String(r['وصف العمل الحالى'] || r['وصف الأعمال'] || '').trim();
      const permitNo = String(r['رقم الفسح'] || '').trim();
      const permitDate = extractPermitDate(r);
      const digPermit = String(r['رقم إذن الحفر'] || '').trim();
      const digDate = extractDigPermitDate(r);
      const lengthVal = Number(r['طول القطاع'] || r['الطول']);
      const lengthMeters = !isNaN(lengthVal) && lengthVal > 0 ? lengthVal : undefined;
      if (lengthMeters) calculatedTotalOpenLength += lengthMeters;

      const rawOpenDays = Number(r['مدة فتح القطاع  بالأيام'] || r['مدة فتح القطاع بالأيام']);
      const openDays = !isNaN(rawOpenDays) ? Math.round(rawOpenDays) : undefined;
      const duration = openDays !== undefined ? `${openDays} يوم` : '';

      const location = streetName ? `${streetName}${lineNo ? ` - خط ${lineNo}` : ''}` : lineNo;

      let uniqueId = `sec-${serialNum}`;
      if (seenIds.has(uniqueId)) {
        uniqueId = `sec-${serialNum}-${idx + 1}`;
      }
      seenIds.add(uniqueId);

      items.push({
        id: uniqueId,
        serialNumber: serialNum,
        sector: sectorRaw || `قطاع ${serialNum}`,
        lineNo: lineNo || undefined,
        streetName: streetName || '',
        workDescription: workDesc,
        location: location || '',
        duration: duration,
        openDays: openDays,
        startDate: digDate || undefined,
        todayDate: formatDateStr(r['تاريخ اليوم']) || undefined,
        permit: permitNo,
        permitIssueDate: permitDate || undefined,
        digPermitNo: digPermit || undefined,
        digPermitDate: digDate || undefined,
        lengthMeters: lengthMeters,
        status: 'مفتوح جاري العمل عليه',
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
      const seenFallbackIds = new Set<string>();
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
          const rawStatus = row['الحالة'] ? String(row['الحالة']) : (isOpen ? 'مفتوح جاري العمل عليه' : 'مفتوح جاري العمل عليه');
          const isClosed = rawStatus.includes('مغلق') || rawStatus.includes('مكتمل');
          const status = isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه';
          const lengthMeters = row['الأطوال'] || row['الطول'] || undefined;

          let uniqueId = `sec-${numVal}`;
          if (seenFallbackIds.has(uniqueId)) {
            uniqueId = `sec-${numVal}-${serialCounter}`;
          }
          seenFallbackIds.add(uniqueId);

          items.push({
            id: uniqueId,
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
      metadataPartial.projectName = formatProjectName(line);
    }
    if (line.includes('مقاولة') || line.includes('شركة')) {
      metadataPartial.contractor = cleanContractorName(line);
    }
  }

  if (headerRowIndex >= 0) {
    const dataRows = rawRows.slice(headerRowIndex + 1);

    const colMap: Record<string, number> = {};
    headers.forEach((h, colIdx) => {
      const norm = h.replace(/\s+/g, ' ').trim();
      if (norm === 'م' || norm.includes('مسلسل')) colMap['serial'] = colIdx;
      else if (norm.includes('قطاع')) colMap['sector'] = colIdx;
      else if (norm.includes('خط')) colMap['lineNo'] = colIdx;
      else if (norm.includes('شارع')) colMap['streetName'] = colIdx;
      else if (norm.includes('طول') || norm.includes('أطوال')) colMap['length'] = colIdx;
      else if (norm.includes('وصف') || norm.includes('بيان')) colMap['workDescription'] = colIdx;
      else if (norm.includes('موقع')) colMap['location'] = colIdx;
      else if (norm.includes('مدة') || norm.includes('فتح')) colMap['duration'] = colIdx;
      else if (norm.includes('تاريخ') && norm.includes('فسح')) colMap['permitDate'] = colIdx;
      else if (norm.includes('فسح') || norm.includes('تصريح')) colMap['permit'] = colIdx;
      else if (norm.includes('تاريخ') && norm.includes('حفر')) colMap['digDate'] = colIdx;
      else if (norm.includes('إذن') || norm.includes('اذن') || norm.includes('حفر')) colMap['digPermit'] = colIdx;
      else if (norm.includes('حالة')) colMap['status'] = colIdx;
    });

    dataRows.forEach((row, rIdx) => {
      const hasContent = row.some((cell) => String(cell).trim().length > 0);
      if (!hasContent) return;

      const firstCell = String(row[0] || '').trim();
      if (firstCell.includes('إجمالي') || firstCell.includes('المجموع')) return;

      const serial = colMap['serial'] !== undefined ? row[colMap['serial']] : rIdx + 1;
      const sector = colMap['sector'] !== undefined ? String(row[colMap['sector']]).trim() : `قطاع ${rIdx + 1}`;
      const lineNo = colMap['lineNo'] !== undefined ? String(row[colMap['lineNo']]).trim() : undefined;
      const desc = colMap['workDescription'] !== undefined ? String(row[colMap['workDescription']]).trim() : '';
      const loc = colMap['location'] !== undefined ? String(row[colMap['location']]).trim() : '';
      const street = colMap['streetName'] !== undefined ? String(row[colMap['streetName']]).trim() : '';
      const dur = colMap['duration'] !== undefined ? String(row[colMap['duration']]).trim() : '';
      const per = colMap['permit'] !== undefined ? String(row[colMap['permit']]).trim() : '';
      const perDate = colMap['permitDate'] !== undefined ? formatDateStr(row[colMap['permitDate']]) : undefined;
      const digP = colMap['digPermit'] !== undefined ? String(row[colMap['digPermit']]).trim() : undefined;
      const digD = colMap['digDate'] !== undefined ? formatDateStr(row[colMap['digDate']]) : undefined;
      const lenVal = colMap['length'] !== undefined ? Number(row[colMap['length']]) : undefined;
      const lengthMeters = lenVal && !isNaN(lenVal) ? lenVal : undefined;

      const rawDays = parseFloat(dur.replace(/[^\d.]/g, ''));
      const openDays = !isNaN(rawDays) ? Math.round(rawDays) : undefined;

      const rawStat = colMap['status'] !== undefined ? String(row[colMap['status']]).trim() : '';
      const isClosed = rawStat.includes('مغلق') || rawStat.includes('مكتمل');
      const stat = isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه';

      items.push({
        id: `excel-${Date.now()}-${rIdx}-${serial}`,
        serialNumber: Number(serial) || rIdx + 1,
        sector: sector.startsWith('قطاع') ? sector : `قطاع ${sector}`,
        lineNo: lineNo || undefined,
        workDescription: desc,
        location: loc || (street ? `${street}${lineNo ? ` - خط ${lineNo}` : ''}` : ''),
        streetName: street,
        duration: dur,
        openDays: openDays,
        permit: per,
        permitIssueDate: perDate,
        digPermitNo: digP,
        digPermitDate: digD,
        lengthMeters: lengthMeters,
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
      let stat = 'مفتوح جاري العمل عليه';

      for (const [k, v] of entries) {
        const valStr = String(v).trim();
        if (k.includes('وصف') || k.includes('بيان')) desc = valStr;
        else if (k.includes('موقع')) loc = valStr;
        else if (k.includes('شارع')) street = valStr;
        else if (k.includes('مدة') || k.includes('تنفيذ')) dur = valStr;
        else if (k.includes('فسح') || k.includes('تصريح')) per = valStr;
        else if (k.includes('قطاع')) sec = valStr;
        else if (k.includes('حالة') || k.includes('حاله')) {
          stat = (valStr.includes('مغلق') || valStr.includes('مكتمل')) ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه';
        }
      }

      items.push({
        id: `excel-obj-${Date.now()}-${idx}`,
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
    'الحالة': ((item.status || '').includes('مغلق') || (item.status || '').includes('مكتمل')) ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قطاعات مفتوحة');

  const fileName = `متابعة_القطاعات_المفتوحة_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
