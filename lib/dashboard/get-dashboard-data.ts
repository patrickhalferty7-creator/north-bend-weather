import {
  CORE_LOCATION_IDS,
  LOCATIONS,
  fetchNasaPowerSeason,
  fetchOpenMeteoSeason,
  getAnalogWindow,
  getNoaaSourceStatus,
  getNorthBendWeatherReference,
  getSeasonWindow,
  sourceStatus,
  todayInTimeZone,
  type LocationConfig,
  type ProviderRequest,
  type SeasonWindow,
  type UnitSystem,
  type WeatherDataset,
  type WeatherSourceStatus
} from "@/lib/weather";
import {
  buildHistoricalAverage,
  buildSeasonSeries,
  calculateVintageAnalogs,
  type DailyViticulture,
  type LocationSeason,
  type VintageCandidate
} from "@/lib/viticulture";
import type { DashboardRequest, DashboardResponse } from "./types";

const FIRST_ANALOG_YEAR = 2017;
const ANALOG_YEAR_LIMIT = 9;

export async function getDashboardData({
  year,
  unit,
  compareYears,
  currentDate = todayInTimeZone()
}: DashboardRequest): Promise<DashboardResponse> {
  const seasonWindow = getSeasonWindow(year, currentDate);
  const priorYears = getPriorYears(year, ANALOG_YEAR_LIMIT);
  const comparisonYearSet = normalizeCompareYears(compareYears, year, priorYears);
  const generatedAt = new Date().toISOString();

  const [regionResults, candidateResults] = await Promise.all([
    Promise.all(
      CORE_LOCATION_IDS.map((locationId) =>
        getLocationSeason({
          location: LOCATIONS[locationId],
          unit,
          window: seasonWindow,
          currentDate
        })
      )
    ),
    Promise.all(
      priorYears.map((candidateYear) =>
        getLocationSeason({
          location: LOCATIONS["north-bend"],
          unit,
          window: getAnalogWindow(candidateYear, seasonWindow),
          currentDate
        }).then((season) =>
          season && season.series.daily.length
            ? { year: candidateYear, series: season.series }
            : null
        )
      )
    )
  ]);

  const regions = regionResults.filter(Boolean) as LocationSeason[];
  const primaryRegion = regions.find((region) => region.location.id === "north-bend") ?? null;
  const primary =
    primaryRegion && primaryRegion.series.daily.length ? primaryRegion : null;
  const candidates = candidateResults.filter(Boolean) as VintageCandidate[];
  const comparisonYearsData = candidates.filter((candidate) =>
    comparisonYearSet.includes(candidate.year)
  );
  const historicalAverage = buildHistoricalAverage(candidates);
  const analogs = primary
    ? calculateVintageAnalogs({
        target: primary.series,
        candidates,
        limit: 3
      })
    : [];
  const sourceStatuses = mergeSources([
    ...regions.flatMap((region) => region.sources),
    getNoaaSourceStatus(),
    getNorthBendWeatherReference(),
    sourceStatus("nasa-power", candidates.some(hasNasaSource) ? "fallback" : "idle")
  ]);
  const warnings = [
    ...regions.flatMap((region) => region.warnings),
    ...candidateResults.flatMap((candidate) => (candidate ? [] : ["A prior vintage could not be loaded."]))
  ];

  return {
    generatedAt,
    currentDate,
    unit,
    year,
    seasonWindow,
    compareYears: comparisonYearSet,
    primary,
    regions,
    comparisonYears: comparisonYearsData,
    historicalAverage,
    analogs,
    sources: sourceStatuses,
    warnings: Array.from(new Set(warnings)),
    error: primary ? null : "North Bend season data is unavailable from the configured sources."
  };
}

function normalizeCompareYears(
  compareYears: number[],
  year: number,
  priorYears: number[]
): number[] {
  const defaults = [year - 1, year - 2, 2021, 2018];
  const requested = compareYears.length ? compareYears : defaults;
  const available = new Set(priorYears);
  return Array.from(new Set(requested))
    .filter((candidateYear) => available.has(candidateYear))
    .slice(0, 5);
}

