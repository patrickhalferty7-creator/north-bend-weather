import { compactDate } from "./dates";
import { celsiusToUnit, millimetersToUnit } from "./units";
import type { DailyWeather, ProviderRequest, WeatherDataset } from "./types";
import { sourceStatus } from "./sources";

const NASA_POWER_ENDPOINT =
  "https://power.larc.nasa.gov/api/temporal/daily/point";

type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

interface NasaPowerPayload {
  properties?: {
    parameter?: {
      T2M_MAX?: Record<string, number>;
      T2M_MIN?: Record<string, number>;
      T2M?: Record<string, number>;
      PRECTOTCORR?: Record<string, number>;
    };
  };
}

export async function fetchNasaPowerSeason(
  request: ProviderRequest,
  reason: string
): Promise<WeatherDataset> {
  const url = new URL(NASA_POWER_ENDPOINT);
  url.searchParams.set("parameters", "T2M_MAX,T2M_MIN,T2M,PRECTOTCORR");
  url.searchParams.set("community", "AG");
  url.searchParams.set("longitude", String(request.location.longitude));
  url.searchParams.set("latitude", String(request.location.latitude));
  url.searchParams.set("start", compactDate(request.startDate));
  url.searchParams.set("end", compactDate(request.endDate));
  url.searchParams.set("format", "JSON");

  const response = await fetch(url, {
    next: { revalidate: 60 * 60 * 12 }
  } satisfies NextFetchInit);

  if (!response.ok) {
    throw new Error(`NASA POWER fallback failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as NasaPowerPayload;
  const daily = mapNasaDaily(payload, request.unit);
  const fetchedAt = new Date().toISOString();

  return {
    location: request.location,
    unit: request.unit,
    startDate: request.startDate,
    endDate: request.endDate,
    daily,
    forecastDaily: [],
    current: null,
    fetchedAt,
    sources: [
      sourceStatus("open-meteo-history", "unavailable", {
        note: reason
      }),
      sourceStatus("nasa-power", "fallback", {
        dateRange: `${request.startDate} to ${request.endDate}`,
        lastUpdated: fetchedAt
      }),
      sourceStatus("open-meteo-forecast", "unavailable")
    ],
    warnings: [reason, "NASA POWER values are gridded and converted from C/mm units."]
  };
}

function mapNasaDaily(payload: NasaPowerPayload, unit: ProviderRequest["unit"]): DailyWeather[] {
  const params = payload.properties?.parameter;
  if (!params?.T2M_MAX || !params.T2M_MIN || !params.T2M) {
    return [];
  }

  return Object.keys(params.T2M)
    .sort()
    .flatMap((dateKey) => {
      const max = scrubNasaValue(params.T2M_MAX?.[dateKey]);
      const min = scrubNasaValue(params.T2M_MIN?.[dateKey]);
      const mean = scrubNasaValue(params.T2M?.[dateKey]);
      if (max == null || min == null || mean == null) {
        return [];
      }

      const isoDate = `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6)}`;
      return {
        date: isoDate,
        temperatureMax: celsiusToUnit(max, unit),
        temperatureMin: celsiusToUnit(min, unit),
        temperatureMean: celsiusToUnit(mean, unit),
        precipitation: millimetersToUnit(
          scrubNasaValue(params.PRECTOTCORR?.[dateKey]) ?? 0,
          unit
        ),
        source: "nasa-power" as const
      };
    });
}

function scrubNasaValue(value: number | undefined): number | null {
  if (value == null || value <= -900) {
    return null;
  }
  return value;
}
