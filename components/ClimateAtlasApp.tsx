"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Droplets,
  Flame,
  Globe2,
  Leaf,
  MapPin,
  Snowflake,
  ThermometerSun
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ClimateDashboardResponse } from "@/lib/dashboard";
import type { RegionComparison, UnitSystem } from "@/lib/weather";
import {
  formatDelta,
  formatInteger,
  formatNumber,
  precipitationSuffix,
  shortDate,
  temperatureSuffix
} from "@/lib/format";

const year = new Date().getFullYear();

export function ClimateAtlasApp() {
  const reduceMotion = useReducedMotion();
  const [postalCode, setPostalCode] = useState("");
  const [submittedPostalCode, setSubmittedPostalCode] = useState("");
  const [unit, setUnit] = useState<UnitSystem>("imperial");
  const [data, setData] = useState<ClimateDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    const params = new URLSearchParams({
      year: String(year),
      unit,
      country: "us"
    });
    if (submittedPostalCode.trim()) {
      params.set("postalCode", submittedPostalCode.trim());
    }

    setLoading(true);
    setError(null);

    fetch(`/api/climate?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return (await response.json()) as ClimateDashboardResponse;
      })
      .then(setData)
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") {
          setError("Climate data request timed out. Try another area or refresh.");
        } else {
          setError(fetchError instanceof Error ? fetchError.message : "Climate data failed to load.");
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [submittedPostalCode, unit]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedPostalCode(postalCode);
  }

  const topMatches = data?.comparisons.slice(0, 3) ?? [];

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="border-b border-ink/15 pb-7">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate">
                <span>Wine Climate Atlas</span>
                <span className="h-px w-8 bg-ink/20" />
                <span>GDD / rain / frost / heat</span>
              </div>
              <h1 className="text-5xl font-semibold leading-[0.96] tracking-normal text-ink sm:text-6xl lg:text-7xl">
                Compare Your Growing Season
              </h1>
            </div>

            <form
              onSubmit={submit}
              className="grid gap-3 rounded-lg border border-ink/12 bg-chalk/80 p-4 shadow-sm lg:min-w-[560px]"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <label className="grid gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
                    Area / ZIP code
                  </span>
                  <input
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                    placeholder="98045"
                    inputMode="numeric"
                    className="h-11 rounded-lg border border-ink/15 bg-paper px-3 text-sm font-semibold outline-none transition focus:border-vine/50"
                  />
                </label>
                <div className="grid gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
                    Units
                  </span>
                  <div className="grid h-11 grid-cols-2 rounded-lg border border-ink/15 bg-paper p-1">
                    {(["imperial", "metric"] as UnitSystem[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setUnit(option)}
                        className={`rounded-md px-3 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                          unit === option ? "bg-ink text-paper" : "text-slate hover:text-ink"
                        }`}
                      >
                        {option === "imperial" ? "F/in" : "C/mm"}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-vine px-4 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition hover:bg-ink sm:mt-auto"
                >
                  Compare
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs leading-5 text-slate">
                <MapPin aria-hidden className="h-3.5 w-3.5" />
                <span>
                  {submittedPostalCode ? `Using ${submittedPostalCode}` : "Defaulting to North Bend"}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate/45" />
                <span>{data ? `${data.seasonWindow.startDate} to ${data.seasonWindow.endDate}` : "Loading season"}</span>
              </div>
            </form>
          </div>
        </header>

        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}

        <AnimatePresence mode="wait">
          {data && !loading ? (
            <motion.div
              key={`${data.subject.location.id}-${unit}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="grid gap-8 py-7"
            >
              <SubjectOverview data={data} />
              <MatchSection matches={topMatches} unit={unit} />
              <ChartSection data={data} />
              <RegionGrid comparisons={data.comparisons} unit={unit} />
              <SourcePanel data={data} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}

