import type { LocationSeason, HistoricalAverage, VintageAnalog, VintageCandidate } from "@/lib/viticulture";
import type { SeasonWindow, UnitSystem, WeatherSourceStatus } from "@/lib/weather";

export interface DashboardRequest {
  year: number;
  unit: UnitSystem;
  compareYears: number[];
  currentDate?: string;
}

export interface DashboardResponse {
  generatedAt: string;
  currentDate: string;
  unit: UnitSystem;
  year: number;
  seasonWindow: SeasonWindow;
  compareYears: number[];
  primary: LocationSeason | null;
  regions: LocationSeason[];
  comparisonYears: VintageCandidate[];
  historicalAverage: HistoricalAverage;
  analogs: VintageAnalog[];
  sources: WeatherSourceStatus[];
  warnings: string[];
  error: string | null;
}
