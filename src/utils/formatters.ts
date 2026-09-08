/**
 * دالة تنسيق عدد الأيام بدون أي فواصل عشرية (أرقام صحيحة فقط)
 * مثال:
 * 21.1 يوم -> 21 يوم
 * 16.1209 -> 16 يوم
 * 12.1 يوم -> 12 يوم
 */
export function formatDays(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '';
  
  if (typeof val === 'number') {
    if (isNaN(val)) return '';
    return `${Math.round(val)} يوم`;
  }

  const str = String(val).trim();
  if (!str) return '';

  // إذا كان النص مثل "21.1 يوم" أو "16.1"
  const match = str.match(/^([0-9]+)\.([0-9]+)\s*(.*)$/);
  if (match) {
    const num = Math.round(parseFloat(str));
    const suffix = match[3] || 'يوم';
    return `${num} ${suffix}`.trim();
  }

  // إذا كان رقم عشري بدون كلمة يوم
  if (!str.includes('يوم') && !isNaN(Number(str))) {
    return `${Math.round(Number(str))} يوم`;
  }

  // استبدال أي أرقام عشرية داخل النص متبوعة بـ يوم
  return str.replace(/([0-9]+)\.([0-9]+)\s*يوم/g, (_, intP, decP) => {
    return `${Math.round(parseFloat(`${intP}.${decP}`))} يوم`;
  });
}

/**
 * إرجاع عدد الأيام كرقم صحيح فقط بدون فواصل عشرية
 */
export function parseIntegerDays(val: number | string | undefined | null): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') {
    return !isNaN(val) ? Math.round(val) : undefined;
  }
  const parsed = parseFloat(String(val).replace(/[^\d.]/g, ''));
  return !isNaN(parsed) ? Math.round(parsed) : undefined;
}
