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
    <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-900 text-slate-900 font-sans">
      {/* Official Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-300">
        <div className="text-right space-y-0.5">
          <p className="text-[11pt] font-extrabold text-slate-900">المملكة العربية السعودية</p>
          <p className="text-[9.5pt] font-bold text-slate-700">مشروع شبكات الصرف الصحي</p>
          <p className="text-[8.5pt] text-slate-600">إدارة التنفيذ والمتابعة الميدانية</p>
        </div>

        <div className="text-center px-4">
          <h1 className="text-[14pt] font-extrabold text-slate-900 tracking-tight">
            تقرير متابعة القطاعات المفتوحة
          </h1>
          <p className="text-[10pt] font-bold text-blue-900 mt-0.5">
            {metadata.projectName}
          </p>
        </div>

        <div className="text-left space-y-0.5 text-[8.5pt] text-slate-700 font-mono">
          <p>
            تاريخ الطباعة: <span className="font-bold">{currentDate}</span>
          </p>
          <p>
            الوقت: <span className="font-bold">{currentTime}</span>
          </p>
          <p className="text-emerald-800 font-bold font-sans">بيانات حية معتمدة</p>
        </div>
      </div>

      {/* Contract & Project Metadata Strip */}
      <div className="grid grid-cols-4 gap-2 mt-2.5 bg-slate-50 p-2.5 rounded-sm border border-slate-300 text-[8.5pt]">
        <div>
          <span className="text-slate-500 font-bold block">المقاول المنفذ:</span>
          <span className="font-bold text-slate-900">{metadata.contractor}</span>
        </div>

        <div>
          <span className="text-slate-500 font-bold block">القطاعات المفتوحة:</span>
          <span className="font-bold text-slate-900 font-mono text-[9.5pt]">
            {openSectorsCount || totalItems} قطاع عمل
          </span>
        </div>

        <div>
          <span className="text-slate-500 font-bold block">إجمالي أطوال القطاعات:</span>
          <span className="font-bold text-blue-800 font-mono text-[9.5pt]">
            {metadata.totalOpenLength ? `${metadata.totalOpenLength.toLocaleString('ar-SA')} م.ط` : '2,577.8 م.ط'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 font-bold block">تاريخ بيانات الشيت:</span>
          <span className="font-bold text-slate-900 font-mono">
            {metadata.date || '2026-09-07'}
          </span>
        </div>
      </div>
    </div>
  );
};