function getPriorYears(year: number, limit: number): number[] {
  const years: number[] = [];
  for (let candidate = year - 1; candidate >= FIRST_ANALOG_YEAR; candidate -= 1) {
    years.push(candidate);
    if (years.length >= limit) {
      break;
    }
  }
  return years;
}

async function getLocationSeason({
  location,
  unit,
  window,
  currentDate
}: {
  location: LocationConfig;
  unit: UnitSystem;
  window: SeasonWindow;
  currentDate: string;
}): Promise<LocationSeason | null> {
  const request: ProviderRequest = {
    location,
    unit,
    startDate: window.startDate,
    endDate: window.endDate,
    currentDate
  };

  try {
    const dataset = await fetchOpenMeteoSeason(request);
    return datasetToLocationSeason(dataset, window.year, currentDate);
  } catch (error) {
    const reason = `Open-Meteo unavailable for ${location.shortName}: ${
      error instanceof Error ? error.message : "unknown error"
    }`;
    try {
      const fallback = await fetchNasaPowerSeason(request, reason);
      return datasetToLocationSeason(fallback, window.year, currentDate);
    } catch (fallbackError) {
      return {
        location,
        series: emptySeasonSeries({ location, unit, window, currentDate }),
        forecast: [],
        currentTemperature: null,
        sources: [
          sourceStatus("open-meteo-history", "unavailable", { note: reason }),
          sourceStatus("open-meteo-forecast", "unavailable"),
          sourceStatus("nasa-power", "unavailable", {
            note:
              fallbackError instanceof Error
                ? fallbackError.message
                : "NASA POWER fallback unavailable."
          })
        ],
        warnings: [
          reason,
          fallbackError instanceof Error
            ? fallbackError.message
            : "NASA POWER fallback unavailable."
        ]
      };
    }
  }
}

function datasetToLocationSeason(
  dataset: WeatherDataset,
  year: number,
  currentDate: string
): LocationSeason {
  const series = buildSeasonSeries({
    daily: dataset.daily,
    location: dataset.location,
    unit: dataset.unit,
    year,
    startDate: dataset.startDate,
    endDate: dataset.endDate,
    currentDate
  });
  const forecast = buildForecastSeries(dataset, year, currentDate);

  return {
    location: dataset.location,
    series,
    forecast,
    currentTemperature: dataset.current?.temperature ?? null,
    sources: dataset.sources,
    warnings: dataset.warnings
  };
}

function buildForecastSeries(
  dataset: WeatherDataset,
  year: number,
  currentDate: string
): DailyViticulture[] {
  if (!dataset.forecastDaily.length) {
    return [];
  }
  const endDate = dataset.forecastDaily.at(-1)?.date ?? dataset.endDate;
  const combined = [...dataset.daily, ...dataset.forecastDaily];
  return buildSeasonSeries({
    daily: combined,
    location: dataset.location,
    unit: dataset.unit,
    year,
    startDate: dataset.startDate,
    endDate,
    currentDate
  }).daily.filter((day) => day.date >= currentDate);
}

function emptySeasonSeries({
  location,
  unit,
  window,
  currentDate
}: {
  location: LocationConfig;
  unit: UnitSystem;
  window: SeasonWindow;
  currentDate: string;
}) {
  return buildSeasonSeries({
    daily: [],
    location,
    unit,
    year: window.year,
    startDate: window.startDate,
    endDate: window.endDate,
    currentDate
  });
}

function mergeSources(sources: WeatherSourceStatus[]): WeatherSourceStatus[] {
  const priority = {
    active: 5,
    fallback: 4,
    reference: 3,
    unavailable: 2,
    idle: 1
  } satisfies Record<WeatherSourceStatus["state"], number>;
  const merged = new Map<string, WeatherSourceStatus>();

  for (const source of sources) {
    const existing = merged.get(source.id);
    if (!existing || priority[source.state] > priority[existing.state]) {
      merged.set(source.id, source);
    }
  }

  return Array.from(merged.values());
}

function hasNasaSource(candidate: VintageCandidate): boolean {
  return candidate.series.daily.some((day) => day.source === "nasa-power");
}
