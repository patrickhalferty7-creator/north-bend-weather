import { daysBetweenInclusive } from "@/lib/weather";
import type { DailyWeather, LocationConfig, UnitSystem } from "@/lib/weather";
import type {
  DailyViticulture,
  HistoricalAverage,
  SeasonSeries,
  SeasonSummary,
  TrendDirection,
  TrendWindow,
  VintageAnalog,
  VintageCandidate
} from "./types";

const GDD_BASE = {
  imperial: 50,
  metric: 10
} satisfies Record<UnitSystem, number>;

const FROST_THRESHOLD = {
  imperial: 32,
  metric: 0
} satisfies Record<UnitSystem, number>;

const HEAT_SPIKE_THRESHOLD = {
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

export function buildSeasonSeries({
  daily,
  location,
  unit,
  year,
  startDate,
  endDate,
  currentDate
}: {
  daily: DailyWeather[];
  location: LocationConfig;
  unit: UnitSystem;
  year: number;
  startDate: string;
  endDate: string;
  currentDate: string;
}): SeasonSeries {
  let cumulativeGdd = 0;

  const viticultureDaily = daily
    .filter((day) => day.date >= startDate && day.date <= endDate)
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
        heatSpike: day.temperatureMax >= HEAT_SPIKE_THRESHOLD[unit],
        dayOfSeason: daysBetweenInclusive(startDate, day.date)
      };
    });

  return {
    daily: viticultureDaily,
    summary: summarizeSeason({
      daily: viticultureDaily,
      location,
      unit,
      year,
      startDate,
      endDate,
      currentDate
    })
  };
}

export function summarizeSeason({
  daily,
  location,
  unit,
  year,
  startDate,
  endDate,
  currentDate
}: {
  daily: DailyViticulture[];
  location: LocationConfig;
  unit: UnitSystem;
  year: number;
  startDate: string;
  endDate: string;
  currentDate: string;
}): SeasonSummary {
  const latestDate = daily.at(-1)?.date ?? null;
  const daysElapsed = daily.length;
  const cumulativeGdd = daily.at(-1)?.cumulativeGdd ?? 0;
  const precipitation = sum(daily.map((day) => day.precipitation));
  const stale =
    endDate.slice(0, 4) === currentDate.slice(0, 4) &&
    latestDate != null &&
    daysBetweenInclusive(latestDate, currentDate) > 2;

  return {
    year,
    location,
    unit,
    startDate,
    endDate,
    latestDate,
    daysElapsed,
    cumulativeGdd: round(cumulativeGdd, 1),
    precipitation: round(precipitation, 2),
    averageHigh: averageOrNull(daily.map((day) => day.temperatureMax)),
    averageLow: averageOrNull(daily.map((day) => day.temperatureMin)),
    averageMean: averageOrNull(daily.map((day) => day.temperatureMean)),
    averageDiurnalRange: averageOrNull(daily.map((day) => day.diurnalRange)),
    frostDays: daily.filter((day) => day.frostRisk).length,
    heatSpikeDays: daily.filter((day) => day.heatSpike).length,
    last7: calculateTrend(daily, 7),
    last14: calculateTrend(daily, 14),
    last30: calculateTrend(daily, 30),
    stale
  };
}

export function calculateTrend(daily: DailyViticulture[], days: number): TrendWindow {
  const current = daily.slice(-days);
  const previous = daily.slice(Math.max(0, daily.length - days * 2), Math.max(0, daily.length - days));
  const currentGdd = sum(current.map((day) => day.gdd));
  const previousGdd = previous.length ? sum(previous.map((day) => day.gdd)) : null;
  const currentPrecipitation = sum(current.map((day) => day.precipitation));
  const previousPrecipitation = previous.length
    ? sum(previous.map((day) => day.precipitation))
    : null;
  const currentMean = averageOrNull(current.map((day) => day.temperatureMean));
  const previousMean = previous.length
    ? averageOrNull(previous.map((day) => day.temperatureMean))
    : null;

  return {
    days,
    gdd: round(currentGdd, 1),
    precipitation: round(currentPrecipitation, 2),
    meanTemperature: currentMean,
    gddDelta: previousGdd == null ? null : round(currentGdd - previousGdd, 1),
    precipitationDelta:
      previousPrecipitation == null
        ? null
        : round(currentPrecipitation - previousPrecipitation, 2),
    meanTemperatureDelta:
      currentMean == null || previousMean == null ? null : round(currentMean - previousMean, 1),
    direction: trendDirection({
      gddDelta: previousGdd == null ? null : currentGdd - previousGdd,
      precipitationDelta:
        previousPrecipitation == null ? null : currentPrecipitation - previousPrecipitation,
      meanTemperatureDelta:
        currentMean == null || previousMean == null ? null : currentMean - previousMean
    })
  };
}

