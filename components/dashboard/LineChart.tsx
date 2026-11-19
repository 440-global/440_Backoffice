"use client";

import { ResponsiveLine } from "@nivo/line";

export type LineSeries = {
  id: string;
  color?: string;
  data: { x: string | number; y: number }[];
};

type LineChartProps = {
  title: string;
  subtitle?: string;
  kpi?: {
    value: string;
    label?: string;
    trend?: "up" | "down";
  };
  data: LineSeries[];
  yMax?: number;
};

const LineChart = ({
  title,
  subtitle,
  kpi,
  data,
  yMax,
}: LineChartProps) => {
  return (
    <div className="rounded-xl p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-(--text-primary)">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-(--medium-grey)">
              {subtitle}
            </p>
          )}
        </div>

        {/* KPI */}
        {kpi && (
          <div className="text-right">
            <p className="text-xl font-bold text-(--text-primary)">
              {kpi.value}
            </p>
            {kpi.label && (
              <p
                className={`text-xs font-medium ${kpi.trend === "up"
                    ? "text-(--success)"
                    : kpi.trend === "down"
                      ? "text-(--danger)"
                      : "text-(--medium-grey)"
                  }`}
              >
                {kpi.label}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveLine
          data={data}
          curve="monotoneX"
          margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            min: "auto",
            max: yMax ?? "auto",
          }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            legend: "Months",
            legendOffset: 40,
            legendPosition: "middle",
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            legend: "Value",
            legendOffset: -40,
            legendPosition: "middle",
          }}
          colors={(serie) =>
            serie.color ??
            "var(--primary)"
          }
          pointSize={8}
          pointColor={{ theme: "background" }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          useMesh
          enableSlices="x"
          animate
          motionConfig="gentle"
          legends={[
            {
              anchor: "bottom-right",
              direction: "column",
              itemWidth: 80,
              itemHeight: 20,
              symbolSize: 12,
            },
          ]}
          theme={{
            axis: {
              ticks: {
                text: {
                  fontSize: 12,
                  fill: "var(--medium-grey)",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                },
              },
              legend: {
                text: {
                  fontSize: 13,
                  fill: "var(--text-primary)",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                },
              },
            },
            legends: {
              text: {
                fontSize: 12,
                fontWeight: 600,
                fill: "var(--text-primary)",
              },
            },
            grid: {
              line: {
                stroke: "var(--table-border)",
              },
            },
            tooltip: {
              container: {
                fontSize: 12,
                fontFamily: "Cabinet Grotesk, sans-serif",
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default LineChart;