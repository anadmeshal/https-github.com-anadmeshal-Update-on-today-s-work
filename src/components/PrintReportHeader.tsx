import React from 'react';
import { ProjectMetadata } from '../types';

interface PrintReportHeaderProps {
  metadata: ProjectMetadata;
  totalItems: number;
  openSectorsCount: number;
}

export const PrintReportHeader: React.FC<PrintReportHeaderProps> = ({
  metadata,
  totalItems,
  openSectorsCount,
}) => {
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="hidden print:block mb-3 pb-2 border-b-2 border-slate-900 text-slate-900 font-sans">
      {/* Official Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-300">
        <div className="text-right space-y-0.5">
          <p className="text-[11pt] font-black text-slate-900 leading-tight">المملكة العربية السعودية</p>
          <p className="text-[9.5pt] font-extrabold text-blue-900">شركة المياه الوطنية - القطاع الأوسط (مدينة الرياض)</p>
          <p className="text-[8.5pt] text-slate-600">الإدارة العامة لمشاريع الصرف الصحي بمدينة الرياض</p>
        </div>

        <div className="text-center px-4">
          <h1 className="text-[13.5pt] font-black text-slate-900">
            تقرير المتابعة الميدانية للقطاعات المفتوحة وأعمال الحفر
          </h1>
          <p className="text-[10pt] font-bold text-blue-950 mt-0.5">
            {metadata.projectName}
          </p>
          <span className="inline-block mt-0.5 text-[7.5pt] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
            وثيقة رسمية معتمدة للاستشاري والمقاول
          </span>
        </div>

        <div className="text-left space-y-0.5 text-[8pt] text-slate-700 font-mono">
          <p>
            رقم العقد: <span className="font-bold text-slate-900">C-2024-AWL2-02</span>
          </p>
          <p>
            تاريخ الطباعة: <span className="font-bold text-slate-900">{currentDate}</span>
          </p>
          <p>
            الوقت: <span className="font-bold text-slate-900">{currentTime}</span>
          </p>
        </div>
      </div>

      {/* Contract & Project Metadata Strip */}
      <div className="grid grid-cols-5 gap-2 mt-2 bg-slate-50 p-2 rounded border border-slate-300 text-[8pt]">
        <div>
          <span className="text-slate-500 font-bold block">المقاول المنفذ:</span>
          <span className="font-extrabold text-slate-900">{metadata.contractor}</span>
        </div>

        <div>
          <span className="text-slate-500 font-bold block">القطاعات المفتوحة:</span>
          <span className="font-extrabold text-slate-900 font-mono text-[9pt]">
            {openSectorsCount || totalItems} قطاع عمل
          </span>
        </div>

        <div>
          <span className="text-slate-500 font-bold block">إجمالي أطوال الحفر:</span>
          <span className="font-extrabold text-blue-900 font-mono text-[9pt]">
            {metadata.totalOpenLength ? `${metadata.totalOpenLength.toLocaleString('ar-SA')} م.ط` : '2,577.8 م.ط'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 font-bold block">الاستشاري المشرف:</span>
          <span className="font-extrabold text-slate-900">دار الاستشارات الهندسية</span>
        </div>

        <div>
          <span className="text-slate-500 font-bold block">تاريخ الشيت الحي:</span>
          <span className="font-extrabold text-slate-900 font-mono">
            {metadata.date || '2026-09-07'}
          </span>
        </div>
      </div>
    </div>
  );
};
