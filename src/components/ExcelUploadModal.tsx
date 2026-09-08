import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { parseUploadedExcel } from '../services/api';
import { WorkItem, ProjectMetadata } from '../types';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (items: WorkItem[], metadataPartial?: Partial<ProjectMetadata>) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewItems, setPreviewItems] = useState<WorkItem[] | null>(null);
  const [metadataPartial, setMetadataPartial] = useState<Partial<ProjectMetadata> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseUploadedExcel(buffer);
      if (result.items.length === 0) {
        throw new Error('لم يتم العثور على صفوف صالحة في ملف Excel');
      }
      setPreviewItems(result.items);
      setMetadataPartial(result.metadataPartial || {});
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء قراءة ملف Excel');
      setPreviewItems(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleConfirm = () => {
    if (previewItems && previewItems.length > 0) {
      onImportSuccess(previewItems, metadataPartial || undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 text-right relative max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">رفع ملف Excel للأعمال والقطاعات</h3>
            <p className="text-xs text-slate-500">
              قراءة البيانات الفعلية لكامل الأعمدة (وصف الأعمال، الموقع، الشارع، مدة التنفيذ، والفسح)
            </p>
          </div>
        </div>

        {/* Drop area */}
        {!previewItems ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
            />
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              اضغط لاختيار ملف أو اسحب الملف وأفلته هنا
            </p>
            <p className="text-xs text-slate-500 mt-1">
              يدعم ملفات Excel (.xlsx, .xls) وملفات القيم المفصولة (.csv)
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* File loaded summary */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">
                  تم استخراج {previewItems.length} صف من الملف: {selectedFile?.name}
                </span>
              </div>
              <button
                onClick={() => {
                  setPreviewItems(null);
                  setSelectedFile(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                اختيار ملف آخر
              </button>
            </div>

            {/* Quick Preview Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto mb-4 text-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2">القطاع</th>
                    <th className="p-2">وصف الأعمال</th>
                    <th className="p-2">اسم الشارع</th>
                    <th className="p-2">المدة</th>
                    <th className="p-2">الفسح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewItems.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 font-bold">{row.sector}</td>
                      <td className="p-2 truncate max-w-[140px]">{row.workDescription || '-'}</td>
                      <td className="p-2">{row.streetName || '-'}</td>
                      <td className="p-2">{row.duration || '-'}</td>
                      <td className="p-2">{row.permit || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewItems.length > 5 && (
              <p className="text-xs text-slate-500 mb-4 text-center">
                + {previewItems.length - 5} صفوف إضافية تم قراءتها بالكامل
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          {previewItems && (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              اعتماد وإدراج {previewItems.length} صف في النظام
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
