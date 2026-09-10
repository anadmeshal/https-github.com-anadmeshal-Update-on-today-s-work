import React from 'react';

export const PrintReportFooter: React.FC = () => {
  return (
    <div className="hidden print:block mt-6 pt-3 border-t-2 border-slate-900 text-slate-800 text-[8.5pt] break-inside-avoid">
      <div className="grid grid-cols-3 gap-5 text-center mb-3">
        {/* Site Engineer (Contractor) */}
        <div className="border border-slate-400 rounded-sm p-3 bg-white">
          <p className="font-black text-slate-900 mb-0.5">مهندس الموقع (المقاول المنفذ)</p>
          <p className="text-slate-600 text-[8pt] mb-5">شركة نظم البيئة</p>
          <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto mb-1"></div>
          <p className="text-[7.5pt] text-slate-500 font-bold">التوقيع والختم المعتمد</p>
        </div>

        {/* Supervision Engineer (Consultant) */}
        <div className="border border-slate-400 rounded-sm p-3 bg-white">
          <p className="font-black text-slate-900 mb-0.5">مهندس الإشراف وضبط الجودة (الاستشاري)</p>
          <p className="text-slate-600 text-[8pt] mb-5">دار الاستشارات الهندسية المشرف</p>
          <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto mb-1"></div>
          <p className="text-[7.5pt] text-slate-500 font-bold">التوقيع والمصادقة الفنية</p>
        </div>

        {/* Project Manager */}
        <div className="border border-slate-400 rounded-sm p-3 bg-white">
          <p className="font-black text-slate-900 mb-0.5">مدير إدارة مشاريع الصرف الصحي (المالك)</p>
          <p className="text-slate-600 text-[8pt] mb-5">شركة المياه الوطنية - القطاع الأوسط (مدينة الرياض)</p>
          <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto mb-1"></div>
          <p className="text-[7.5pt] text-slate-500 font-bold">الاعتماد النهائي والختم الرسمي</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[7.5pt] text-slate-600 pt-2 border-t border-slate-300">
        <span>نظام متابعة الأعمال والقطاعات الميدانية • مستخرج رسمياً من قاعدة البيانات الحية المعتمدة</span>
        <span className="font-bold text-slate-900">وثيقة رسمية معتمدة للطباعة والحفظ</span>
      </div>
    </div>
  );
};
