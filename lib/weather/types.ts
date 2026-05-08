export type UnitSystem = "imperial" | "metric";

export type LocationId = "north-bend" | "willamette" | "burgundy";

export type WeatherSourceId =
  | "open-meteo-history"
  | "open-meteo-forecast"
  | "noaa-cdo"
  | "nasa-power"
  | "north-bend-weather";

export type WeatherSourceState =
  | "active"
  | "fallback"
  | "idle"
  | "unavailable"
  | "reference";

export interface LocationConfig {
  id: LocationId;
  name: string;
  shortName: string;
  regionLabel: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface DailyWeather {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  temperatureMean: number;
  precipitation: number;
  source: WeatherSourceId;
  isForecast?: boolean;
}

export interface CurrentConditions {
  time: string;
  temperature: number | null;
  precipitation: number | null;
  source: WeatherSourceId;
}

export interface WeatherDataset {
  location: LocationConfig;
  unit: UnitSystem;
  startDate: string;
  endDate: string;
  daily: DailyWeather[];
  forecastDaily: DailyWeather[];
  current: CurrentConditions | null;
  fetchedAt: string;
  sources: WeatherSourceStatus[];
  warnings: string[];
}

export interface WeatherSourceStatus {
  id: WeatherSourceId;
  label: string;
  url: string;
  state: WeatherSourceState;
  dateRange?: string;
  lastUpdated?: string;
  reliability: string;
  note: string;
}

export interface SeasonWindow {
  year: number;
  startDate: string;
  endDate: string;
  isCurrentYear: boolean;
  isCompleteSeason: boolean;
  dayOfSeason: number;
}

export interface ProviderRequest {
  location: LocationConfig;
  unit: UnitSystem;
  startDate: string;
  endDate: string;
  currentDate: string;
}

export interface OpenMeteoDailyPayload {
  latitude: number;
  longitude: number;
  generationtime_ms?: number;
  utc_offset_seconds?: number;
  timezone?: string;
  daily?: {
    time?: string[];
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    temperature_2m_mean?: Array<number | null>;
    precipitation_sum?: Array<number | null>;
  };
}

export interface OpenMeteoForecastPayload extends OpenMeteoDailyPayload {
  current?: {
    time?: string;
    temperature_2m?: number | null;
    precipitation?: number | null;
  };
}
