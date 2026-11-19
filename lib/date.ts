// lib/date.ts
export const toISODateTime = (
  dateStr: string,
  endOfDay = false,
): string | undefined => {
  if (!dateStr) return undefined;

  // If it's already a full ISO datetime, just return it
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) return dateStr;

  // Convert plain "YYYY-MM-DD" into full ISO datetime
  return endOfDay ? `${dateStr}T23:59:59.999Z` : `${dateStr}T00:00:00.000Z`;
};
