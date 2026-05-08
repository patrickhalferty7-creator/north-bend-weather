import type { WeatherSourceStatus } from "./types";
import { sourceStatus } from "./sources";

const NOAA_ENDPOINT = "https://www.ncei.noaa.gov/cdo-web/api/v2/data";

type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

export function getNoaaSourceStatus(): WeatherSourceStatus {
  const hasToken = Boolean(process.env.NOAA_TOKEN);
  const stationId = process.env.NOAA_STATION_ID;

  if (!hasToken) {
    return sourceStatus("noaa-cdo", "idle", {
      note: "Set NOAA_TOKEN to enable CDO station validation."
    });
  }

  if (!stationId) {
    return sourceStatus("noaa-cdo", "idle", {
      note: "NOAA_TOKEN is present. Set NOAA_STATION_ID to attach a specific validation station."
    });
  }

  return sourceStatus("noaa-cdo", "reference", {
    note: `Configured for station ${stationId}.`
  });
}

export async function fetchNoaaDailyValidation({
  startDate,
  endDate,
  stationId = process.env.NOAA_STATION_ID,
  token = process.env.NOAA_TOKEN
}: {
  startDate: string;
  endDate: string;
  stationId?: string;
  token?: string;
}) {
  if (!token || !stationId) {
    return null;
  }

  const url = new URL(NOAA_ENDPOINT);
  url.searchParams.set("datasetid", "GHCND");
  url.searchParams.set("stationid", stationId);
  url.searchParams.set("datatypeid", "TMAX,TMIN,PRCP");
  url.searchParams.set("startdate", startDate);
  url.searchParams.set("enddate", endDate);
  url.searchParams.set("units", "standard");
  url.searchParams.set("limit", "1000");

  const response = await fetch(url, {
    headers: {
      token
    },
    next: { revalidate: 60 * 60 * 12 }
  } satisfies NextFetchInit);

  if (!response.ok) {
    throw new Error(`NOAA CDO validation failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
