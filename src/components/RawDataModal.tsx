import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code2, Database, Layers } from 'lucide-react';

interface RawDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawEndpointData: any;
  apiUrl: string;
  lastUpdated: string | null;
}

export const RawDataModal: React.FC<RawDataModalProps> = ({
  isOpen,
  onClose,
  rawEndpointData,
  apiUrl,
  lastUpdated,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string>('all');

  if (!isOpen) return null;

  const sheets = rawEndpointData ? Object.keys(rawEndpointData) : [];

  const displayData = selectedSheet === 'all' 
    ? rawEndpointData 
    : (rawEndpointData ? { [selectedSheet]: rawEndpointData[selectedSheet] } : null);

  const formattedJson = displayData ? JSON.stringify(displayData, null, 2) : 'لا توجد استجابة خام متاحة';

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                فاحص بيانات الرابط المباشر (Google Apps Script API)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 truncate max-w-md font-mono">
                {apiUrl}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sheet Tabs & Controls */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-slate-500 font-bold ml-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              الأوراق (Sheets):
            </span>
            <button
              onClick={() => setSelectedSheet('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                selectedSheet === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              الكل ({sheets.length})
            </button>
            {sheets.map((sheet) => {
              const count = Array.isArray(rawEndpointData?.[sheet]) ? rawEndpointData[sheet].length : 0;
              return (
                <button
                  key={sheet}
                  onClick={() => setSelectedSheet(sheet)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors flex items-center gap-1 ${
                    selectedSheet === sheet
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  <span>{sheet}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-semibold flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ JSON'}</span>
            </button>
            <a
              href={apiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-semibold flex items-center gap-1 transition-colors"
            >
              <span>فتح الرابط مباشرة</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-emerald-400 direction-ltr text-left">
          <pre className="whitespace-pre-wrap break-all selection:bg-emerald-800 selection:text-white">
            {formattedJson}
          </pre>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>بيانات حية ومباشرة تم جلبها في: <strong className="font-mono text-slate-800">{lastUpdated || 'الآن'}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