function SubjectOverview({ data }: { data: ClimateDashboardResponse }) {
  const subject = data.subject;
  const tempUnit = temperatureSuffix(data.unit);
  const rainUnit = precipitationSuffix(data.unit);

  return (
    <section className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
      <div className="border-y border-ink/15 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate">
          Your climate
        </p>
        <h2 className="mt-2 text-4xl font-semibold leading-tight text-ink">
          {subject.location.shortName}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate">
          {subject.location.regionLabel}. Latest daily record: {shortDate(subject.latestDate)}.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Leaf} label="Cumulative GDD" value={formatInteger(subject.cumulativeGdd)} suffix="GDD" tone="vine" />
        <MetricCard icon={Droplets} label="Rainfall" value={formatNumber(subject.precipitation, data.unit === "imperial" ? 2 : 1)} suffix={rainUnit} tone="rain" />
        <MetricCard icon={Snowflake} label="Frost Days" value={formatInteger(subject.frostDays)} suffix="days" tone="neutral" />
        <MetricCard icon={Flame} label="Heat Days" value={formatInteger(subject.heatSpikeDays)} suffix="days" tone="moss" />
        <MetricCard icon={ThermometerSun} label="Avg High" value={formatNumber(subject.averageHigh)} suffix={tempUnit} tone="neutral" />
        <MetricCard icon={ThermometerSun} label="Avg Low" value={formatNumber(subject.averageLow)} suffix={tempUnit} tone="neutral" />
        <MetricCard icon={Globe2} label="Diurnal" value={formatNumber(subject.averageDiurnalRange)} suffix={tempUnit} tone="moss" />
        <MetricCard icon={Droplets} label="Last 30 Rain" value={formatNumber(subject.last30Precipitation, data.unit === "imperial" ? 2 : 1)} suffix={rainUnit} tone="rain" />
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  tone
}: {
  icon: typeof Leaf;
  label: string;
  value: string;
  suffix: string;
  tone: "neutral" | "vine" | "moss" | "rain";
}) {
  const reduceMotion = useReducedMotion();
  const toneClass = {
    neutral: "border-ink/12",
    vine: "border-vine/35",
    moss: "border-moss/35",
    rain: "border-rain/40"
  }[tone];

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.18 }}
      className={`min-h-[146px] rounded-lg border ${toneClass} bg-chalk/80 p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate">{label}</p>
        <Icon aria-hidden className="h-4 w-4 text-ink/70" strokeWidth={1.7} />
      </div>
      <p className="mt-6 metric-tabular text-3xl font-semibold leading-none text-ink">
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.13em] text-slate">{suffix}</p>
    </motion.article>
  );
}

function MatchSection({ matches, unit }: { matches: RegionComparison[]; unit: UnitSystem }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {matches.map((match) => (
        <article key={match.summary.location.id} className="rounded-lg border border-ink/12 bg-chalk/80 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
                Closest climate #{match.rank}
              </p>
              <h3 className="mt-2 text-3xl font-semibold text-ink">{match.summary.location.shortName}</h3>
              <p className="mt-1 text-sm text-slate">{match.summary.location.regionLabel}</p>
            </div>
            <span className="metric-tabular text-2xl font-semibold text-vine">
              {formatNumber(match.similarityScore, 1)}%
            </span>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate">{match.explanation}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Delta label="GDD" value={formatDelta(match.deltas.gdd)} />
            <Delta label="Rain" value={formatDelta(match.deltas.precipitation, precipitationSuffix(unit))} />
            <Delta label="Heat" value={formatDelta(match.deltas.heatSpikeDays, "days")} />
            <Delta label="Diurnal" value={formatDelta(match.deltas.diurnalRange, temperatureSuffix(unit))} />
          </div>
        </article>
      ))}
    </section>
  );
}

function Delta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate">{label}</p>
      <p className="mt-1 metric-tabular font-semibold text-ink">{value}</p>
    </div>
  );
}

function ChartSection({ data }: { data: ClimateDashboardResponse }) {
  const rows = useMemo(() => {
    return [
      { name: data.subject.location.shortName, GDD: data.subject.cumulativeGdd, Rain: data.subject.precipitation, Heat: data.subject.heatSpikeDays },
      ...data.comparisons.slice(0, 7).map((comparison) => ({
        name: comparison.summary.location.shortName,
        GDD: comparison.summary.cumulativeGdd,
        Rain: comparison.summary.precipitation,
        Heat: comparison.summary.heatSpikeDays
      }))
    ];
  }, [data]);

  const lineRows = useMemo(() => buildLineRows(data), [data]);

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-lg border border-ink/12 bg-chalk/70 p-4 sm:p-6">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Cumulative GDD curve</p>
          <h3 className="mt-1 text-2xl font-semibold text-ink">Your season against the closest regions</h3>
        </div>
        <div className="h-[340px]">
          <ResponsiveContainer>
            <LineChart data={lineRows} margin={{ top: 8, right: 18, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#11120f" strokeOpacity={0.08} vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#56615f", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#56615f", fontSize: 12 }} width={48} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: "rgba(17,18,15,0.14)", background: "#fffdf8" }} />
              <Legend verticalAlign="top" align="right" iconType="plainline" />
              <Line dataKey="You" stroke="#7f2430" strokeWidth={2.6} dot={false} type="monotone" />
              {data.comparisons.slice(0, 3).map((comparison, index) => (
                <Line
                  key={comparison.summary.location.id}
                  dataKey={comparison.summary.location.shortName}
                  stroke={["#60735f", "#6f8fa1", "#56615f"][index]}
                  strokeWidth={1.8}
                  dot={false}
                  type="monotone"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border border-ink/12 bg-chalk/70 p-4 sm:p-6">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Global comparison</p>
          <h3 className="mt-1 text-2xl font-semibold text-ink">Heat, rain, and heat days</h3>
        </div>
        <div className="h-[340px]">
          <ResponsiveContainer>
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#11120f" strokeOpacity={0.08} vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#56615f", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#56615f", fontSize: 12 }} width={48} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: "rgba(17,18,15,0.14)", background: "#fffdf8" }} />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="GDD" fill="#7f2430" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Rain" fill="#6f8fa1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Heat" fill="#60735f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function buildLineRows(data: ClimateDashboardResponse) {
  const series = [data.subject, ...data.comparisons.slice(0, 3).map((comparison) => comparison.summary)];
  const maxDay = Math.max(...series.flatMap((summary) => summary.daily.map((day) => day.dayOfSeason)));
  return Array.from({ length: maxDay }, (_, index) => {
    const day = index + 1;
    const row: Record<string, number | null> = { day };
    row.You = data.subject.daily.find((entry) => entry.dayOfSeason === day)?.cumulativeGdd ?? null;
    for (const comparison of data.comparisons.slice(0, 3)) {
      row[comparison.summary.location.shortName] =
        comparison.summary.daily.find((entry) => entry.dayOfSeason === day)?.cumulativeGdd ?? null;
    }
    return row;
  });
}

function RegionGrid({ comparisons, unit }: { comparisons: RegionComparison[]; unit: UnitSystem }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {comparisons.map((comparison) => (
        <article key={comparison.summary.location.id} className="rounded-lg border border-ink/12 bg-chalk/80 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
            {comparison.summary.location.regionLabel}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-ink">{comparison.summary.location.shortName}</h3>
          <p className="mt-3 min-h-16 text-sm leading-5 text-slate">{comparison.summary.location.climateNote}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Delta label="Score" value={`${formatNumber(comparison.similarityScore, 1)}%`} />
            <Delta label="GDD" value={formatInteger(comparison.summary.cumulativeGdd)} />
            <Delta label="Rain" value={`${formatNumber(comparison.summary.precipitation, unit === "imperial" ? 2 : 1)} ${precipitationSuffix(unit)}`} />
            <Delta label="Heat" value={`${formatInteger(comparison.summary.heatSpikeDays)} days`} />
          </div>
        </article>
      ))}
    </section>
  );
}

function SourcePanel({ data }: { data: ClimateDashboardResponse }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
      <div className="border-y border-ink/15 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Data status</p>
        <h3 className="mt-2 text-3xl font-semibold text-ink">Live climate sources</h3>
        <p className="mt-3 text-sm leading-6 text-slate">Generated {new Date(data.generatedAt).toLocaleString()}.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data.sources.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-ink/12 bg-chalk/80 p-5 transition hover:border-ink/35"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">{source.state}</p>
            <h4 className="mt-2 text-xl font-semibold text-ink">{source.label}</h4>
            <p className="mt-3 text-sm leading-6 text-slate">{source.note}</p>
          </a>
        ))}
      </div>
      {data.warnings.length ? (
        <div className="rounded-lg border border-vine/25 bg-vine/5 p-5 lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-vine">Warnings</p>
          <div className="mt-3 grid gap-1 text-sm leading-6 text-ink">
            {data.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 py-8 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-lg border border-ink/10 bg-chalk/70" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="mt-6 rounded-lg border border-vine/30 bg-vine/5 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-vine">Data unavailable</p>
      <p className="mt-3 max-w-3xl text-lg leading-7 text-ink">{message}</p>
    </section>
  );
}
