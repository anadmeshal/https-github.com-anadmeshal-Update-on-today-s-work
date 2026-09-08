import React, { useState } from 'react';
import { X, Code2, Copy, Check, Info } from 'lucide-react';

interface ScriptHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScriptHelperModal: React.FC<ScriptHelperModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const scriptCode = `// في ملف Google Sheets الخاص بك:
// اذهب إلى: إضافات (Extensions) > Apps Script
// استبدل كود doGet(e) بهذا الكود ليقوم بتصدير جميع الأعمدة:

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var result = {};
  
  sheets.forEach(function(sheet) {
    var data = sheet.getDataRange().getValues();
    if (!data || data.length === 0) return;
    
    // البحث عن صف العناوين الفعلي (الذي يحتوي على وصف، قطاع، شارع، إلخ)
    var headerRowIndex = 0;
    for (var r = 0; r < Math.min(data.length, 10); r++) {
      var rowStr = data[r].join(' ');
      if (rowStr.indexOf('وصف') > -1 || rowStr.indexOf('شارع') > -1 || rowStr.indexOf('قطاع') > -1 || rowStr.indexOf('فسح') > -1) {
        headerRowIndex = r;
        break;
      }
    }
    
    var headers = data[headerRowIndex];
    var rows = [];
    
    for (var i = headerRowIndex + 1; i < data.length; i++) {
      var row = data[i];
      var hasData = row.some(function(cell) { return cell !== '' && cell !== null; });
      if (!hasData) continue;
      
      var rowObj = {};
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j] ? String(headers[j]).trim() : ('عمود_' + (j + 1));
        rowObj[key] = row[j];
      }
      rows.push(rowObj);
    }
    
    result[sheet.getName()] = rows;
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: result
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 text-right relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">تحديث كود Google Apps Script لتصدير جميع الأعمدة</h3>
            <p className="text-xs text-slate-500">
              لماذا يظهر حالياً العمود الأول فقط وكيف يتم تصدير كامل الأعمدة بالرابط الحي
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-blue-900">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold mb-1">السبب التقني:</p>
              <p>
                في شيت Google الحالي، الصف الأول يحتوي على عنوان التاريخ أو دمج خلايا في الخلية الأولى A1 فقط، وبالتالي فإن سكريبت Google Apps Script الحالي اعتبر أن هناك عموداً واحداً فقط وتجاهل بقية الأعمدة (وصف الأعمال، الموقع، اسم الشارع، مدة التنفيذ، الفسح).
              </p>
            </div>
          </div>

          <p className="font-semibold text-slate-800">
            خطوات التحديث البسيطة (خلال دقيقة واحدة):
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 mr-2">
            <li>افتح جدول البيانات الخاص بك في Google Sheets.</li>
            <li>اضغط من القائمة العلوية على: <strong>إضافات (Extensions) &gt; Apps Script</strong>.</li>
            <li>انسخ الكود البرمجي التالي وضعه مكان دالة <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">doGet</code> الحالية:</li>
          </ol>

          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 text-xs font-semibold bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors flex items-center gap-1 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الكود</span>
                </>
              )}
            </button>
            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed text-left dir-ltr max-h-56">
              {scriptCode}
            </pre>
          </div>

          <p className="text-slate-600 mr-2">
            4. اضغط <strong>نشر (Deploy) &gt; إدارة عمليات النشر (Manage Deployments) &gt; تعديل وإصدار نسخة جديدة (New Version)</strong>.
          </p>
          <p className="text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            ✓ فور ذلك، اضغط زر &quot;تحديث الرابط&quot; في هذا الداشبورد وستظهر جميع الأعمدة تلقائياً، أو يمكنك رفع ملف Excel مباشرة الآن بدون تعديل السكريبت!
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
