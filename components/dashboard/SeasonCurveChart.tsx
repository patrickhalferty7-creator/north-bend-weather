"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { DashboardResponse } from "@/lib/dashboard";

const comparisonColors = ["#60735f", "#6f8fa1", "#8b6f4e", "#56615f", "#a4535c"];

export function SeasonCurveChart({
  data
}: {
  data: Pick<
    DashboardResponse,
    "primary" | "comparisonYears" | "historicalAverage" | "unit"
  >;
}) {
  if (!data.primary?.series.daily.length) {
    return <EmptyChart label="Season curve unavailable" />;
  }

  const chartData = buildCurveData(data);

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="#11120f" strokeOpacity={0.08} vertical={false} />
          <XAxis
            dataKey="dayOfSeason"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#56615f", fontSize: 12 }}
            tickFormatter={(value) => `Day ${value}`}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#56615f", fontSize: 12 }}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: "#7f2430", strokeOpacity: 0.24 }}
            contentStyle={{
              borderRadius: 8,
              borderColor: "rgba(17,18,15,0.14)",
              background: "#fffdf8",
              color: "#11120f"
            }}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Legend verticalAlign="top" align="right" iconType="plainline" />
          <Line
            type="monotone"
            dataKey="current"
            name={`${data.primary.series.summary.year}`}
            stroke="#7f2430"
            strokeWidth={2.6}
            dot={false}
            animationDuration={900}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="average"
            name="Historical avg"
            stroke="#11120f"
            strokeOpacity={0.42}
            strokeWidth={1.6}
            strokeDasharray="5 5"
            dot={false}
            animationDuration={900}
            connectNulls
          />
          {data.comparisonYears.map((candidate, index) => (
            <Line
              key={candidate.year}
              type="monotone"
              dataKey={`year${candidate.year}`}
              name={`${candidate.year}`}
              stroke={comparisonColors[index % comparisonColors.length]}
              strokeWidth={1.7}
              dot={false}
              animationDuration={800 + index * 90}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function buildCurveData(
  data: Pick<
    DashboardResponse,
    "primary" | "comparisonYears" | "historicalAverage" | "unit"
  >
) {
  const primary = data.primary?.series.daily ?? [];
  const maxDay = Math.max(
    0,
    ...primary.map((day) => day.dayOfSeason),
    ...data.historicalAverage.points.map((point) => point.dayOfSeason),
    ...data.comparisonYears.flatMap((candidate) =>
      candidate.series.daily.map((day) => day.dayOfSeason)
    )
  );

  return Array.from({ length: maxDay }, (_, index) => {
    const dayOfSeason = index + 1;
    const row: Record<string, number | null> = {
      dayOfSeason,
      current:
        primary.find((day) => day.dayOfSeason === dayOfSeason)?.cumulativeGdd ?? null,
      average:
        data.historicalAverage.points.find((point) => point.dayOfSeason === dayOfSeason)
          ?.cumulativeGdd ?? null
    };

    for (const candidate of data.comparisonYears) {
      row[`year${candidate.year}`] =
        candidate.series.daily.find((day) => day.dayOfSeason === dayOfSeason)
          ?.cumulativeGdd ?? null;
    }

    return row;
  });
}

export function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-ink/20 bg-chalk/50 text-sm uppercase tracking-[0.16em] text-slate">
      {label}
    </div>
  );
}
