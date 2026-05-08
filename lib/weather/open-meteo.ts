import { addDays } from "./dates";
import {
  precipitationUnitParam,
  temperatureUnitParam
} from "./units";
import type {
  CurrentConditions,
  DailyWeather,
  OpenMeteoDailyPayload,
  OpenMeteoForecastPayload,
  ProviderRequest,
  WeatherDataset,
  WeatherSourceStatus
} from "./types";
import { sourceStatus } from "./sources";

const ARCHIVE_ENDPOINT = "https://archive-api.open-meteo.com/v1/archive";
const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const DAILY_VARIABLES =
  "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum";
const FORECAST_REVALIDATE_SECONDS = 60 * 30;
const HISTORY_REVALIDATE_SECONDS = 60 * 60 * 6;

type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

export async function fetchOpenMeteoSeason(
  request: ProviderRequest
): Promise<WeatherDataset> {
  const warnings: string[] = [];
  const fetchedAt = new Date().toISOString();
  const isCurrentYear = request.endDate.slice(0, 4) === request.currentDate.slice(0, 4);

  const historical = await fetchArchive(request);
  let daily = historical;
  let forecastDaily: DailyWeather[] = [];
  let current: CurrentConditions | null = null;
  const sources: WeatherSourceStatus[] = [
    sourceStatus("open-meteo-history", "active", {
      dateRange: `${request.startDate} to ${request.endDate}`,
      lastUpdated: fetchedAt
    })
  ];

  if (isCurrentYear) {
    try {
      const forecast = await fetchForecast(request);
      current = forecast.current;
      forecastDaily = forecast.daily.filter((day) => day.date >= request.currentDate);
      daily = mergeDaily(
        historical,
        forecast.daily.filter(
          (day) => day.date >= request.startDate && day.date <= request.endDate
        )
      );
      sources.push(
        sourceStatus("open-meteo-forecast", "active", {
          dateRange: `${addDays(request.currentDate, -14)} to ${addDays(
            request.currentDate,
            7
          )}`,
          lastUpdated: fetchedAt
        })
      );
    } catch (error) {
      warnings.push(
        `Open-Meteo forecast unavailable: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
      sources.push(
        sourceStatus("open-meteo-forecast", "unavailable", {
          lastUpdated: fetchedAt,
          note: "Forecast refresh could not be reached; season metrics use historical daily data only."
        })
      );
    }
  } else {
    sources.push(sourceStatus("open-meteo-forecast", "idle"));
  }

  return {
    location: request.location,
    unit: request.unit,
    startDate: request.startDate,
    endDate: request.endDate,
    daily,
    forecastDaily,
    current,
    fetchedAt,
    sources,
    warnings
  };
}

async function fetchArchive(request: ProviderRequest): Promise<DailyWeather[]> {
  const url = new URL(ARCHIVE_ENDPOINT);
  url.searchParams.set("latitude", String(request.location.latitude));
  url.searchParams.set("longitude", String(request.location.longitude));
  url.searchParams.set("start_date", request.startDate);
  url.searchParams.set("end_date", request.endDate);
  url.searchParams.set("daily", DAILY_VARIABLES);
  url.searchParams.set("temperature_unit", temperatureUnitParam(request.unit));
  url.searchParams.set("precipitation_unit", precipitationUnitParam(request.unit));
  url.searchParams.set("timezone", "auto");

  const payload = await fetchJson<OpenMeteoDailyPayload>(url, {
    next: { revalidate: HISTORY_REVALIDATE_SECONDS }
  });
  return mapOpenMeteoDaily(payload, "open-meteo-history");
}

async function fetchForecast(
  request: ProviderRequest
): Promise<{ daily: DailyWeather[]; current: CurrentConditions | null }> {
  const url = new URL(FORECAST_ENDPOINT);
  url.searchParams.set("latitude", String(request.location.latitude));
  url.searchParams.set("longitude", String(request.location.longitude));
  url.searchParams.set("current", "temperature_2m,precipitation");
  url.searchParams.set("daily", DAILY_VARIABLES);
  url.searchParams.set("temperature_unit", temperatureUnitParam(request.unit));
  url.searchParams.set("precipitation_unit", precipitationUnitParam(request.unit));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("past_days", "14");
  url.searchParams.set("forecast_days", "7");

  const payload = await fetchJson<OpenMeteoForecastPayload>(url, {
    next: { revalidate: FORECAST_REVALIDATE_SECONDS }
  });

  const current = payload.current?.time
    ? {
        time: payload.current.time,
        temperature: payload.current.temperature_2m ?? null,
        precipitation: payload.current.precipitation ?? null,
        source: "open-meteo-forecast" as const
      }
    : null;

  return {
    daily: mapOpenMeteoDaily(payload, "open-meteo-forecast").map((day) => ({
      ...day,
      isForecast: day.date > request.currentDate
    })),
    current
  };
}

function mapOpenMeteoDaily(
  payload: OpenMeteoDailyPayload,
  source: DailyWeather["source"]
): DailyWeather[] {
  const time = payload.daily?.time ?? [];
  const max = payload.daily?.temperature_2m_max ?? [];
  const min = payload.daily?.temperature_2m_min ?? [];
  const mean = payload.daily?.temperature_2m_mean ?? [];
  const precipitation = payload.daily?.precipitation_sum ?? [];

  return time.flatMap((date, index) => {
    const temperatureMax = max[index];
    const temperatureMin = min[index];
    if (temperatureMax == null || temperatureMin == null) {
      return [];
    }

    return {
      date,
      temperatureMax,
      temperatureMin,
      temperatureMean: mean[index] ?? (temperatureMax + temperatureMin) / 2,
      precipitation: precipitation[index] ?? 0,
      source
    };
  });
}

function mergeDaily(primary: DailyWeather[], overlay: DailyWeather[]): DailyWeather[] {
  const merged = new Map<string, DailyWeather>();
  for (const day of primary) {
    merged.set(day.date, day);
  }
  for (const day of overlay) {
    merged.set(day.date, day);
  }
  return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchJson<T>(url: URL, init: NextFetchInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}
