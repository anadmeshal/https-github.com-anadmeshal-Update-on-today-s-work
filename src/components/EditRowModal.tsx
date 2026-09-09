import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Wrench, MapPin, Clock, FileCheck } from 'lucide-react';
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
  const [workDescription, setWorkDescription] = useState('');
  const [location, setLocation] = useState('');
  const [streetName, setStreetName] = useState('');
  const [duration, setDuration] = useState('');
  const [permit, setPermit] = useState('');
  const [status, setStatus] = useState('جاري العمل');

  useEffect(() => {
    if (item) {
      setSector(item.sector || '');
      setWorkDescription(item.workDescription || '');
      setLocation(item.location || '');
      setStreetName(item.streetName || '');
      setDuration(item.duration || '');
      setPermit(item.permit || '');
      setStatus(item.status || 'مفتوح (جاري العمل به)');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      ...item,
      sector: sector.trim() || item.sector,
      workDescription: workDescription.trim(),
      location: location.trim(),
      streetName: streetName.trim(),
      duration: duration.trim(),
      permit: permit.trim(),
      status: status.trim() || 'جاري العمل',
      source: 'manual'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-xl w-full p-6 text-right relative max-h-[90vh] flex flex-col text-slate-100">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">تعديل بيانات {item.sector}</h3>
            <p className="text-xs text-slate-400">
              إدخال وتحديث البيانات الفعلية المعتمدة لهذا القطاع
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 pr-1 space-y-3.5 text-xs text-slate-300">
          {/* Sector & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">اسم / رقم القطاع *</label>
              <input
                type="text"
                required
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2 border border-slate-700 bg-slate-950 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: قطاع 1"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">حالة العمل *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-700 bg-slate-950 rounded-lg text-xs font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="مفتوح (جاري العمل به)">مفتوح (جاري العمل به)</option>
                <option value="جاري العمل">جاري العمل</option>
                <option value="مكتمل">مكتمل</option>
                <option value="متوقف مؤقتاً">متوقف مؤقتاً</option>
              </select>
            </div>
          </div>

          {/* Work Description */}
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
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
            />
          </div>

          {/* Location & Street */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>اسم الشارع</span>
              </label>
              <input
                type="text"
                value={streetName}
                onChange={(e) => setStreetName(e.target.value)}
                placeholder="اسم الشارع الفعلي..."
                className="w-full px-3 py-2 border border-slate-700 bg-slate-950 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">الموقع / المعلم</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="الموقع أو المعلم المميز..."
                className="w-full px-3 py-2 border border-slate-700 bg-slate-950 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Duration & Permit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>مدة التنفيذ</span>
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="مثال: 30 يوماً"
                className="w-full px-3 py-2 border border-slate-700 bg-slate-950 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>رقم الفسح / التصريح</span>
              </label>
              <input
                type="text"
                value={permit}
                onChange={(e) => setPermit(e.target.value)}
                placeholder="رقم الفسح أو التصريح..."
                className="w-full px-3 py-2 border border-slate-700 bg-slate-950 rounded-lg text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
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
