import {
  GLOBAL_WINE_REGIONS,
  NORTH_BEND,
  fetchOpenMeteoDaily,
  geocodePostalArea,
  getSeasonWindow,
  todayInTimeZone,
  type ClimateSummary,
  type LocationConfig,
  type UnitSystem
} from "@/lib/weather";
import { compareRegions, summarizeClimate } from "@/lib/viticulture";
import type { ClimateDashboardResponse } from "./types";

export async function getClimateDashboard({
  postalCode,
  country = "us",
  unit = "imperial",
  year,
  currentDate = todayInTimeZone()
}: {
  postalCode?: string;
  country?: string;
  unit?: UnitSystem;
  year?: number;
  currentDate?: string;
}): Promise<ClimateDashboardResponse> {
  const requestedYear = year ?? Number(currentDate.slice(0, 4));
  const seasonWindow = getSeasonWindow(requestedYear, currentDate);
  const warnings: string[] = [];
  const subjectLocation = await resolveSubjectLocation({ postalCode, country, warnings });
  const locations = GLOBAL_WINE_REGIONS;

  const [subject, ...regionSummaries] = await Promise.all([
    fetchSummary(subjectLocation, unit, seasonWindow.startDate, seasonWindow.endDate),
    ...locations.map((location) =>
      fetchSummary(location, unit, seasonWindow.startDate, seasonWindow.endDate)
    )
  ]);

  const comparisons = compareRegions({
    subject,
    regions: regionSummaries.filter((summary) => summary.days > 0),
    unit
  });
  const regionWarnings = regionSummaries.flatMap((summary) => summary.warnings);

  return {
    generatedAt: new Date().toISOString(),
    currentDate,
    year: requestedYear,
    unit,
    seasonWindow,
    subject,
    comparisons,
    sources: [
      {
        id: "zippopotam",
        label: "Zippopotam.us Postal Geocoding",
        url: "https://api.zippopotam.us/",
        state: postalCode ? "active" : "idle",
        note: postalCode
          ? "Used to convert the entered area / ZIP code into latitude and longitude."
          : "Idle because the default North Bend location is being used.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: "open-meteo-history",
        label: "Open-Meteo Historical Weather API",
        url: "https://open-meteo.com/en/docs/historical-weather-api",
        state: "active",
        note: "Daily max, min, mean temperature and precipitation for all climates.",
        dateRange: `${seasonWindow.startDate} to ${seasonWindow.endDate}`,
        lastUpdated: new Date().toISOString()
      }
    ],
    warnings: Array.from(new Set([...warnings, ...subject.warnings, ...regionWarnings]))
  };
}

export async function getDashboardData({
  postalCode,
  country,
  unit,
  year,
  currentDate
}: {
  postalCode?: string;
  country?: string;
  unit?: UnitSystem;
  year?: number;
  compareYears?: number[];
  currentDate?: string;
}): Promise<ClimateDashboardResponse> {
  return getClimateDashboard({
    postalCode,
    country,
    unit,
    year,
    currentDate
  });
}

async function resolveSubjectLocation({
  postalCode,
  country,
  warnings
}: {
  postalCode?: string;
  country: string;
  warnings: string[];
}): Promise<LocationConfig> {
  if (!postalCode?.trim()) {
    return {
      ...NORTH_BEND,
      id: "subject-north-bend",
      shortName: "North Bend"
    };
  }

  try {
    const geocoded = await geocodePostalArea({ postalCode, country });
    return {
      ...geocoded,
      id: "subject",
      shortName: geocoded.shortName || postalCode,
      regionLabel: geocoded.regionLabel
    };
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Postal area geocoding failed.");
    warnings.push("Defaulted to North Bend so the comparison can still run.");
    return {
      ...NORTH_BEND,
      id: "subject-north-bend",
      shortName: "North Bend"
    };
  }
}

async function fetchSummary(
  location: LocationConfig,
  unit: UnitSystem,
  startDate: string,
  endDate: string
): Promise<ClimateSummary> {
  try {
    const daily = await fetchOpenMeteoDaily({ location, unit, startDate, endDate });
    return summarizeClimate({ location, daily, unit, startDate });
  } catch (error) {
    return summarizeClimate({
      location,
      daily: [],
      unit,
      startDate,
      warnings: [
        error instanceof Error
          ? error.message
          : `Climate data unavailable for ${location.shortName}.`
      ]
    });
  }
}
