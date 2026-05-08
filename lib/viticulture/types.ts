import type { DailyWeather, LocationConfig, UnitSystem, WeatherSourceStatus } from "@/lib/weather";

export type TrendDirection = "warmer" | "cooler" | "wetter" | "drier" | "steady";

export interface DailyViticulture extends DailyWeather {
  gdd: number;
  cumulativeGdd: number;
  diurnalRange: number;
  frostRisk: boolean;
  heatSpike: boolean;
  dayOfSeason: number;
}

export interface TrendWindow {
  days: number;
  gdd: number;
  precipitation: number;
  meanTemperature: number | null;
  gddDelta: number | null;
  precipitationDelta: number | null;
  meanTemperatureDelta: number | null;
  direction: TrendDirection;
}

export interface SeasonSummary {
  year: number;
  location: LocationConfig;
  unit: UnitSystem;
  startDate: string;
  endDate: string;
  latestDate: string | null;
  daysElapsed: number;
  cumulativeGdd: number;
  precipitation: number;
  averageHigh: number | null;
  averageLow: number | null;
  averageMean: number | null;
  averageDiurnalRange: number | null;
  frostDays: number;
  heatSpikeDays: number;
  last7: TrendWindow;
  last14: TrendWindow;
  last30: TrendWindow;
  stale: boolean;
}

export interface SeasonSeries {
  summary: SeasonSummary;
  daily: DailyViticulture[];
}

export interface HistoricalAveragePoint {
  dayOfSeason: number;
  cumulativeGdd: number | null;
  precipitation: number | null;
}

export interface HistoricalAverage {
  years: number[];
  points: HistoricalAveragePoint[];
  summary: {
    cumulativeGdd: number;
    precipitation: number;
    frostDays: number;
    heatSpikeDays: number;
    averageDiurnalRange: number | null;
  } | null;
}

export interface VintageCandidate {
  year: number;
  series: SeasonSeries;
}

export interface VintageAnalog {
  year: number;
  score: number;
  rank: number;
  explanation: string;
  deltas: {
    gdd: number;
    precipitation: number;
    frostDays: number;
    heatSpikeDays: number;
    diurnalRange: number | null;
  };
}

export interface LocationSeason {
  location: LocationConfig;
  series: SeasonSeries;
  forecast: DailyViticulture[];
  currentTemperature: number | null;
  sources: WeatherSourceStatus[];
  warnings: string[];
}
