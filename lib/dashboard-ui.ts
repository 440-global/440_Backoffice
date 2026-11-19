/** Compact ₦ display (millions / thousands). */
export function formatCompactNgn(n?: number | null): string {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  const v = Number(n);
  const abs = Math.abs(v);
  if (abs >= 1e9) return `₦${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `₦${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `₦${(v / 1e3).toFixed(1)}K`;
  return `₦${Math.round(v).toLocaleString("en-NG")}`;
}

export function formatPct(p?: number | null): string {
  if (p == null || !Number.isFinite(Number(p))) return "—";
  return `${Number(p) >= 0 ? "+" : ""}${Number(p).toFixed(1)}%`;
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)} mins ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export function activityCategoryDotClass(category: string): string {
  switch (category) {
    case "money":
      return "bg-emerald-400";
    case "pool":
      return "bg-orange-400";
    case "logistics":
      return "bg-sky-400";
    case "merchant":
      return "bg-violet-400";
    case "travel":
      return "bg-amber-400";
    default:
      return "bg-slate-400";
  }
}
