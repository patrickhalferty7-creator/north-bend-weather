"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { DashboardResponse } from "@/lib/dashboard";

export function RainfallComparisonChart({
  data
}: {
  data: Pick<DashboardResponse, "primary" | "comparisonYears" | "historicalAverage">;
}) {
  const rows = [
    data.primary
      ? {
          label: String(data.primary.series.summary.year),
          rainfall: data.primary.series.summary.precipitation
        }
      : null,
    data.historicalAverage.summary
      ? {
          label: "Avg",
          rainfall: data.historicalAverage.summary.precipitation
        }
      : null,
    ...data.comparisonYears.map((candidate) => ({
      label: String(candidate.year),
      rainfall: candidate.series.summary.precipitation
    }))
  ].filter(Boolean) as Array<{ label: string; rainfall: number }>;

  if (!rows.length) {
    return <div className="h-[220px]" />;
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#11120f" strokeOpacity={0.08} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#56615f", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#56615f", fontSize: 12 }}
            width={42}
          />
          <Tooltip
            cursor={{ fill: "rgba(96, 115, 95, 0.09)" }}
            contentStyle={{
              borderRadius: 8,
              borderColor: "rgba(17,18,15,0.14)",
              background: "#fffdf8",
              color: "#11120f"
            }}
          />
          <Bar dataKey="rainfall" name="Rainfall" fill="#6f8fa1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
