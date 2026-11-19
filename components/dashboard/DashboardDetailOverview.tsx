"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { formatCompactNgn } from "@/lib/dashboard-ui";
import { Card } from "../ui";

// ---- Types matching the payload ----

type CategoryStat = { total: number; count: number };
type StatusStat = { total: number; count: number };

type DashboardDetail = {
  timeWindow?: { startDate: string | null; endDate: string | null };
  finance?: {
    totalRevenue: number;
    totalInflow: number;
    totalOutflow: number;
    inflowMinusOutflow: number;
    totalRefunded: number;
    netRevenue: number;
    totalPending: number;
    totalFailed: number;
    transactionCount: number;
    byCategory: Record<string, CategoryStat>;
    byStatus: Record<string, StatusStat>;
    collections: { overdueTotal: number; pendingTotal: number };
  };
  bales?: { total: number; byStatus: Record<string, number> };
  orders?: { total: number; byStatus: Record<string, number> };
  shipments?: { total: number; byStatus: Record<string, number> };
  serviceOrders?: { total: number; byStatus: Record<string, number> };
  refunds?: { needsAttentionCount: number; needsAttentionTotalAmount: number };
  products?: { totalProducts: number; activeProducts: number };
  services?: { activeByType: Record<string, number> };
};

type Props = {
  detail: DashboardDetail;
};

// ---- Shared bits ----

const BLUE = "#2a78d6";
const ORANGE = "#f97316";
const GREEN = "#22c55e";
const SLATE = "#94a3b8";
const PIE_COLORS = [BLUE, ORANGE, GREEN, "#a855f7", "#ef4444", "#eab308"];

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-(--table-border) bg-(--card) p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${accent ? "text-orange-500" : "text-(--text)"}`}
      >
        {value}
      </p>
    </div>
  );
}

function toChartArray<
  T extends Record<string, number | CategoryStat | StatusStat>,
>(record: T, valueKey?: "total" | "count") {
  return Object.entries(record).map(([key, value]) => ({
    name: key,
    value:
      typeof value === "number"
        ? value
        : valueKey
          ? (value as CategoryStat)[valueKey]
          : (value as CategoryStat).total,
  }));
}

// ---- Main component ----

export const DashboardDetailOverview = ({ detail }: Props) => {
  const { finance, bales, orders, serviceOrders, products, services } = detail;

  const categoryData = toChartArray(finance!.byCategory, "total").filter(
    (d) => d.value !== 0,
  );
  const statusPieData = toChartArray(finance!.byStatus, "total");
  const balesData = toChartArray(bales!.byStatus);
  const ordersData = toChartArray(orders!.byStatus);
  const serviceOrdersData = toChartArray(serviceOrders!.byStatus);
  const servicesData = toChartArray(services!.activeByType);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCompactNgn(finance!.totalRevenue)}
        />
        <StatCard
          label="Net Revenue"
          value={formatCompactNgn(finance!.netRevenue)}
        />
        <StatCard
          label="Total Inflow"
          value={formatCompactNgn(finance!.totalInflow)}
        />
        <StatCard
          label="Total Outflow"
          value={formatCompactNgn(finance!.totalOutflow)}
        />
        <StatCard
          label="Pending"
          value={formatCompactNgn(finance!.totalPending)}
          accent={finance!.totalPending > 0}
        />
        <StatCard
          label="Refunded"
          value={formatCompactNgn(finance!.totalRefunded)}
        />
        <StatCard
          label="Overdue Collections"
          value={formatCompactNgn(finance!.collections.overdueTotal)}
          accent={finance!.collections.overdueTotal > 0}
        />
        <StatCard
          label="Transactions"
          value={String(finance!.transactionCount)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by category */}
        <Card title="Revenue by Category" className="shadow-none">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={categoryData}
              margin={{ top: 0, right: 0, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, angle: -25, textAnchor: "end" }}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => formatCompactNgn(Number(v))}
              />
              <Tooltip
                formatter={(value) => [
                  formatCompactNgn(Number(value)),
                  "Total",
                ]}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {categoryData.map((d, i) => (
                  <Cell key={d.name} fill={d.value < 0 ? ORANGE : BLUE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Transactions by status (value split) */}
        <Card title="Transaction Value by Status" className="shadow-none">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={statusPieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {statusPieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  formatCompactNgn(Number(value)),
                  "Total",
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bales by status */}
        <Card
          title={`Bales by Status (${bales!.total} total)`}
          className="shadow-none"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={balesData}
              margin={{ top: 0, right: 0, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, angle: -25, textAnchor: "end" }}
                interval={0}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                formatter={(value) => [value as number, "Count"]}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                fill={BLUE}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Orders by status */}
        <Card
          title={`Orders by Status (${orders!.total} total)`}
          className="shadow-none"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={ordersData}
              margin={{ top: 0, right: 0, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, angle: -35, textAnchor: "end" }}
                interval={0}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                formatter={(value) => [value as number, "Count"]}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {ordersData.map((d) => (
                  <Cell
                    key={d.name}
                    fill={
                      d.name === "DEFAULTED" || d.name === "REFUNDED"
                        ? ORANGE
                        : BLUE
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Service orders by status */}
        <Card
          title={`Service Orders by Status (${serviceOrders!.total} total)`}
          className="shadow-none"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={serviceOrdersData}
              margin={{ top: 0, right: 0, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                formatter={(value) => [value as number, "Count"]}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                fill={BLUE}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Active services by type */}
        <Card title="Active Services by Type" className="shadow-none">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={servicesData}
              margin={{ top: 0, right: 0, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                formatter={(value) => [value as number, "Count"]}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                fill={BLUE}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Products footer strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Products"
          value={String(products!.totalProducts)}
        />
        <StatCard
          label="Active Products"
          value={String(products!.activeProducts)}
        />
        <StatCard
          label="Refunds Needing Attention"
          value={String(detail.refunds!.needsAttentionCount)}
        />
        <StatCard
          label="Refund Amount Owed"
          value={formatCompactNgn(detail.refunds!.needsAttentionTotalAmount)}
          accent={detail.refunds!.needsAttentionTotalAmount > 0}
        />
      </div>
    </div>
  );
};
