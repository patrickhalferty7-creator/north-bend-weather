"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { DashboardResponse } from "@/lib/dashboard";

export function RegionBars({ data }: { data: DashboardResponse }) {
  const rows = data.regions
    .filter((region) => region.series.daily.length)
    .map((region) => ({
      region: region.location.shortName,
      GDD: region.series.summary.cumulativeGdd,
      Rain: region.series.summary.precipitation,
      Heat: region.series.summary.heatSpikeDays,
      Diurnal: region.series.summary.averageDiurnalRange ?? 0
    }));

  if (!rows.length) {
    return null;
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#11120f" strokeOpacity={0.08} vertical={false} />
          <XAxis
            dataKey="region"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#56615f", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#56615f", fontSize: 12 }}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "rgba(17, 18, 15, 0.05)" }}
            contentStyle={{
              borderRadius: 8,
              borderColor: "rgba(17,18,15,0.14)",
              background: "#fffdf8",
              color: "#11120f"
            }}
          />
          <Legend verticalAlign="top" align="right" />
          <Bar dataKey="GDD" fill="#7f2430" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Rain" fill="#6f8fa1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Heat" fill="#c9bca9" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Diurnal" fill="#60735f" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
