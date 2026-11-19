"use client";

import { ResponsiveBar } from "@nivo/bar";

type Props = {
  data: Record<string, { total: number; count: number }>;
};

const CATEGORY_LABELS: Record<string, string> = {
  SIM_VPN: "SIM/VPN",
  HOTEL: "Hotel",
  FLIGHT: "Flight",
  ITEM_PURCHASED: "Item Purchased",
  RFQ_ORDER: "RFQ Order",
};

export default function FinanceCategoryChart({ data }: Props) {
  const chartData = Object.entries(data).map(([key, val]) => ({
    category: CATEGORY_LABELS[key] ?? key,
    amount: val.total,
    transactions: val.count,
  }));

  return (
    <div className="h-72">
      <ResponsiveBar
        data={chartData}
        keys={["amount"]}
        indexBy="category"
        margin={{ top: 10, right: 20, bottom: 60, left: 90 }}
        padding={0.35}
        valueScale={{ type: "linear" }}
        colors={["var(--primary)"]}
        borderRadius={4}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          tickRotation: -15,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          format: (v) =>
            v >= 1_000_000
              ? `₦${(v / 1_000_000).toFixed(1)}M`
              : v >= 1_000
              ? `₦${(v / 1_000).toFixed(0)}K`
              : `₦${v}`,
        }}
        enableLabel={false}
        tooltip={({ indexValue, value }) => (
          <div className="bg-(--card) border border-(--table-border) px-3 py-2 rounded-lg text-sm shadow">
            <p className="font-semibold">{indexValue}</p>
            <p>₦{Number(value).toLocaleString()}</p>
          </div>
        )}
        theme={{
          axis: {
            ticks: {
              text: {
                fontSize: 12,
                fill: "var(--muted)",
              },
            },
          },
          grid: {
            line: {
              stroke: "var(--table-border)",
            },
          },
        }}
      />
    </div>
  );
}
