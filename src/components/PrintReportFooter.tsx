import React from 'react';

export const PrintReportFooter: React.FC = () => {
  return (
    <div className="hidden print:block mt-6 pt-4 border-t-2 border-slate-400 text-slate-800 text-[8.5pt]">
      <div className="grid grid-cols-3 gap-6 text-center mb-4">
        {/* Site Engineer (Contractor) */}
        <div className="border border-slate-300 rounded p-3 bg-slate-50/50">
          <p className="font-extrabold text-slate-900 mb-1">مهندس الموقع (المقاول)</p>
          <p className="text-slate-600 text-[8pt] mb-6">شركة نظم البيئة للمقاولات</p>
          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
          <p className="text-[7.5pt] text-slate-500">التوقيع والختم</p>
        </div>

        {/* Supervision Engineer (Consultant) */}
        <div className="border border-slate-300 rounded p-3 bg-slate-50/50">
          <p className="font-extrabold text-slate-900 mb-1">مهندس الإشراف (الاستشاري)</p>
          <p className="text-slate-600 text-[8pt] mb-6">استشاري المشروع</p>
          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
          <p className="text-[7.5pt] text-slate-500">التوقيع والاعتماد</p>
        </div>

        {/* Project Manager */}
        <div className="border border-slate-300 rounded p-3 bg-slate-50/50">
          <p className="font-extrabold text-slate-900 mb-1">مدير المشروع</p>
          <p className="text-slate-600 text-[8pt] mb-6">إدارة مشاريع الصرف الصحي</p>
          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
          <p className="text-[7.5pt] text-slate-500">الاعتماد النهائي</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[7.5pt] text-slate-500 pt-2 border-t border-slate-200">
        <span>تم استخراج هذا التقرير تلقائياً من نظام متابعة القطاعات الميدانية وفق بيانات الشيت الفعلي المعتمد</span>
        <span>صفحة تقرير رسمي</span>
      </div>
    </div>
  );
};