export function buildHistoricalAverage(candidates: VintageCandidate[]): HistoricalAverage {
  const years = candidates.map((candidate) => candidate.year);
  const maxDay = Math.max(
    0,
    ...candidates.flatMap((candidate) =>
      candidate.series.daily.map((day) => day.dayOfSeason)
    )
  );

  const points = Array.from({ length: maxDay }, (_, index) => {
    const dayOfSeason = index + 1;
    const matching = candidates
      .map((candidate) =>
        candidate.series.daily.find((day) => day.dayOfSeason === dayOfSeason)
      )
      .filter(Boolean) as DailyViticulture[];

    return {
      dayOfSeason,
      cumulativeGdd: averageOrNull(matching.map((day) => day.cumulativeGdd)),
      precipitation: averageOrNull(
        candidates.map((candidate) =>
          sum(
            candidate.series.daily
              .filter((day) => day.dayOfSeason <= dayOfSeason)
              .map((day) => day.precipitation)
          )
        )
      )
    };
  });

  return {
    years,
    points,
    summary: candidates.length
      ? {
          cumulativeGdd: round(
            averageOrNull(candidates.map((candidate) => candidate.series.summary.cumulativeGdd)) ?? 0,
            1
          ),
          precipitation: round(
            averageOrNull(candidates.map((candidate) => candidate.series.summary.precipitation)) ?? 0,
            2
          ),
          frostDays: round(
            averageOrNull(candidates.map((candidate) => candidate.series.summary.frostDays)) ?? 0,
            1
          ),
          heatSpikeDays: round(
            averageOrNull(candidates.map((candidate) => candidate.series.summary.heatSpikeDays)) ?? 0,
            1
          ),
          averageDiurnalRange: averageOrNull(
            candidates.map((candidate) => candidate.series.summary.averageDiurnalRange)
          )
        }
      : null
  };
}

export function calculateVintageAnalogs({
  target,
  candidates,
  limit = 3
}: {
  target: SeasonSeries;
  candidates: VintageCandidate[];
  limit?: number;
}): VintageAnalog[] {
  return candidates
    .map((candidate) => {
      const deltas = {
        gdd: round(candidate.series.summary.cumulativeGdd - target.summary.cumulativeGdd, 1),
        precipitation: round(candidate.series.summary.precipitation - target.summary.precipitation, 2),
        frostDays: candidate.series.summary.frostDays - target.summary.frostDays,
        heatSpikeDays: candidate.series.summary.heatSpikeDays - target.summary.heatSpikeDays,
        diurnalRange:
          candidate.series.summary.averageDiurnalRange == null ||
          target.summary.averageDiurnalRange == null
            ? null
            : round(
                candidate.series.summary.averageDiurnalRange -
                  target.summary.averageDiurnalRange,
                1
              )
      };
      const distance = weightedDistance(target, candidate.series);
      const score = Math.max(0, Math.min(100, round(100 - distance * 100, 1)));

      return {
        year: candidate.year,
        score,
        rank: 0,
        explanation: vintageExplanation(deltas, score),
        deltas
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((analog, index) => ({
      ...analog,
      rank: index + 1
    }));
}

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function weightedDistance(target: SeasonSeries, candidate: SeasonSeries): number {
  const targetSummary = target.summary;
  const candidateSummary = candidate.summary;
  const gdd = ratioDistance(
    targetSummary.cumulativeGdd,
    candidateSummary.cumulativeGdd,
    350
  );
  const precipitation = ratioDistance(
    targetSummary.precipitation,
    candidateSummary.precipitation,
    targetSummary.unit === "imperial" ? 6 : 150
  );
  const frost = countDistance(targetSummary.frostDays, candidateSummary.frostDays, 10);
  const heat = countDistance(targetSummary.heatSpikeDays, candidateSummary.heatSpikeDays, 10);
  const diurnal =
    targetSummary.averageDiurnalRange == null ||
    candidateSummary.averageDiurnalRange == null
      ? 0
      : Math.min(
          Math.abs(
            targetSummary.averageDiurnalRange - candidateSummary.averageDiurnalRange
          ) / (targetSummary.unit === "imperial" ? 18 : 10),
          1
        );

  return gdd * 0.4 + precipitation * 0.2 + frost * 0.15 + heat * 0.15 + diurnal * 0.1;
}

function ratioDistance(target: number, candidate: number, floor: number): number {
  return Math.min(Math.abs(candidate - target) / Math.max(Math.abs(target), floor), 1);
}

function countDistance(target: number, candidate: number, floor: number): number {
  return Math.min(Math.abs(candidate - target) / floor, 1);
}

function vintageExplanation(
  deltas: VintageAnalog["deltas"],
  score: number
): string {
  const clauses = [
    deltaPhrase(deltas.gdd, "GDD"),
    deltaPhrase(deltas.precipitation, "rain"),
    countPhrase(deltas.frostDays, "frost day"),
    countPhrase(deltas.heatSpikeDays, "heat spike")
  ].filter(Boolean);

  if (score >= 90) {
    return `Very close season shape: ${clauses.join(", ")}.`;
  }
  if (score >= 75) {
    return `Good analog with moderate separation in ${clauses.join(", ")}.`;
  }
  return `Loose analog; nearest available year but ${clauses.join(", ")} diverge.`;
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

function trendDirection({
  gddDelta,
  precipitationDelta,
  meanTemperatureDelta
}: {
  gddDelta: number | null;
  precipitationDelta: number | null;
  meanTemperatureDelta: number | null;
}): TrendDirection {
  if (meanTemperatureDelta != null && Math.abs(meanTemperatureDelta) >= 1.5) {
    return meanTemperatureDelta > 0 ? "warmer" : "cooler";
  }
  if (precipitationDelta != null && Math.abs(precipitationDelta) >= 0.25) {
    return precipitationDelta > 0 ? "wetter" : "drier";
  }
  if (gddDelta != null && Math.abs(gddDelta) >= 10) {
    return gddDelta > 0 ? "warmer" : "cooler";
  }
  return "steady";
}

function averageOrNull(values: Array<number | null>): number | null {
  const clean = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value)
  );
  if (!clean.length) {
    return null;
  }
  return round(sum(clean) / clean.length, 2);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
