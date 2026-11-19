"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

type FunnelStep = {
  step: string;
  count: number;
  conversion_rate: number | null;
};

const PaymentFunnelChart = ({ data }: { data: FunnelStep[] }) => {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="step" tick={{ fontSize: 12 }} />

        {/* Left axis: raw counts */}
        <YAxis
          yAxisId="left"
          allowDecimals={false}
          label={{ value: "Count", angle: -90, position: "insideLeft" }}
        />

        {/* Right axis: conversion rate (%) */}
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          label={{ value: "Conversion %", angle: 90, position: "insideRight" }}
        />

        <Tooltip
          formatter={(value, name) => {
            if (name === "conversion_rate") {
              return [`${value}%`, "Conversion Rate"];
            }
            return [value, "Count"];
          }}
        />
        <Legend />

        <Bar
          yAxisId="left"
          dataKey="count"
          fill="#6366f1"
          radius={[4, 4, 0, 0]}
          name="Count"
        >
          <LabelList dataKey="count" position="top" />
        </Bar>

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="conversion_rate"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
          name="Conversion Rate"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PaymentFunnelChart;
