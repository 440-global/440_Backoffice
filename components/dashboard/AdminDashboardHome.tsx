"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useGetDashboardRecent, useGetDashboardSummary } from "@/api/dashboard";
import { Card, Button, Badge, Dropdown } from "@/components/ui";
import {
  formatCompactNgn,
  formatPct,
  formatRelativeTime,
  activityCategoryDotClass,
} from "@/lib/dashboard-ui";
import type { AdminDashboardQuickAction, AdminDashboardScope, AdminDashboardSecondaryKpis } from "@/types/types";
import {
  RiLoopLeftLine,
  RiBox3Line,
  RiShipLine,
  RiTeamLine,
  RiMoneyDollarCircleLine,
  RiShieldCheckFill,
  RiCalendar2Line,
  RiCalculatorLine,
  RiArrowUpLine,
} from "react-icons/ri";
import { RevenueByWeekChart } from "./RevenueByWeekChart";
import { DashboardDetailOverview } from "./DashboardDetailOverview";
import { useCan } from "@/hooks/use-can";
import WelcomeCard from "./WelcomeCard";

const QUICK_PATH: Record<string, string> = {
  restart_bale: "/dashboard/bales",
  bale: "/dashboard/bales",
  add_product: "/dashboard/products",
  product: "/dashboard/products",
  update_shipment: "/dashboard/orders",
  shipment: "/dashboard/orders",
  merchant: "/dashboard/markets",
  view_merchants: "/dashboard/markets",
  finance: "/dashboard/finance",
  refunds: "/dashboard/finance/refunds",
  manual_entry: "/dashboard/finance/manual",
};

function quickActionHref(a: AdminDashboardQuickAction): string {
  if (a.href) return a.href;
  if (a.route) return a.route.startsWith("/") ? a.route : `/${a.route}`;
  const k = `${a.key ?? ""} ${a.iconKey ?? ""}`.trim().toLowerCase().replace(/\s+/g, "_");
  for (const [pat, path] of Object.entries(QUICK_PATH)) {
    if (k.includes(pat)) return path;
  }
  return "/dashboard";
}

function QuickIcon({ iconKey }: { iconKey?: string }) {
  const k = (iconKey ?? "").toLowerCase();
  if (k.includes("ship") || k.includes("cargo")) return <RiShipLine className="text-2xl text-sky-400" />;
  if (k.includes("merchant") || k.includes("person") || k.includes("user"))
    return <RiTeamLine className="text-2xl text-sky-400" />;
  if (k.includes("product") || k.includes("box")) return <RiBox3Line className="text-2xl text-amber-700" />;
  if (k.includes("money") || k.includes("finance")) return <RiMoneyDollarCircleLine className="text-2xl text-amber-400" />;
  if (k.includes("loop") || k.includes("restart") || k.includes("bale"))
    return <RiLoopLeftLine className="text-2xl text-emerald-400" />;
  return <RiLoopLeftLine className="text-2xl text-(--primary)" />;
}

const SECONDARY_KEYS: { key: keyof AdminDashboardSecondaryKpis; label: string }[] = [
  { key: "avgPoolFillRatePct", label: "Avg pool fill rate" },
  { key: "poolsCompletedAllTime", label: "Pools completed" },
  { key: "failedPoolsAllTime", label: "Failed pools" },
  { key: "failedPoolsRefundNgnApprox", label: "Failed pools (refunds approx.)" },
  { key: "activeSuppliers", label: "Active suppliers" },
  { key: "inTransitShipments", label: "In-transit shipments" },
  { key: "refundsNeedingAttention", label: "Refunds needing attention" },
];

function formatSecondaryValue(key: string, value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    if (key.includes("Ngn") || key === "failedPoolsRefundNgnApprox") return formatCompactNgn(value);
    if (key === "avgPoolFillRatePct") return `${value}% avg`;
    return value.toLocaleString("en-NG");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }
  return String(value);
}

function formatRefundsAttention(raw: unknown): string {
  if (raw == null) return "—";
  if (typeof raw === "number") return raw.toLocaleString("en-NG");
  if (typeof raw === "string") return raw;
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof o.count === "number") parts.push(`${o.count} pending`);
    if (typeof o.totalNgn === "number") parts.push(formatCompactNgn(o.totalNgn));
    if (parts.length) return parts.join(" · ");
    try {
      return JSON.stringify(raw);
    } catch {
      return "—";
    }
  }
  return String(raw);
}

