"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Droplets,
  Flame,
  Leaf,
  Snowflake,
  ThermometerSun
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardResponse } from "@/lib/dashboard";
import type { UnitSystem, WeatherSourceStatus } from "@/lib/weather";
import {
  dateRangeLabel,
  formatDelta,
  formatMetricValue,
  formatNumber,
  rainSuffix,
  shortDate,
  tempSuffix
} from "@/lib/format";
import { MetricCard } from "./MetricCard";
import { RainfallComparisonChart } from "./RainfallComparisonChart";
import { RegionBars } from "./RegionBars";
import { SeasonCurveChart } from "./SeasonCurveChart";
import { SourceBadge } from "./SourceBadge";

type ViewId = "overview" | "vintage" | "regions" | "sources";

const views: Array<{ id: ViewId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "vintage", label: "Vintage" },
  { id: "regions", label: "Regions" },
  { id: "sources", label: "Sources" }
];

export function DashboardApp({
  initialYear,
  currentYear,
  initialData
}: {
  initialYear: number;
  currentYear: number;
  initialData?: DashboardResponse;
}) {
  const [view, setView] = useState<ViewId>("overview");
  const [year, setYear] = useState(initialYear);
  const [unit, setUnit] = useState<UnitSystem>("imperial");
  const [compareYears, setCompareYears] = useState<number[]>([
    ...(initialData?.compareYears.length
      ? initialData.compareYears
      : [initialYear - 1, initialYear - 2, 2021, 2018])
  ]);
  const [data, setData] = useState<DashboardResponse | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(initialData?.error ?? null);
  const dataRef = useRef<DashboardResponse | null>(initialData ?? null);
  const initialQueryRef = useRef(
    initialData
      ? queryKey(initialData.year, initialData.unit, initialData.compareYears)
      : null
  );

  const availableYears = useMemo(
    () => Array.from({ length: currentYear - 2017 + 1 }, (_, index) => currentYear - index),
    [currentYear]
  );
  const priorYears = useMemo(
    () => availableYears.filter((candidate) => candidate < year),
    [availableYears, year]
  );

  useEffect(() => {
    const currentQuery = queryKey(year, unit, compareYears);
    if (initialQueryRef.current === currentQuery) {
      initialQueryRef.current = null;
      return;
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 20000);
    const params = new URLSearchParams({
      year: String(year),
      unit,
      compareYears: compareYears.join(",")
    });
    setLoading(!dataRef.current);
    setError(null);

    fetch(`/api/dashboard?${params.toString()}`, {
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return (await response.json()) as DashboardResponse;
      })
      .then((payload) => {
        dataRef.current = payload;
        setData(payload);
        setError(payload.error);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load climate data.");
          dataRef.current = null;
          setData(null);
        } else if (timedOut) {
          setError("Climate data request timed out. Try again in a moment.");
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (!controller.signal.aborted) {
          setLoading(false);
        } else {
          setLoading(false);
        }
      });

    return () => {
      window.clearTimeout(timeout);
      controller.abort("superseded");
    };
  }, [compareYears, unit, year]);

  const activeSources = data?.sources.filter((source) => source.state === "active") ?? [];

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="border-b border-ink/15 pb-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate">
                <span>North Bend Viticulture</span>
                <span className="h-px w-8 bg-ink/20" />
                <span>47.4957 N / 121.7868 W</span>
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-normal text-ink sm:text-6xl lg:text-7xl">
                Growing Season Climate
              </h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
              <label className="grid gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
                  Vintage
                </span>
                <select
                  value={year}
                  onChange={(event) => {
                    const nextYear = Number(event.target.value);
                    setYear(nextYear);
                    setCompareYears([nextYear - 1, nextYear - 2, 2021, 2018]);
                  }}
                  className="h-11 rounded-lg border border-ink/15 bg-chalk px-3 text-sm font-semibold text-ink shadow-sm outline-none transition focus:border-vine/50"
                >
                  {availableYears.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
                  Units
                </span>
                <div className="grid h-11 grid-cols-2 rounded-lg border border-ink/15 bg-chalk p-1 shadow-sm">
                  {(["imperial", "metric"] as UnitSystem[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setUnit(option)}
                      className={`rounded-md text-xs font-semibold uppercase tracking-[0.13em] transition ${
                        unit === option ? "bg-ink text-paper" : "text-slate hover:text-ink"
                      }`}
                    >
                      {option === "imperial" ? "F / in" : "C / mm"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
                  Data
                </span>
                <div className="flex h-11 items-center gap-2 overflow-hidden rounded-lg border border-ink/15 bg-chalk px-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate shadow-sm">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      data?.primary?.series.summary.stale ? "bg-vine" : "bg-moss"
                    }`}
                  />
                  {data?.primary?.series.summary.stale ? "Stale" : loading ? "Loading" : "Live"}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <nav className="flex flex-wrap gap-2" aria-label="Dashboard views">
              {views.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    view === item.id
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/15 bg-chalk/70 text-slate hover:border-ink/35 hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="flex flex-wrap gap-2">
              {activeSources.slice(0, 2).map((source) => (
                <SourceBadge key={source.id} source={source} />
              ))}
            </div>
          </div>
        </header>

        <section className="py-6">
          <CompareYearStrip
            years={priorYears}
            selected={compareYears}
            onChange={setCompareYears}
          />
        </section>

        {loading ? <LoadingState /> : null}
        {!loading && error && !data?.primary ? <ErrorState message={error} /> : null}

        <AnimatePresence mode="wait">
          {!loading && data ? (
            <motion.div
              key={`${view}-${year}-${unit}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {view === "overview" ? <Overview data={data} /> : null}
              {view === "vintage" ? <VintageView data={data} /> : null}
              {view === "regions" ? <RegionsView data={data} /> : null}
              {view === "sources" ? <SourcesView data={data} /> : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}

function queryKey(year: number, unit: UnitSystem, compareYears: number[]): string {
  return `${year}|${unit}|${compareYears.join(",")}`;
}

function CompareYearStrip({
  years,
  selected,
  onChange
}: {
  years: number[];
  selected: number[];
  onChange: (years: number[]) => void;
}) {
  const visibleYears = years.slice(0, 9);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
          Comparison vintages
        </p>
        <p className="mt-1 text-sm text-slate">
          {selected.length ? selected.join(" / ") : "Historical average only"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleYears.map((year) => {
          const active = selected.includes(year);
          return (
            <button
              key={year}
              type="button"
              onClick={() => {
                if (active) {
                  onChange(selected.filter((item) => item !== year));
                } else {
                  onChange([...selected, year].slice(-5));
                }
              }}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                active
                  ? "border-vine bg-vine text-paper"
                  : "border-ink/15 bg-chalk/70 text-slate hover:border-ink/35 hover:text-ink"
              }`}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Overview({ data }: { data: DashboardResponse }) {
  const primary = data.primary;
  const unit = data.unit;
  const tempUnit = tempSuffix(unit);
  const rainUnit = rainSuffix(unit);
  const historical = data.historicalAverage.summary;

  if (!primary) {
    return <ErrorState message="North Bend season data is unavailable." />;
  }

  const summary = primary.series.summary;
  const gddDelta = historical
    ? summary.cumulativeGdd - historical.cumulativeGdd
    : null;
  const rainDelta = historical ? summary.precipitation - historical.precipitation : null;

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 border-y border-ink/15 py-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate">
            Season status
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
            Day {data.seasonWindow.dayOfSeason} / {dateRangeLabel(summary.startDate, summary.endDate)}
          </h2>
        </div>
        <div className="grid gap-2 text-sm leading-6 text-slate sm:grid-cols-2">
          <span>Latest daily record: {shortDate(summary.latestDate)}</span>
          <span>Current: {formatMetricValue(primary.currentTemperature, tempUnit)}</span>
          <span>GDD base: {unit === "imperial" ? "50 F" : "10 C"}</span>
          <span>{summary.stale ? "Source lag detected" : "Source data current"}</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Cumulative GDD"
          value={summary.cumulativeGdd}
          suffix="GDD"
          delta={formatDelta(gddDelta, "vs avg")}
          caption="Season-to-date heat accumulation."
          icon={Activity}
          tone="vine"
        />
        <MetricCard
          label="Rainfall"
          value={summary.precipitation}
          suffix={rainUnit}
          decimals={unit === "imperial" ? 2 : 1}
          delta={formatDelta(rainDelta, `${rainUnit} vs avg`)}
          caption="Total precipitation in the viticulture window."
          icon={Droplets}
          tone="rain"
        />
        <MetricCard
          label="Frost Risk Days"
          value={summary.frostDays}
          suffix="days"
          caption={`Minimum temperature at or below ${unit === "imperial" ? "32 F" : "0 C"}.`}
          icon={Snowflake}
          tone="neutral"
        />
        <MetricCard
          label="Heat Spike Days"
          value={summary.heatSpikeDays}
          suffix="days"
          caption={`Daily high at or above ${unit === "imperial" ? "90 F" : "32 C"}.`}
          icon={Flame}
          tone="moss"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Average High"
          value={summary.averageHigh}
          suffix={tempUnit}
          decimals={1}
          caption="Daily maximum temperature average."
          icon={ThermometerSun}
          tone="neutral"
        />
        <MetricCard
          label="Average Low"
          value={summary.averageLow}
          suffix={tempUnit}
          decimals={1}
          caption="Daily minimum temperature average."
          icon={Snowflake}
          tone="neutral"
        />
        <MetricCard
          label="Mean Temp"
          value={summary.averageMean}
          suffix={tempUnit}
          decimals={1}
          caption="Daily mean temperature across the season."
          icon={Leaf}
          tone="moss"
        />
        <MetricCard
          label="Diurnal Range"
          value={summary.averageDiurnalRange}
          suffix={tempUnit}
          decimals={1}
          caption="Average spread between daily high and low."
          icon={CalendarDays}
          tone="rain"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-ink/12 bg-chalk/70 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
                Cumulative season curve
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-ink">North Bend against prior vintages</h3>
            </div>
            <p className="max-w-md text-sm leading-5 text-slate">
              Curves align by day of season from April 1.
            </p>
          </div>
          <SeasonCurveChart data={data} />
        </div>
        <div className="rounded-lg border border-ink/12 bg-chalk/70 p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
              Rainfall comparison
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-ink">Water in the season so far</h3>
          </div>
          <RainfallComparisonChart data={data} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[summary.last7, summary.last14, summary.last30].map((trend) => (
          <article
            key={trend.days}
            className="rounded-lg border border-ink/12 bg-chalk/70 p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
              Last {trend.days} days
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <TrendStat label="GDD" value={formatNumber(trend.gdd)} delta={formatDelta(trend.gddDelta)} />
              <TrendStat
                label="Rain"
                value={formatMetricValue(trend.precipitation, rainUnit)}
                delta={formatDelta(trend.precipitationDelta, rainUnit)}
              />
              <TrendStat
                label="Mean"
                value={formatMetricValue(trend.meanTemperature, tempUnit)}
                delta={formatDelta(trend.meanTemperatureDelta, tempUnit)}
              />
            </div>
            <p className="mt-4 text-sm uppercase tracking-[0.12em] text-slate">
              {trend.direction}
            </p>
          </article>
        ))}
      </section>

      {primary.forecast.length ? (
        <section className="border-y border-ink/15 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
                Near-term forecast
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-ink">
                Next daily readings from Open-Meteo
              </h3>
            </div>
            <p className="text-sm text-slate">Forecast values are excluded from vintage analog scoring.</p>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {primary.forecast.slice(0, 4).map((day) => (
              <div
                key={day.date}
                className="rounded-lg border border-ink/10 bg-chalk/70 p-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate">
                  {shortDate(day.date)}
                </p>
                <p className="mt-3 metric-tabular text-xl font-semibold text-ink">
                  {formatMetricValue(day.temperatureMax, tempUnit)} /{" "}
                  {formatMetricValue(day.temperatureMin, tempUnit)}
                </p>
                <div className="mt-3 flex gap-4 text-xs text-slate">
                  <span>{formatNumber(day.gdd)} GDD</span>
                  <span>{formatMetricValue(day.precipitation, rainUnit)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TrendStat({
  label,
  value,
  delta
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate">
        {label}
      </p>
      <p className="mt-2 truncate metric-tabular text-lg font-semibold text-ink">{value}</p>
      <p className="mt-1 truncate text-xs text-slate">{delta}</p>
    </div>
  );
}

function VintageView({ data }: { data: DashboardResponse }) {
  const [openYear, setOpenYear] = useState<number | null>(data.analogs[0]?.year ?? null);

  return (
    <div className="grid gap-8">
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
              Closest analogs
            </p>
            <h2 className="mt-2 text-4xl font-semibold leading-tight text-ink">
              {data.analogs[0] ? `${data.analogs[0].year} is tracking closest` : "No analogs available"}
            </h2>
          </div>
          {data.analogs.map((analog) => (
            <motion.article
              key={analog.year}
              layout
              className="rounded-lg border border-ink/12 bg-chalk/80 p-5"
            >
              <button
                type="button"
                onClick={() => setOpenYear(openYear === analog.year ? null : analog.year)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
                    Rank {analog.rank}
                  </span>
                  <span className="mt-1 block text-3xl font-semibold text-ink">{analog.year}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="metric-tabular text-xl font-semibold text-vine">
                    {formatNumber(analog.score)}%
                  </span>
                  <ChevronDown
                    aria-hidden
                    className={`h-4 w-4 text-slate transition ${
                      openYear === analog.year ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {openYear === analog.year ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-4 border-t border-ink/10 pt-4 text-sm leading-6 text-slate">
                      {analog.explanation}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                      <AnalogDelta label="GDD" value={formatDelta(analog.deltas.gdd)} />
                      <AnalogDelta label="Rain" value={formatDelta(analog.deltas.precipitation, rainSuffix(data.unit))} />
                      <AnalogDelta label="Frost" value={formatDelta(analog.deltas.frostDays, "days")} />
                      <AnalogDelta label="Heat" value={formatDelta(analog.deltas.heatSpikeDays, "days")} />
                      <AnalogDelta label="Diurnal" value={formatDelta(analog.deltas.diurnalRange, tempSuffix(data.unit))} />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          ))}
        </div>
        <div className="rounded-lg border border-ink/12 bg-chalk/70 p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
              Vintage curve
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-ink">Selected years and historical average</h3>
          </div>
          <SeasonCurveChart data={data} />
        </div>
      </section>
    </div>
  );
}

function AnalogDelta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate">
        {label}
      </p>
      <p className="mt-1 metric-tabular font-semibold text-ink">{value}</p>
    </div>
  );
}

function RegionsView({ data }: { data: DashboardResponse }) {
  const reduceMotion = useReducedMotion();
  const rainUnit = rainSuffix(data.unit);
  const tempUnit = tempSuffix(data.unit);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 lg:grid-cols-3">
        {data.regions.map((region) => {
          const summary = region.series.summary;
          const unavailable = !region.series.daily.length;
          return (
            <motion.article
              key={region.location.id}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-lg border border-ink/12 bg-chalk/80 p-5 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
                {region.location.regionLabel}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-ink">{region.location.shortName}</h2>
              {unavailable ? (
                <p className="mt-8 text-sm leading-6 text-vine">Data unavailable from active sources.</p>
              ) : (
                <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-5">
                  <RegionStat label="GDD" value={formatNumber(summary.cumulativeGdd)} />
                  <RegionStat label="Rain" value={formatMetricValue(summary.precipitation, rainUnit)} />
                  <RegionStat label="Heat" value={`${summary.heatSpikeDays} days`} />
                  <RegionStat
                    label="Diurnal"
                    value={formatMetricValue(summary.averageDiurnalRange, tempUnit)}
                  />
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                {region.sources.slice(0, 2).map((source) => (
                  <SourceBadge key={source.id} source={source} />
                ))}
              </div>
            </motion.article>
          );
        })}
      </section>
      <section className="rounded-lg border border-ink/12 bg-chalk/70 p-4 sm:p-6">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
            Region comparison
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-ink">
            North Bend, Willamette proxy, Burgundy proxy
          </h3>
        </div>
        <RegionBars data={data} />
      </section>
    </div>
  );
}

function RegionStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate">
        {label}
      </p>
      <p className="mt-2 metric-tabular text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function SourcesView({ data }: { data: DashboardResponse }) {
  return (
    <div className="grid gap-8">
      <section className="grid gap-4 border-y border-ink/15 py-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate">
            Data sources
          </p>
          <h2 className="mt-2 text-4xl font-semibold text-ink">Provenance and reliability</h2>
        </div>
        <div className="grid gap-2 text-sm leading-6 text-slate sm:grid-cols-2">
          <span>Generated: {new Date(data.generatedAt).toLocaleString()}</span>
          <span>Season: {data.seasonWindow.startDate} to {data.seasonWindow.endDate}</span>
          <span>NOAA token: server-side optional</span>
          <span>Demo fallback: none</span>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {data.sources.map((source) => (
          <SourcePanel key={source.id} source={source} />
        ))}
      </section>
      {data.warnings.length ? (
        <section className="rounded-lg border border-vine/25 bg-vine/5 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-vine">
            Warnings
          </p>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-ink">
            {data.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SourcePanel({ source }: { source: WeatherSourceStatus }) {
  return (
    <article className="rounded-lg border border-ink/12 bg-chalk/80 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
            {source.state}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-ink">{source.label}</h3>
        </div>
        <SourceBadge source={source} />
      </div>
      <div className="mt-6 grid gap-4 text-sm leading-6 text-slate sm:grid-cols-2">
        <p>{source.reliability}</p>
        <p>{source.note}</p>
        <p>Date range: {source.dateRange ?? "Not active"}</p>
        <p>Updated: {source.lastUpdated ? new Date(source.lastUpdated).toLocaleString() : "Not reported"}</p>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 py-8 md:grid-cols-2 xl:grid-cols-4" aria-live="polite">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-lg border border-ink/10 bg-chalk/70"
        />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-vine/30 bg-vine/5 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-vine">
        Data unavailable
      </p>
      <p className="mt-3 max-w-3xl text-lg leading-7 text-ink">{message}</p>
    </section>
  );
}
