import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  ExternalLink, 
  Code2, 
  Check, 
  Copy, 
  Edit2, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

interface ApiConnectionBarProps {
  apiUrl: string;
  isLoading: boolean;
  onRefresh: () => void;
  onUpdateUrl: (newUrl: string) => void;
  onOpenRawData: () => void;
  lastUpdated: string | null;
  totalSectors: number;
  openSectors: number;
  sourceSheetName?: string;
}

export const ApiConnectionBar: React.FC<ApiConnectionBarProps> = ({
  apiUrl,
  isLoading,
  onRefresh,
  onUpdateUrl,
  onOpenRawData,
  lastUpdated,
  totalSectors,
  openSectors,
  sourceSheetName = 'قطاعات مفتوحة',
}) => {
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onUpdateUrl(inputUrl.trim());
      setIsEditingUrl(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 mb-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Connection status and URL display */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>مصدر البيانات: متصل ومباشر بالرابط</span>
            </span>

            <span className="text-xs text-slate-500 flex items-center gap-1">
              <span>آخر جلب:</span>
              <strong className="text-slate-800 font-mono">{lastUpdated || 'الآن'}</strong>
            </span>

            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
              {totalSectors} قطاع من ورقة {sourceSheetName}
            </span>

            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              {openSectors} قطاع مفتوح
            </span>
          </div>

          {/* URL Box */}
          {isEditingUrl ? (
            <form onSubmit={handleSaveUrl} className="flex items-center gap-2 mt-2">
              <input
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-1.5 text-xs font-mono border border-blue-400 rounded-lg bg-blue-50/50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                تطبيق وجلب
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputUrl(apiUrl);
                  setIsEditingUrl(false);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                إلغاء
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 flex-1 min-w-0 overflow-hidden">
                <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate select-all direction-ltr text-left flex-1" title={apiUrl}>
                  {apiUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors shrink-0"
                  title="نسخ الرابط"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingUrl(true)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shrink-0"
                title="تغيير رابط الـ API"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <a
                href={apiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shrink-0"
                title="فتح الرابط في نافذة جديدة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
            title="إعادة جلب وقراءة أحدث البيانات من الرابط مباشرة"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'جاري الجلب...' : 'تحديث البيانات من الرابط'}</span>
          </button>

          <button
            onClick={onOpenRawData}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="فحص كائن الـ JSON المستلم مباشرة من الرابط"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>فحص JSON الرابط</span>
          </button>
        </div>
      </div>
    </div>
  );
};
