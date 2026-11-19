import type { AdminRfqActivity, AdminRfqOrder, AdminRfqOrderLine } from "@/types/types";

export const RFQ_WORKFLOW_CLASS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
  REVIEWING: "bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100",
  QUOTED: "bg-violet-50 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100",
  APPROVED: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100",
  AWAITING_PAYMENT: "bg-orange-50 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100",
  PAID: "bg-green-50 text-green-900 dark:bg-green-950/50 dark:text-green-100",
  CONVERTED: "bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-100",
  CANCELLED: "bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-100",
};

/** Table / header: YYYY-MM-DD HH:mm:ss */
export function fmtRfqSubmissionDate(raw?: string) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

export function rfqContact(order: AdminRfqOrder) {
  const src = (order.Rfq ?? order.rfq ?? {}) as Record<string, unknown>;
  const name =
    (src.fullName as string | undefined) ??
    (src.name as string | undefined) ??
    (order.customerName as string | undefined) ??
    "—";
  const email =
    (src.email as string | undefined) ?? (order.customerEmail as string | undefined) ?? "—";
  const phone = (src.phone as string | undefined) ?? "—";
  const address = (src.address as string | undefined) ?? "—";
  return { name, email, phone, address };
}

export function rfqWorkflow(order?: AdminRfqOrder | null): string {
  const fromWf = String(order?.workflowStatus ?? order?.workflow ?? "").toUpperCase();
  if (fromWf) return fromWf;
  return String(order?.status ?? "").toUpperCase();
}

export function rfqCurrency(order?: AdminRfqOrder | null): string {
  return (order?.quotedCurrency ?? order?.currency ?? "NGN").toString();
}

export function rfqLines(order?: AdminRfqOrder | null): AdminRfqOrderLine[] {
  if (!order) return [];
  if (Array.isArray(order.rfq_products)) return order.rfq_products;
  if (Array.isArray(order.rfqProducts)) return order.rfqProducts;
  if (Array.isArray(order.rfqProductLines)) return order.rfqProductLines;
  if (Array.isArray(order.products)) return order.products;
  return [];
}

/** Public RFQ id: serialNumber_serialCode (e.g. 9380_065) */
export function rfqDisplayId(order: AdminRfqOrder): string {
  const sn =
    order.serialNumber != null && String(order.serialNumber).trim() !== ""
      ? String(order.serialNumber).trim()
      : "";
  const sc =
    order.serialCode != null && String(order.serialCode).trim() !== ""
      ? String(order.serialCode).trim()
      : "";
  if (sn && sc) return `${sn}_${sc}`;
  if (sn) return sn;
  if (sc) return sc;
  return `#${order.id}`;
}

export function rfqProductLineCount(order: AdminRfqOrder): number {
  return rfqLines(order).length;
}

export function rfqStatusLabel(order: AdminRfqOrder): string {
  const raw = (order.status ?? order.workflowStatus ?? "").toString();
  return raw ? raw.toLowerCase().replace(/_/g, " ") : "—";
}

const fmtMoney = (n?: number | null, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(n ?? 0));

export { fmtMoney as fmtRfqMoney };

export function rfqWhatsAppHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  const intl = digits.startsWith("234")
    ? digits
    : digits.startsWith("0")
      ? `234${digits.slice(1)}`
      : digits.length >= 10
        ? `234${digits.replace(/^0+/, "")}`
        : digits;
  return `https://wa.me/${intl}`;
}

export function collectRfqImageUrls(order: AdminRfqOrder): string[] {
  const lines = rfqLines(order);
  const out: string[] = [];
  for (const line of lines) {
    const imgs = line.images;
    if (!Array.isArray(imgs)) continue;
    for (const img of imgs) {
      const url = img?.trim();
      if (url) out.push(url);
    }
  }
  return out;
}

/** Audit API may send `createdAt` or `created_at`. */
export function rfqActivityCreatedAt(a: AdminRfqActivity): string | undefined {
  const r = a as Record<string, unknown>;
  const raw = a.createdAt ?? r.created_at;
  return typeof raw === "string" ? raw : undefined;
}

export function isRfqCommentAuditAction(a: AdminRfqActivity): boolean {
  return String(a.action ?? "").toUpperCase() === "COMMENT";
}

/** Display name: nested `adminUser.name` or flat `adminName`. */
export function rfqActivityAdminName(a: AdminRfqActivity): string | undefined {
  const u = a.adminUser;
  if (u && typeof u === "object" && u !== null) {
    const n = String((u as { name?: string }).name ?? "").trim();
    if (n) return n;
  }
  const flat = String(a.adminName ?? "").trim();
  return flat || undefined;
}

/** Comment text on audit rows (`action: COMMENT`) — API stores copy in `newValue.comment`. */
export function rfqCommentBodyFromActivity(a: AdminRfqActivity): string {
  const r = a as Record<string, unknown>;
  const nv = (a.newValue ?? r.newValue) as unknown;
  if (nv && typeof nv === "object" && nv !== null && "comment" in nv) {
    const fromNv = String((nv as { comment?: unknown }).comment ?? "").trim();
    if (fromNv) return fromNv;
  }
  const meta = a.metadata;
  let fromMeta = "";
  if (meta && typeof meta === "object" && meta !== null && "comment" in meta) {
    fromMeta = String((meta as { comment?: unknown }).comment ?? "").trim();
  }
  const direct = String(a.message ?? r.comment ?? "").trim();
  return (direct || fromMeta).trim();
}

/** One-line summary for activity list (quote, approve, comment body, etc.). */
export function rfqActivitySummaryLine(a: AdminRfqActivity): string {
  if (isRfqCommentAuditAction(a)) {
    const t = rfqCommentBodyFromActivity(a);
    return t || "Comment";
  }
  const act = String(a.action ?? "Activity").replace(/_/g, " ");
  const msg = String(a.message ?? "").trim();
  if (msg) return `${act}: ${msg}`;
  return act;
}
