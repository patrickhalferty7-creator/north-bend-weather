export type UnitSystem = "imperial" | "metric";

export interface LocationConfig {
  id: string;
  name: string;
  shortName: string;
  regionLabel: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  climateNote?: string;
  benchmark?: boolean;
}

export interface DailyWeather {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  temperatureMean: number;
  precipitation: number;
  source: "open-meteo-history" | "open-meteo-forecast" | "nasa-power";
}

export interface WeatherSourceStatus {
  id: string;
  label: string;
  url: string;
  state: "active" | "fallback" | "idle" | "unavailable" | "reference";
  note: string;
  dateRange?: string;
  lastUpdated?: string;
}

export interface SeasonWindow {
  year: number;
  startDate: string;
  endDate: string;
  dayOfSeason: number;
}

export interface ClimateSummary {
  location: LocationConfig;
  latestDate: string | null;
  days: number;
  cumulativeGdd: number;
  precipitation: number;
  averageHigh: number | null;
  averageLow: number | null;
  averageMean: number | null;
  averageDiurnalRange: number | null;
  frostDays: number;
  heatSpikeDays: number;
  last30Gdd: number;
  last30Precipitation: number;
  daily: DailyViticulture[];
  warnings: string[];
}

export interface DailyViticulture extends DailyWeather {
  gdd: number;
  cumulativeGdd: number;
  diurnalRange: number;
  frostRisk: boolean;
  heatSpike: boolean;
  dayOfSeason: number;
}

export interface RegionComparison {
  summary: ClimateSummary;
  similarityScore: number;
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
