// "use client";

// import { ResponsiveBar } from "@nivo/bar";
// import type { AdminDashboardRevenueWeek } from "@/types/types";
// import { formatCompactNgn } from "@/lib/dashboard-ui";

// type Props = {
//   rows: AdminDashboardRevenueWeek[];
// };

// export default function RevenueByWeekChart({ rows }: Props) {
//   const data = rows.map((w, i) => ({
//     week: w.label || w.weekStart?.slice(5, 10) || `W${i + 1}`,
//     revenue: w.amountNgn ?? 0,
//   }));

//   if (!data.length) {
//     return (
//       <div className="flex h-64 items-center justify-center text-sm text-slate-500">No revenue data yet.</div>
//     );
//   }

//   return (
//     <div className="h-72 w-full">
//       <ResponsiveBar
//         data={data}
//         keys={["revenue"]}
//         indexBy="week"
//         margin={{ top: 24, right: 16, bottom: 48, left: 56 }}
//         padding={0.35}
//         valueScale={{ type: "linear" }}
//         colors={(bar) => {
//           const idx = data.findIndex((d) => d.week === (bar.data as { week: string }).week);
//           return idx === data.length - 1 ? "#f97316" : "#22c55e";
//         }}
//         borderRadius={4}
//         axisBottom={{
//           tickSize: 0,
//           tickPadding: 8,
//           tickRotation: -25,
//         }}
//         axisLeft={{
//           tickSize: 0,
//           tickPadding: 8,
//           format: (v) => formatCompactNgn(Number(v)),
//         }}
//         enableLabel={true}
//         label={(d) => formatCompactNgn(Number(d.value))}
//         labelTextColor="#e2e8f0"
//         labelSkipWidth={24}
//         labelSkipHeight={12}
//         theme={{
//           background: "transparent",
//           text: { fill: "#94a3b8", fontSize: 11 },
//           axis: {
//             ticks: { text: { fill: "#94a3b8" } },
//             domain: { line: { stroke: "#334155" } },
//           },
//           grid: { line: { stroke: "#1e293b" } },
//           tooltip: {
//             container: {
//               background: "#0f172a",
//               color: "#f1f5f9",
//               fontSize: 12,
//               borderRadius: 8,
//             },
//           },
//         }}
//         tooltip={({ indexValue, value }) => (
//           <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm shadow-xl">
//             <p className="font-semibold text-slate-100">{String(indexValue)}</p>
//             <p className="text-emerald-400">{formatCompactNgn(Number(value))}</p>
//           </div>
//         )}
//       />
//     </div>
//   );
// }

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminDashboardRevenueWeek } from "@/types/types";
import { formatCompactNgn } from "@/lib/dashboard-ui";

type Props = {
  rows: AdminDashboardRevenueWeek[];
};

export const RevenueByWeekChart = ({ rows }: Props) => {
  const data = rows.map((w, i) => ({
    week: w.label || w.weekStart?.slice(5, 10) || `W${i + 1}`,
    revenue: w.amountNgn ?? 0,
  }));

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No revenue data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12, angle: -25, textAnchor: "end" }}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => formatCompactNgn(Number(v))}
        />
        <Tooltip
          formatter={(value) => [formatCompactNgn(Number(value)), "Revenue"]}
          cursor={{ fill: "rgba(0,0,0,0.05)" }}
        />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={50}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={i === data.length - 1 ? "#f97316" : "#2a78d6"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};