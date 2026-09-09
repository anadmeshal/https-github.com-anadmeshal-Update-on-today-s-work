import React, { useState } from 'react';
import { X, Plus, Clipboard, Check } from 'lucide-react';
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

  // Single row state
  const [sector, setSector] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [location, setLocation] = useState('');
  const [streetName, setStreetName] = useState('');
  const [duration, setDuration] = useState('');
  const [permit, setPermit] = useState('');
  const [status, setStatus] = useState('مفتوح (جاري العمل)');

  // Paste mode state
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector.trim()) return;

    const newItem: WorkItem = {
      id: `manual-${Date.now()}`,
      serialNumber: existingCount + 1,
      sector: sector.startsWith('قطاع') ? sector : `قطاع ${sector}`,
      workDescription: workDescription.trim(),
      location: location.trim(),
      streetName: streetName.trim(),
      duration: duration.trim(),
      permit: permit.trim(),
      status: status.trim() || 'جاري العمل',
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

    const lines = pasteContent.trim().split('\n');
    const parsedRows: WorkItem[] = [];

    lines.forEach((line, idx) => {
      // Split by tab (Excel copy) or comma
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      if (cols.length === 0 || !cols.some((c) => c.trim())) return;

      const sec = cols[0]?.trim() || `قطاع ${existingCount + idx + 1}`;
      const desc = cols[1]?.trim() || '';
      const loc = cols[2]?.trim() || '';
      const street = cols[3]?.trim() || '';
      const dur = cols[4]?.trim() || '';
      const per = cols[5]?.trim() || '';
      const stat = cols[6]?.trim() || 'جاري العمل';

      parsedRows.push({
        id: `paste-${Date.now()}-${idx}`,
        serialNumber: existingCount + idx + 1,
        sector: sec.startsWith('قطاع') ? sec : `قطاع ${sec}`,
        workDescription: desc,
        location: loc,
        streetName: street,
        duration: dur,
        permit: per,
        status: stat,
        source: 'manual',
      });
    });

    if (parsedRows.length === 0) {
      setPasteError('لم يتم التعرف على أي صفوف صالحة');
      return;
    }

    onAddRows(parsedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full p-6 text-right relative max-h-[90vh] flex flex-col text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">إضافة صفوف بيانات فعلية</h3>
            <p className="text-xs text-slate-400">
              إدخال الأعمال والقطاعات بالبيانات الواقعية حسب اشتراطاتك الصارمة
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-1 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              mode === 'single'
                ? 'bg-slate-900 text-white shadow-xs border border-slate-800'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            إدخال صف فردي
          </button>
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'paste'
                ? 'bg-slate-900 text-white shadow-xs border border-slate-800'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            لصق عدة صفوف (نسخ من Excel)
          </button>
        </div>

        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-3 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  القطاع <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="مثال: قطاع 1 أو 48"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-slate-950 placeholder:text-slate-500"
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
                  placeholder="مثال: شارع الملك فيصل"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-slate-950 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                وصف الأعمال
              </label>
              <input
                type="text"
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="مثال: حفر وتمديد خط صرف صحي رئيسي قطر 400 ملم"
                className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-slate-950 placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الموقع
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: حي العوالي - المربع 3"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-slate-950 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  مدة التنفيذ
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="مثال: 14 يوم أو أسبوعين"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-slate-950 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الفسح (رقم أو بيان التصريح)
                </label>
                <input
                  type="text"
                  value={permit}
                  onChange={(e) => setPermit(e.target.value)}
                  placeholder="مثال: فسح رقم 4401823"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-slate-950 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الحالة
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="مفتوح (جاري العمل)">مفتوح (جاري العمل)</option>
                  <option value="مكتمل">مكتمل</option>
                  <option value="مؤجل">مؤجل</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 border border-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                إضافة الصف الآن
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col">
            <p className="text-xs text-slate-400 mb-2">
              انسخ الصفوف من جدول Excel وألصقها هنا مباشرة. الترتيب المتوقع للأعمدة:
              <br />
              <span className="font-mono text-[11px] text-slate-300 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded inline-block mt-1">
                القطاع [Tab] وصف الأعمال [Tab] الموقع [Tab] اسم الشارع [Tab] مدة التنفيذ [Tab] الفسح
              </span>
            </p>
            <textarea
              rows={6}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder={`قطاع 1\tحفر وتمديد مواسير\tحي العوالي\tشارع عبد الله بن الزبير\t10 أيام\tفسح 99128\nقطاع 2\tردم وإعادة سفلتة\tحي العوالي\tشارع الصحابة\t5 أيام\tفسح 99129`}
              className="w-full text-xs p-3 font-mono bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-slate-950 flex-1"
            />
            {pasteError && (
              <p className="text-xs text-red-400 mt-2 font-semibold">{pasteError}</p>
            )}
            <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                معالجة وإدراج الصفوف
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