function TrendPill({ pct }: { pct?: number | null }) {
  if (pct == null || !Number.isFinite(Number(pct))) {
    return <span className="text-xs text-(--muted)">No prior month compare</span>;
  }
  const up = Number(pct) >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}>
      <RiArrowUpLine className={up ? "" : "rotate-180"} />
      {formatPct(pct)} vs last month
    </span>
  );
}

export default function AdminDashboardHome() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedDates, setAppliedDates] = useState<{ startDate?: string; endDate?: string }>({});
  const [recentLimit, setRecentLimit] = useState(20);

  const canViewAnalytics = useCan("analytics:view");

  const summaryParams = useMemo(() => {
    const keys = Object.keys(appliedDates);
    return keys.length ? appliedDates : undefined;
  }, [appliedDates]);

  const { data: summary, isPending: summaryPending, error: summaryError } = useGetDashboardSummary(summaryParams);
  const { data: recent, isPending: recentPending, error: recentError } = useGetDashboardRecent({ limit: recentLimit });

  const scope: AdminDashboardScope | undefined = summary?.scope;
  const money = summary?.primaryKpis?.money;
  const orders = summary?.primaryKpis?.orders;
  const secondary = summary?.secondaryKpis;
  const revenueWeek = summary?.revenueByWeek;
  const showMoney = scope === "full" || scope === "finance";
  const revenueSection = scope === "full" || scope === "finance";
  const showRevenueChart = revenueSection && (revenueWeek?.length ?? 0) > 0;
  const showOrdersKpis = scope === "full" || scope === "operations";
  const showDateFilter = scope === "full";
  const detail = summary?.detail;

  const handleApply = () => {
    setAppliedDates({
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setAppliedDates({});
  };

  if (!canViewAnalytics) return <WelcomeCard />;

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h3 className="text-2xl font-bold">Admin dashboard</h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-(--muted)">
            <RiShieldCheckFill />
            <span>
              {scope ? (
                <>
                  Scope: <Badge variant="secondary">{scope}</Badge>
                  {summary?.currency ? ` · ${summary.currency}` : ""}
                </>
              ) : (
                "Loading…"
              )}
            </span>
          </div>
        </div>

        {showDateFilter ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <RiCalendar2Line className="text-(--muted)" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-(--table-border) bg-(--card) px-3 py-2 text-sm focus:outline-(--primary)"
              />
              <span className="text-sm text-(--muted)">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-(--table-border) bg-(--card) px-3 py-2 text-sm focus:outline-(--primary)"
              />
            </div>
            <Button
              primary
              className="rounded-lg! px-4! py-2!"
              onClick={handleApply}
            >
              Apply
            </Button>
            {Object.keys(appliedDates).length > 0 && (
              <Button
                className="rounded-lg! border border-(--table-border) bg-(--card)! px-4! py-2! text-(--text)!"
                onClick={handleClear}
              >
                Clear
              </Button>
            )}
            <span className="text-xs text-(--muted)">
              Affects legacy detail for super admin
            </span>
          </div>
        ) : null}
      </div>

      {summaryError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-100/30 p-4 text-red-700">
          Failed to load dashboard summary
        </div>
      ) : null}

      {/* Quick actions */}
      {summary?.quickActions?.length ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {summary.quickActions.map((a, i) => (
            <Link
              key={`${a.label}-${i}`}
              href={quickActionHref(a)}
              className="block"
            >
              <Card className="shadow-none! h-full transition hover:border-(--primary)/40">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-900/40 p-3">
                    <QuickIcon iconKey={a.iconKey ?? a.key} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{a.label}</p>
                    <p className="mt-1 text-xs text-(--muted)">Open</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}

      {/* Primary KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {showMoney && (
          <Card className="shadow-none! border-l-4 border-l-amber-500/80 rounded-none! rounded-r-2xl!">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-(--muted)">
                  Total revenue
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-400">
                  {summaryPending
                    ? "—"
                    : formatCompactNgn(money?.totalRevenueNgn)}
                </p>
                <div className="mt-2">
                  <TrendPill pct={money?.revenueChangePctVsPriorMonth} />
                </div>
              </div>
              <RiMoneyDollarCircleLine className="text-3xl text-amber-500/60" />
            </div>
            {money?.thisMonthRevenueNgn != null && (
              <p className="mt-3 text-xs text-(--muted)">
                This month {formatCompactNgn(money.thisMonthRevenueNgn)}
                {money.priorMonthRevenueNgn != null
                  ? ` · Prior ${formatCompactNgn(money.priorMonthRevenueNgn)}`
                  : ""}
              </p>
            )}
            {scope === "full" && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-(--table-border)/60 pt-3 text-xs text-(--muted)">
                <span>
                  Net:{" "}
                  {summaryPending
                    ? "—"
                    : formatCompactNgn(money?.netInflowMinusOutflowNgn)}
                </span>
                <span>
                  Refunded:{" "}
                  {summaryPending
                    ? "—"
                    : formatCompactNgn(money?.totalRefundedNgn)}
                </span>
              </div>
            )}
          </Card>
        )}

        {showOrdersKpis && (
          <Card className="shadow-none! border-l-4 border-l-emerald-500/80 rounded-none! rounded-r-2xl!">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-(--muted)">
                  Active bales
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-400">
                  {summaryPending
                    ? "—"
                    : orders?.activeBales != null
                      ? orders.activeBales.toLocaleString("en-NG")
                      : "—"}
                </p>
                <p className="mt-2 text-xs text-(--muted)">
                  {(orders?.balesClosingWithin6Hours ?? 0) > 0
                    ? `${orders?.balesClosingWithin6Hours} closing in <6h`
                    : "None closing in <6h"}
                </p>
                <p className="text-xs font-medium text-emerald-400/90">
                  ↑ {orders?.newBalesLast7Days ?? 0} new (7d)
                </p>
              </div>
              <RiLoopLeftLine className="text-3xl text-emerald-500/60" />
            </div>
          </Card>
        )}

        {showOrdersKpis && (
          <Card className="shadow-none! border-l-4 border-l-sky-500/80 rounded-none! rounded-r-2xl!">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-(--muted)">
                  Total merchants
                </p>
                <p className="mt-2 text-3xl font-bold text-sky-400">
                  {summaryPending
                    ? "—"
                    : orders?.totalMerchants != null
                      ? orders.totalMerchants.toLocaleString("en-NG")
                      : "—"}
                </p>
                <p className="mt-2 text-xs text-(--muted)">
                  + {orders?.merchantsJoinedThisWeek ?? 0} joined this week
                </p>
              </div>
              <RiTeamLine className="text-3xl text-sky-500/60" />
            </div>
          </Card>
        )}

        {showOrdersKpis && (
          <Card className="shadow-none! border-l-4 border-l-yellow-500/80 rounded-none! rounded-r-2xl!">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-(--muted)">
                  Total checkouts
                </p>
                <p className="mt-2 text-3xl font-bold text-yellow-300">
                  {summaryPending
                    ? "—"
                    : orders?.totalCheckouts != null
                      ? orders.totalCheckouts.toLocaleString("en-NG")
                      : "—"}
                </p>
                <p className="mt-2 text-xs text-(--muted)">
                  + {orders?.checkoutsLast24h ?? 0} in last 24h
                </p>
              </div>
              <RiCalculatorLine className="text-3xl text-yellow-500/50" />
            </div>
          </Card>
        )}

        {scope === "finance" && (
          <>
            <Card className="shadow-none!">
              <p className="text-xs font-semibold uppercase text-(--muted)">
                Net inflow − outflow
              </p>
              <p className="mt-2 text-2xl font-bold">
                {summaryPending
                  ? "—"
                  : formatCompactNgn(money?.netInflowMinusOutflowNgn)}
              </p>
            </Card>
            <Card className="shadow-none!">
              <p className="text-xs font-semibold uppercase text-(--muted)">
                Total refunded
              </p>
              <p className="mt-2 text-2xl font-bold text-rose-300">
                {summaryPending
                  ? "—"
                  : formatCompactNgn(money?.totalRefundedNgn)}
              </p>
            </Card>
            <Card className="shadow-none!">
              <p className="text-xs font-semibold uppercase text-(--muted)">
                Refunds queue
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                {summaryPending
                  ? "—"
                  : formatRefundsAttention(money?.refundsNeedingAttention)}
              </p>
            </Card>
          </>
        )}
      </div>

      {/* Secondary KPIs */}
      {secondary && (
        <div className="mb-6 flex flex-wrap gap-3">
          {SECONDARY_KEYS.map(({ key, label }) => {
            const v = secondary[key];
            if (v === undefined) return null;
            const display = formatSecondaryValue(key, v);
            const danger =
              key === "failedPoolsAllTime" ||
              key === "failedPoolsRefundNgnApprox";
            return (
              <Card
                key={key}
                className="shadow-none! min-w-35 flex-1 basis-[calc(20%-0.75rem)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-(--muted)">
                  {label}
                </p>
                <p
                  className={`mt-1 text-xl font-bold ${danger ? "text-rose-400" : ""}`}
                >
                  {display}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Chart + activity */}
      <div
        className={`mb-8 grid grid-cols-1 gap-4 ${revenueSection || scope === "operations" ? "lg:grid-cols-3" : ""}`}
      >
        {revenueSection && showRevenueChart ? (
          <Card className="shadow-none! lg:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Revenue by week</h3>
                <p className="text-xs uppercase tracking-wide text-(--muted)">
                  Last 8 weeks · NGN
                </p>
              </div>
              <Link
                href="/dashboard/finance"
                className="text-sm font-medium text-(--primary) hover:underline"
              >
                Export →
              </Link>
            </div>
            {revenueWeek ? <RevenueByWeekChart rows={revenueWeek} /> : null}
          </Card>
        ) : revenueSection ? (
          <Card className="shadow-none! lg:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Revenue by week</h3>
                <p className="text-xs uppercase tracking-wide text-(--muted)">
                  Last 8 weeks · NGN
                </p>
              </div>
            </div>
            <p className="text-sm text-(--muted)">
              No weekly revenue data yet.
            </p>
          </Card>
        ) : scope === "operations" ? (
          <Card className="shadow-none! lg:col-span-2">
            <h3 className="text-lg font-bold">Revenue by week</h3>
            <p className="mt-2 text-sm text-(--muted)">
              Revenue charts are not shown for operations, support, or read-only
              roles.
            </p>
          </Card>
        ) : null}

        <Card
          className={`shadow-none! ${revenueSection || scope === "operations" ? "" : "lg:col-span-full"}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">Live activity</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                live
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-(--muted)">Limit</span>
              <Dropdown
                options={[10, 20, 50]}
                value={recentLimit}
                onChange={(v) => setRecentLimit(v)}
              />
            </div>
          </div>

          {recentError ? (
            <p className="text-sm text-red-600">Failed to load activity</p>
          ) : recentPending ? (
            <p className="text-sm text-(--muted)">Loading…</p>
          ) : recent?.items?.length ? (
            <ul className="max-h-[min(420px,60vh)] space-y-3 overflow-y-auto pr-1">
              {recent.items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 border-b border-(--table-border)/50 pb-3 last:border-0"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${activityCategoryDotClass(item.category)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{item.title}</p>
                    {item.subtitle ? (
                      <p className="text-xs text-(--muted)">{item.subtitle}</p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-(--muted)">
                      <span>{formatRelativeTime(item.occurredAt)}</span>
                      {item.amountNgn != null ? (
                        <span className="font-medium text-slate-200">
                          {formatCompactNgn(item.amountNgn)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-(--muted)">No recent activity</p>
          )}
          <div className="mt-4 text-right">
            <Link
              href={
                showMoney ? "/dashboard/finance/records" : "/dashboard/orders"
              }
              className="text-sm font-medium text-(--primary) hover:underline"
            >
              View all →
            </Link>
          </div>
        </Card>
      </div>

      {scope === "full" && detail != null && (
        // <details className="rounded-xl border border-(--table-border) bg-(--card) p-4">
        //   <summary className="cursor-pointer text-sm font-bold">Legacy detail (super admin)</summary>
        //   <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-950/50 p-3 text-xs text-slate-300">
        //     {JSON.stringify(detail, null, 2)}
        //   </pre>
        // </details>

        <div className="rounded-xl border border-(--table-border) bg-(--card) p-4">
          <h3 className="mb-1 text-lg font-bold">Legacy detail (super admin)</h3>
          <p className="mb-3 text-sm text-(--muted)">
            This is the legacy detail object for super admin users. It is not used for any other roles, and is not guaranteed to be complete or accurate. It is provided for reference only.
          </p>
          <DashboardDetailOverview detail={detail} />
        </div>
      )}
    </>
  );
}
