import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type ProductStat = {
  resource_id: string;
  resource_type: string;
  count: number;
};

type Props = {
  data: ProductStat[];
};

export const TopProductChart = ({ data }: Props) => {
  const sorted = [...data]
    .sort((a, b) => b.count - a.count)
    .map((d) => ({ ...d, name: `ID ${d.resource_id}` }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={sorted}
        margin={{ top: 0, right: 0, left: 0, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, angle: -45, textAnchor: "end" }}
          interval={0}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [value as number, "Count"]}
          cursor={{ fill: "rgba(0,0,0,0.05)" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {sorted.map((_, i) => (
            <Cell key={i} fill="#2a78d6" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};