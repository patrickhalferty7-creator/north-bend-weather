import type { WeatherSourceStatus } from "./types";

export const SOURCE_DEFINITIONS: Record<WeatherSourceStatus["id"], Omit<WeatherSourceStatus, "state">> = {
  "open-meteo-history": {
    id: "open-meteo-history",
    label: "Open-Meteo Historical Weather API",
    url: "https://open-meteo.com/en/docs/historical-weather-api",
    reliability:
      "Primary reanalysis source for daily temperature and precipitation. Good for regional climate comparisons, not a substitute for an on-site vineyard sensor.",
    note: "Daily max, min, mean temperature and precipitation are fetched with timezone=auto."
  },
  "open-meteo-forecast": {
    id: "open-meteo-forecast",
    label: "Open-Meteo Forecast API",
    url: "https://open-meteo.com/",
    reliability:
      "Primary source for current conditions and near-term daily forecast context.",
    note: "Used to refresh the current part of the season and the forward-looking daily strip."
  },
  "noaa-cdo": {
    id: "noaa-cdo",
    label: "NOAA NCEI Climate Data Online",
    url: "https://www.ncdc.noaa.gov/cdo-web/webservices/v2",
    reliability:
      "US station-based validation source when a token and station are configured.",
    note: "Requires NOAA_TOKEN. Optional NOAA_STATION_ID can pin validation to a station."
  },
  "nasa-power": {
    id: "nasa-power",
    label: "NASA POWER Daily API",
    url: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
    reliability:
      "Global gridded fallback and cross-check source for agroclimatology variables.",
    note: "Used only if Open-Meteo season data cannot be fetched."
  },
  "north-bend-weather": {
    id: "north-bend-weather",
    label: "North Bend Weather",
    url: "https://www.northbendweather.com/",
    reliability:
      "Local live-weather reference for North Bend conditions.",
    note: "Linked as a local reference; the app avoids aggressive scraping."
  }
};

export function sourceStatus(
  id: WeatherSourceStatus["id"],
  state: WeatherSourceStatus["state"],
  extra: Partial<WeatherSourceStatus> = {}
): WeatherSourceStatus {
  return {
    ...SOURCE_DEFINITIONS[id],
    state,
    ...extra
  };
}
