import { fmt, fmtDateTime } from "./funcs";

/**
 * Money, number and date formatting for the admin screens, in one place. Several files used to carry their
 * own copy of `fmt` / `formatNgn` / `formatPrice` with slightly different rules.
 */

export { fmt as fmtNgn, fmtDateTime };

export const fmtUsd = (n: number | undefined | null): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
    n ?? 0,
  );

export const fmtNumber = (n: number | undefined | null, maximumFractionDigits = 2): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(n ?? 0);

/** Money in the currency a record is stored in, using that currency's own symbol when it has one. */
export const fmtMoney = (n: number | undefined | null, currency?: string | null): string => {
  const amount = fmtNumber(n);
  const symbol = currency?.trim();
  if (!symbol) return amount;
  return symbol.length <= 2 ? `${symbol}${amount}` : `${symbol} ${amount}`;
};

export const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NG", { dateStyle: "medium" });
};

/** Value for an <input type="datetime-local"> from an ISO string, in the viewer's local time. */
export const toLocalInputValue = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** ISO string (UTC) for what the admin typed in a datetime-local or date box, read as their local time. */
export const fromLocalInputValue = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};
