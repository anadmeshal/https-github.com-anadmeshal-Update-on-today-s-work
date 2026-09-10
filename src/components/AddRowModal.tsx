import React, { useState } from 'react';
import { X, Plus, Clipboard, Check, FileCheck, Layers, Calendar, Clock, MapPin, Wrench } from 'lucide-react';
import { WorkItem } from '../types';

interface AddRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRows: (rows: WorkItem[]) => void;
  existingCount: number;
}

export const AddRowModal: React.FC<AddRowModalProps> = ({
  isOpen,
  onClose,
  onAddRows,
  existingCount,
}) => {
  const [mode, setMode] = useState<'single' | 'paste'>('single');

  // Single row state - All comprehensive engineering fields
  const [sector, setSector] = useState('');
  const [lineNo, setLineNo] = useState('');
  const [streetName, setStreetName] = useState('');
  const [lengthMeters, setLengthMeters] = useState<string>('');
  const [permit, setPermit] = useState('');
  const [permitIssueDate, setPermitIssueDate] = useState('');
  const [digPermitNo, setDigPermitNo] = useState('');
  const [digPermitDate, setDigPermitDate] = useState('');
  const [openDays, setOpenDays] = useState<string>('');
  const [workDescription, setWorkDescription] = useState('');
  const [status, setStatus] = useState('مفتوح جاري العمل عليه');
  const [location, setLocation] = useState('');

  // Paste mode state
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector.trim()) return;

    const parsedDays = openDays.trim() ? parseInt(openDays.replace(/\D/g, ''), 10) : undefined;
    const parsedLength = lengthMeters.trim() ? parseFloat(lengthMeters.replace(/[^\d.]/g, '')) : undefined;

    const newItem: WorkItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      serialNumber: existingCount + 1,
      sector: sector.trim(),
      lineNo: lineNo.trim() || undefined,
      streetName: streetName.trim(),
      lengthMeters: !isNaN(parsedLength as number) ? parsedLength : undefined,
      permit: permit.trim(),
      permitIssueDate: permitIssueDate.trim() || undefined,
      digPermitNo: digPermitNo.trim() || undefined,
      digPermitDate: digPermitDate.trim() || undefined,
      openDays: !isNaN(parsedDays as number) ? parsedDays : undefined,
      duration: !isNaN(parsedDays as number) ? `${parsedDays} يوم` : '',
      workDescription: workDescription.trim(),
      location: location.trim() || (streetName.trim() ? `${streetName.trim()}${lineNo.trim() ? ` - خط ${lineNo.trim()}` : ''}` : ''),
      status: (status.trim() === 'مغلق مكتمل' || status.includes('مغلق') || status.includes('مكتمل')) ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه',
      source: 'manual',
    };

    onAddRows([newItem]);
    onClose();
  };

  const handlePasteSubmit = () => {
    setPasteError(null);
    if (!pasteContent.trim()) {
      setPasteError('الرجاء لصق البيانات أولاً');
      return;
    }

    const lines = pasteContent.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setPasteError('لم يتم العثور على أسطر صالحة');
      return;
    }

    const parsedRows: WorkItem[] = [];
    let startIdx = 0;

    // Check if first line is a header
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
      firstLineLower.includes('قطاع') ||
      firstLineLower.includes('شارع') ||
      firstLineLower.includes('فسح') ||
      firstLineLower.includes('خط') ||
      firstLineLower.includes('وصف') ||
      firstLineLower.includes('طول');

    let colMap: Record<string, number> = {};
    if (hasHeader) {
      startIdx = 1;
      const headers = lines[0].split('\t').length > 1 ? lines[0].split('\t') : lines[0].split(',');
      headers.forEach((h, colIdx) => {
        const norm = h.replace(/\s+/g, ' ').trim();
        if (norm === 'م' || norm.includes('مسلسل')) colMap['serial'] = colIdx;
        else if (norm.includes('قطاع')) colMap['sector'] = colIdx;
        else if (norm.includes('خط')) colMap['lineNo'] = colIdx;
        else if (norm.includes('شارع')) colMap['streetName'] = colIdx;
        else if (norm.includes('طول')) colMap['length'] = colIdx;
        else if (norm.includes('تاريخ') && norm.includes('حفر')) colMap['digPermitDate'] = colIdx;
        else if (norm.includes('إذن') && norm.includes('حفر')) colMap['digPermitNo'] = colIdx;
        else if (norm.includes('تاريخ') && (norm.includes('فسح') || norm.includes('إصدار'))) colMap['permitDate'] = colIdx;
        else if (norm.includes('فسح') || norm.includes('تصريح')) colMap['permit'] = colIdx;
        else if (norm.includes('مدة') || norm.includes('أيام')) colMap['openDays'] = colIdx;
        else if (norm.includes('وصف') || norm.includes('بيان')) colMap['workDescription'] = colIdx;
        else if (norm.includes('حالة')) colMap['status'] = colIdx;
      });
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
      if (cols.length === 0 || !cols.some((c) => c.trim())) continue;

      let sec = '';
      let lineNum = '';
      let street = '';
      let lengthVal: number | undefined = undefined;
      let perm = '';
      let permDate = '';
      let digPerm = '';
      let digDate = '';
      let daysVal: number | undefined = undefined;
      let desc = '';
      let stat = 'مفتوح جاري العمل عليه';

      if (hasHeader && Object.keys(colMap).length > 0) {
        sec = colMap['sector'] !== undefined ? cols[colMap['sector']]?.trim() || '' : '';
        lineNum = colMap['lineNo'] !== undefined ? cols[colMap['lineNo']]?.trim() || '' : '';
        street = colMap['streetName'] !== undefined ? cols[colMap['streetName']]?.trim() || '' : '';
        perm = colMap['permit'] !== undefined ? cols[colMap['permit']]?.trim() || '' : '';
        permDate = colMap['permitDate'] !== undefined ? cols[colMap['permitDate']]?.trim() || '' : '';
        digPerm = colMap['digPermitNo'] !== undefined ? cols[colMap['digPermitNo']]?.trim() || '' : '';
        digDate = colMap['digPermitDate'] !== undefined ? cols[colMap['digPermitDate']]?.trim() || '' : '';
        desc = colMap['workDescription'] !== undefined ? cols[colMap['workDescription']]?.trim() || '' : '';
        const parsedStat = colMap['status'] !== undefined ? cols[colMap['status']]?.trim() || '' : '';
        if (parsedStat) {
          stat = (parsedStat.includes('مغلق') || parsedStat.includes('مكتمل')) ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه';
        }

        if (colMap['length'] !== undefined) {
          const lParsed = parseFloat(String(cols[colMap['length']]).replace(/[^\d.]/g, ''));
          if (!isNaN(lParsed)) lengthVal = lParsed;
        }
        if (colMap['openDays'] !== undefined) {
          const dParsed = parseInt(String(cols[colMap['openDays']]).replace(/\D/g, ''), 10);
          if (!isNaN(dParsed)) daysVal = dParsed;
        }
      } else {
        // Fallback: If 10-11 columns matching Google Sheet order:
        // [م] | الشارع | رقم الخط | القطاع | رقم الفسح | تاريخ الفسح | رقم إذن الحفر | تاريخ إذن الحفر | طول القطاع | مدة فتح القطاع | وصف العمل
        if (cols.length >= 8) {
          street = cols[1]?.trim() || '';
          lineNum = cols[2]?.trim() || '';
          sec = cols[3]?.trim() || cols[0]?.trim() || '';
          perm = cols[4]?.trim() || '';
          permDate = cols[5]?.trim() || '';
          digPerm = cols[6]?.trim() || '';
          digDate = cols[7]?.trim() || '';
          if (cols[8]) {
            const lParsed = parseFloat(String(cols[8]).replace(/[^\d.]/g, ''));
            if (!isNaN(lParsed)) lengthVal = lParsed;
          }
          if (cols[9]) {
            const dParsed = parseInt(String(cols[9]).replace(/\D/g, ''), 10);
            if (!isNaN(dParsed)) daysVal = dParsed;
          }
          desc = cols[10]?.trim() || '';
        } else {
          // 4-7 columns basic paste
          sec = cols[0]?.trim() || `قطاع ${existingCount + i + 1}`;
          desc = cols[1]?.trim() || '';
          street = cols[2]?.trim() || '';
          lineNum = cols[3]?.trim() || '';
          perm = cols[4]?.trim() || '';
          if (cols[5]) {
            const dParsed = parseInt(String(cols[5]).replace(/\D/g, ''), 10);
            if (!isNaN(dParsed)) daysVal = dParsed;
          }
        }
      }

      if (!sec) {
        sec = `قطاع ${existingCount + parsedRows.length + 1}`;
      }

      parsedRows.push({
        id: `paste-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        serialNumber: existingCount + parsedRows.length + 1,
        sector: sec,
        lineNo: lineNum || undefined,
        streetName: street,
        lengthMeters: lengthVal,
        permit: perm,
        permitIssueDate: permDate || undefined,
        digPermitNo: digPerm || undefined,
        digPermitDate: digDate || undefined,
        openDays: daysVal,
        duration: daysVal !== undefined ? `${daysVal} يوم` : '',
        workDescription: desc,
        location: street ? `${street}${lineNum ? ` - خط ${lineNum}` : ''}` : lineNum,
        status: stat,
        source: 'manual',
      });
    }

    if (parsedRows.length === 0) {
      setPasteError('لم يتم التعرف على أي صفوف صالحة. تأكد من صحة البيانات المنسوخة');
      return;
    }

    onAddRows(parsedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-2xl w-full p-4 sm:p-6 text-right relative max-h-[92vh] flex flex-col text-slate-100">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">إضافة صفوف بيانات هندسية كاملة</h3>
            <p className="text-xs text-slate-400">
              إدخال كافة بيانات القطاع والخط والشارع والفسوحات وأذونات الحفر والأطوال والمدد
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'single'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>إدخال صف فردي (نموذج تفصيلي شامل)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'paste'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>لصق عدة صفوف (نسخ من Excel / جداول)</span>
          </button>
        </div>

        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* 1. بيانات القطاع والموقع الهندسي */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>1. بيانات القطاع والموقع الهندسي</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    اسم / رقم القطاع <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="مثال: MH15 MH14 أو قطاع 48"
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    رقم الخط (Line No)
                  </label>
                  <input
                    type="text"
                    value={lineNo}
                    onChange={(e) => setLineNo(e.target.value)}
                    placeholder="مثال: C-1 أو D-7 أو خط طرد PS-3"
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    اسم الشارع
                  </label>
                  <input
                    type="text"
                    value={streetName}
                    onChange={(e) => setStreetName(e.target.value)}
                    placeholder="مثال: شارع عطية السعدي"
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    طول القطاع (م.ط)
                  </label>
                  <input
                    type="text"
                    value={lengthMeters}
                    onChange={(e) => setLengthMeters(e.target.value)}
                    placeholder="مثال: 68 أو 100"
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. بيانات الفسوحات وأذونات الحفر */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 border-b border-slate-800 pb-2">
                <FileCheck className="w-3.5 h-3.5" />
                <span>2. بيانات الفسوحات وأذونات الحفر (البلدية وسلامة الحفر)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    رقم الفسح (Permit No)
                  </label>
                  <input
                    type="text"
                    value={permit}
                    onChange={(e) => setPermit(e.target.value)}
                    placeholder="مثال: 2296757"
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>تاريخ إصدار الفسح (ميلادي)</span>
                  </label>
                  <input
                    type="text"
                    value={permitIssueDate}
                    onChange={(e) => setPermitIssueDate(e.target.value)}
                    placeholder="مثال: 2026-07-25"
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    رقم إذن الحفر (Dig Permit / PTW)
                  </label>
                  <input
                    type="text"
                    value={digPermitNo}
                    onChange={(e) => setDigPermitNo(e.target.value)}
                    placeholder="مثال: 627 أو PTW-680"
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>تاريخ إذن الحفر (ميلادي)</span>
                  </label>
                  <input
                    type="text"
                    value={digPermitDate}
                    onChange={(e) => setDigPermitDate(e.target.value)}
                    placeholder="مثال: 2026-08-09"
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. مدة فتح القطاع والحالة ووصف الأعمال */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 border-b border-slate-800 pb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>3. مدة التنفيذ وحالة الأعمال الميدانية</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    مدة فتح القطاع بالأيام
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={openDays}
                    onChange={(e) => setOpenDays(e.target.value)}
                    placeholder="مثال: 15 أو 30"
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden placeholder:text-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    حالة العمل
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer font-bold"
                  >
                    <option value="مفتوح جاري العمل عليه">مفتوح جاري العمل عليه</option>
                    <option value="مغلق مكتمل">مغلق مكتمل</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-slate-400" />
                  <span>وصف العمل الحالي</span>
                </label>
                <input
                  type="text"
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="مثال: جاري حفر وتمديد جزئي، أو أسفلت طبقة ثانية..."
                  className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الموقع / ملاحظات إضافية
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: تقاطع مع شارع العوالي، خط رئيسي"
                  className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 border border-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>إضافة الصف الآن</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col space-y-3 overflow-y-auto pr-1">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-emerald-400">
                يمكنك نسخ صفوف مباشرة من Excel أو Google Sheets ولصقها هنا:
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                يدعم النظام التعرف التلقائي على رؤوس الأعمدة في حال نسخها مع الجدول، أو الترتيب المعتمد لجدول القطاعات المفتوحة:
              </p>
              <div className="font-mono text-[10px] text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800 overflow-x-auto whitespace-nowrap text-left dir-ltr">
                [الرقم] [Tab] الشارع [Tab] رقم الخط [Tab] القطاع [Tab] رقم الفسح [Tab] تاريخ الفسح [Tab] رقم إذن الحفر [Tab] تاريخ إذن الحفر [Tab] طول القطاع [Tab] مدة الفتح [Tab] وصف العمل
              </div>
            </div>

            <textarea
              rows={8}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder={`عطية السعدي\tC-1\tMH15 MH14\t2296757\t2026-07-25\t627\t2026-08-09\t68\t15\tجاري حفر وتمديد`}
              className="w-full text-xs p-3 font-mono bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden flex-1 resize-y min-h-[140px]"
            />

            {pasteError && (
              <p className="text-xs text-red-400 font-semibold bg-red-950/40 p-2 rounded-lg border border-red-900">
                {pasteError}
              </p>
            )}

            <div className="mt-2 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 border border-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>معالجة وإدراج الصفوف</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
