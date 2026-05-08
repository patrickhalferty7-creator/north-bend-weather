import { daysBetweenInclusive, type DailyWeather, type LocationConfig, type UnitSystem } from "@/lib/weather";
import type { ClimateSummary, DailyViticulture, RegionComparison } from "@/lib/weather";

const GDD_BASE = {
  imperial: 50,
  metric: 10
} satisfies Record<UnitSystem, number>;

const FROST_THRESHOLD = {
  imperial: 32,
  metric: 0
} satisfies Record<UnitSystem, number>;

const HEAT_THRESHOLD = {
  imperial: 90,
  metric: 32
} satisfies Record<UnitSystem, number>;

export function calculateDailyGdd({
  temperatureMax,
  temperatureMin,
  unit,
  base = GDD_BASE[unit]
}: {
  temperatureMax: number;
  temperatureMin: number;
  unit: UnitSystem;
  base?: number;
}): number {
  return round(Math.max((temperatureMax + temperatureMin) / 2 - base, 0), 2);
}

export function summarizeClimate({
  location,
  daily,
  unit,
  startDate,
  warnings = []
}: {
  location: LocationConfig;
  daily: DailyWeather[];
  unit: UnitSystem;
  startDate: string;
  warnings?: string[];
}): ClimateSummary {
  let cumulativeGdd = 0;
  const viticultureDaily = daily
    .sort((a, b) => a.date.localeCompare(b.date))
    .map<DailyViticulture>((day) => {
      const gdd = calculateDailyGdd({
        temperatureMax: day.temperatureMax,
        temperatureMin: day.temperatureMin,
        unit
      });
      cumulativeGdd += gdd;

      return {
        ...day,
        gdd,
        cumulativeGdd: round(cumulativeGdd, 2),
        diurnalRange: round(day.temperatureMax - day.temperatureMin, 2),
        frostRisk: day.temperatureMin <= FROST_THRESHOLD[unit],
        heatSpike: day.temperatureMax >= HEAT_THRESHOLD[unit],
        dayOfSeason: daysBetweenInclusive(startDate, day.date)
      };
    });

  const last30 = viticultureDaily.slice(-30);

  return {
    location,
    latestDate: viticultureDaily.at(-1)?.date ?? null,
    days: viticultureDaily.length,
    cumulativeGdd: round(viticultureDaily.at(-1)?.cumulativeGdd ?? 0, 1),
    precipitation: round(sum(viticultureDaily.map((day) => day.precipitation)), 2),
    averageHigh: average(viticultureDaily.map((day) => day.temperatureMax)),
    averageLow: average(viticultureDaily.map((day) => day.temperatureMin)),
    averageMean: average(viticultureDaily.map((day) => day.temperatureMean)),
    averageDiurnalRange: average(viticultureDaily.map((day) => day.diurnalRange)),
    frostDays: viticultureDaily.filter((day) => day.frostRisk).length,
    heatSpikeDays: viticultureDaily.filter((day) => day.heatSpike).length,
    last30Gdd: round(sum(last30.map((day) => day.gdd)), 1),
    last30Precipitation: round(sum(last30.map((day) => day.precipitation)), 2),
    daily: viticultureDaily,
    warnings
  };
}

export function compareRegions({
  subject,
  regions,
  unit
}: {
  subject: ClimateSummary;
  regions: ClimateSummary[];
  unit: UnitSystem;
}): RegionComparison[] {
  return regions
    .map((summary) => {
      const deltas = {
        gdd: round(summary.cumulativeGdd - subject.cumulativeGdd, 1),
        precipitation: round(summary.precipitation - subject.precipitation, 2),
        frostDays: summary.frostDays - subject.frostDays,
        heatSpikeDays: summary.heatSpikeDays - subject.heatSpikeDays,
        diurnalRange:
          summary.averageDiurnalRange == null || subject.averageDiurnalRange == null
            ? null
            : round(summary.averageDiurnalRange - subject.averageDiurnalRange, 1)
      };
      const score = round(100 - climateDistance(subject, summary, unit) * 100, 1);
      return {
        summary,
        similarityScore: Math.max(0, Math.min(100, score)),
        rank: 0,
        explanation: explainMatch(deltas, score),
        deltas
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .map((comparison, index) => ({ ...comparison, rank: index + 1 }));
}

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function climateDistance(subject: ClimateSummary, region: ClimateSummary, unit: UnitSystem): number {
  const precipitationFloor = unit === "imperial" ? 6 : 150;
  const diurnalFloor = unit === "imperial" ? 18 : 10;

  const gdd = boundedDifference(subject.cumulativeGdd, region.cumulativeGdd, 450);
  const precipitation = boundedDifference(subject.precipitation, region.precipitation, precipitationFloor);
  const frost = Math.min(Math.abs(subject.frostDays - region.frostDays) / 12, 1);
  const heat = Math.min(Math.abs(subject.heatSpikeDays - region.heatSpikeDays) / 18, 1);
  const diurnal =
    subject.averageDiurnalRange == null || region.averageDiurnalRange == null
      ? 0.5
      : Math.min(Math.abs(subject.averageDiurnalRange - region.averageDiurnalRange) / diurnalFloor, 1);

  return gdd * 0.36 + precipitation * 0.22 + frost * 0.14 + heat * 0.16 + diurnal * 0.12;
}

function boundedDifference(a: number, b: number, floor: number): number {
  return Math.min(Math.abs(a - b) / Math.max(Math.abs(a), floor), 1);
}

function explainMatch(deltas: RegionComparison["deltas"], score: number): string {
  const strongest = [
    deltaPhrase(deltas.gdd, "GDD"),
    deltaPhrase(deltas.precipitation, "rain"),
    countPhrase(deltas.heatSpikeDays, "heat day"),
    countPhrase(deltas.frostDays, "frost day")
  ].join(", ");

  if (score >= 82) {
    return `Very close season profile: ${strongest}.`;
  }
  if (score >= 65) {
    return `Moderate analog with separation in ${strongest}.`;
  }
  return `Different climate signature; nearest differences are ${strongest}.`;
}

function deltaPhrase(delta: number, label: string): string {
  if (Math.abs(delta) < 0.05) {
    return `${label} even`;
  }
  return `${Math.abs(delta)} ${label} ${delta > 0 ? "higher" : "lower"}`;
}

function countPhrase(delta: number, label: string): string {
  if (delta === 0) {
    return `${label}s even`;
  }
  const abs = Math.abs(delta);
  return `${abs} ${label}${abs === 1 ? "" : "s"} ${delta > 0 ? "more" : "fewer"}`;
}

function average(values: number[]): number | null {
  if (!values.length) {
    return null;
  }
  return round(sum(values) / values.length, 2);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
