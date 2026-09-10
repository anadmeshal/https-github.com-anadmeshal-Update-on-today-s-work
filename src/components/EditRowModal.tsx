import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Wrench, MapPin, Clock, FileCheck, Calendar } from 'lucide-react';
import { WorkItem } from '../types';

interface EditRowModalProps {
  isOpen: boolean;
  item: WorkItem | null;
  onClose: () => void;
  onSave: (updatedItem: WorkItem) => void;
}

export const EditRowModal: React.FC<EditRowModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
}) => {
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

  useEffect(() => {
    if (item) {
      setSector(item.sector || '');
      setLineNo(item.lineNo || '');
      setStreetName(item.streetName || '');
      setLengthMeters(item.lengthMeters !== undefined ? String(item.lengthMeters) : '');
      setPermit(item.permit || '');
      setPermitIssueDate(item.permitIssueDate || '');
      setDigPermitNo(item.digPermitNo || '');
      setDigPermitDate(item.digPermitDate || '');
      setOpenDays(item.openDays !== undefined ? String(item.openDays) : (item.duration ? item.duration.replace(/\D/g, '') : ''));
      setWorkDescription(item.workDescription || '');
      const rawStat = item.status || '';
      const isClosed = rawStat.includes('مغلق') || rawStat.includes('مكتمل');
      setStatus(isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه');
      setLocation(item.location || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedDays = openDays.trim() ? parseInt(openDays.replace(/\D/g, ''), 10) : undefined;
    const parsedLength = lengthMeters.trim() ? parseFloat(lengthMeters.replace(/[^\d.]/g, '')) : undefined;
    const isClosed = status.includes('مغلق') || status.includes('مكتمل');
    const finalStatus = isClosed ? 'مغلق مكتمل' : 'مفتوح جاري العمل عليه';

    onSave({
      ...item,
      sector: sector.trim() || item.sector,
      lineNo: lineNo.trim() || undefined,
      streetName: streetName.trim(),
      lengthMeters: !isNaN(parsedLength as number) ? parsedLength : undefined,
      permit: permit.trim(),
      permitIssueDate: permitIssueDate.trim() || undefined,
      digPermitNo: digPermitNo.trim() || undefined,
      digPermitDate: digPermitDate.trim() || undefined,
      openDays: !isNaN(parsedDays as number) ? parsedDays : undefined,
      duration: !isNaN(parsedDays as number) ? `${parsedDays} يوم` : (openDays.trim() || item.duration),
      workDescription: workDescription.trim(),
      status: finalStatus,
      location: location.trim(),
      source: 'manual',
    });

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

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">تعديل بيانات {item.sector}</h3>
            <p className="text-xs text-slate-400">
              تحديث وحفظ كافة البيانات الهندسية والميدانية المعتمدة لهذا القطاع
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs text-slate-300">
          {/* 1. بيانات القطاع والموقع الهندسي */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>1. بيانات القطاع والموقع الهندسي</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">اسم / رقم القطاع *</label>
                <input
                  type="text"
                  required
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  placeholder="مثال: MH15 MH14 أو قطاع 1"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">رقم الخط (Line No)</label>
                <input
                  type="text"
                  value={lineNo}
                  onChange={(e) => setLineNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  placeholder="مثال: C-1 أو D-7 أو خط طرد PS-3"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">اسم الشارع</label>
                <input
                  type="text"
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  placeholder="اسم الشارع الفعلي..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">طول القطاع (م.ط)</label>
                <input
                  type="text"
                  value={lengthMeters}
                  onChange={(e) => setLengthMeters(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 font-mono"
                  placeholder="مثال: 68 أو 120"
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
                <label className="block font-bold text-slate-300 mb-1">رقم الفسح (Permit No)</label>
                <input
                  type="text"
                  value={permit}
                  onChange={(e) => setPermit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  placeholder="رقم الفسح أو التصريح..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>تاريخ إصدار الفسح (ميلادي)</span>
                </label>
                <input
                  type="text"
                  value={permitIssueDate}
                  onChange={(e) => setPermitIssueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  placeholder="مثال: 2026-07-25"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">رقم إذن الحفر (Dig Permit / PTW)</label>
                <input
                  type="text"
                  value={digPermitNo}
                  onChange={(e) => setDigPermitNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  placeholder="مثال: 627 أو PTW-680"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>تاريخ إذن الحفر (ميلادي)</span>
                </label>
                <input
                  type="text"
                  value={digPermitDate}
                  onChange={(e) => setDigPermitDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  placeholder="مثال: 2026-08-09"
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
                <label className="block font-bold text-slate-300 mb-1">مدة فتح القطاع بالأيام</label>
                <input
                  type="number"
                  min="0"
                  value={openDays}
                  onChange={(e) => setOpenDays(e.target.value)}
                  placeholder="مثال: 15 أو 30"
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">حالة العمل *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="مفتوح جاري العمل عليه">مفتوح جاري العمل عليه</option>
                  <option value="مغلق مكتمل">مغلق مكتمل</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-blue-400" />
                <span>وصف الأعمال الفعلية</span>
              </label>
              <textarea
                rows={2}
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="اكتب وصف وبيان الأعمال الفعلي لهذا القطاع..."
                className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">الموقع / ملاحظات إضافية</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="الموقع أو المعلم المميز..."
                className="w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-colors border border-slate-700 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ البيانات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
