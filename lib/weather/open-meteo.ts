import { precipitationUnitParam, temperatureUnitParam } from "./units";
import type { DailyWeather, LocationConfig, UnitSystem } from "./types";

const ENDPOINT = "https://archive-api.open-meteo.com/v1/archive";

interface OpenMeteoPayload {
  daily?: {
    time?: string[];
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    temperature_2m_mean?: Array<number | null>;
    precipitation_sum?: Array<number | null>;
  };
}

export async function fetchOpenMeteoDaily({
  location,
  unit,
  startDate,
  endDate
}: {
  location: LocationConfig;
  unit: UnitSystem;
  startDate: string;
  endDate: string;
}): Promise<DailyWeather[]> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum"
  );
  url.searchParams.set("temperature_unit", temperatureUnitParam(unit));
  url.searchParams.set("precipitation_unit", precipitationUnitParam(unit));
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url, {
    next: { revalidate: 60 * 60 * 6 }
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo failed for ${location.shortName}: ${response.status}`);
  }

  const payload = (await response.json()) as OpenMeteoPayload;
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
      source: "open-meteo-history" as const
    };
  });
}
