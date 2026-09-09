import React from 'react';
import { WorkItem, ProjectMetadata } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';

interface ChartsViewProps {
  items: WorkItem[];
  metadata: ProjectMetadata;
}

const COLORS = ['#059669', '#2563eb', '#d97706', '#dc2626', '#64748b'];

export const ChartsView: React.FC<ChartsViewProps> = ({ items, metadata }) => {
  // Sector Status breakdown
  const openCount = items.filter(
    (i) => i.status?.includes('مفتوح') || i.status?.includes('جاري')
  ).length || metadata.openSectorsCount;

  const totalCount = items.length || metadata.totalCount;
  const otherCount = Math.max(0, totalCount - openCount);

  const statusData = [
    { name: 'قطاعات مفتوحة (جاري العمل)', value: openCount },
    { name: 'قطاعات مسجلة / أخرى', value: otherCount },
  ];

  // Streets breakdown
  const streetCounts: Record<string, number> = {};
  items.forEach((item) => {
    const street = item.streetName?.trim() || item.location?.trim() || 'حي العوالي (العام)';
    streetCounts[street] = (streetCounts[street] || 0) + 1;
  });

  const streetData = Object.entries(streetCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Permits breakdown
  const withPermitCount = items.filter((i) => i.permit?.trim()).length;
  const withoutPermitCount = totalCount - withPermitCount;

  const permitData = [
    { name: 'يوجد فسح مسجل', value: withPermitCount },
    { name: 'بدون فسح مسجل', value: withoutPermitCount },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* 1. القطاعات المفتوحة والنشاط */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">حالة القطاعات (مفتوحة / مسجلة)</h3>
          </div>
          <span className="text-xs text-slate-400">إجمالي {totalCount} قطاع</span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                <Cell fill="#059669" />
                <Cell fill="#334155" />
              </Pie>
              <Tooltip
                formatter={(value: any) => [`${value} قطاع`, 'العدد']}
                contentStyle={{ direction: 'rtl', borderRadius: '8px', backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
              />
              <Legend verticalAlign="bottom" height={36} formatter={(val) => <span className="text-slate-300 text-xs">{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. توزيع الأعمال حسب الشارع أو الموقع */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">توزيع الأعمال حسب الشارع والموقع</h3>
          </div>
          <span className="text-xs text-slate-400">البيانات الموثقة</span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={streetData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" interval={0} angle={-15} textAnchor="end" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#475569" />
              <Tooltip
                formatter={(value: any) => [`${value} عمل / قطاع`, 'العدد']}
                contentStyle={{ direction: 'rtl', borderRadius: '8px', backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
              />
              <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} name="عدد الأعمال" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
