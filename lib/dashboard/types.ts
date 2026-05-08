import type { ClimateSummary, RegionComparison, SeasonWindow, UnitSystem, WeatherSourceStatus } from "@/lib/weather";

export interface ClimateDashboardResponse {
  generatedAt: string;
  currentDate: string;
  year: number;
  unit: UnitSystem;
  seasonWindow: SeasonWindow;
  subject: ClimateSummary;
  comparisons: RegionComparison[];
  sources: WeatherSourceStatus[];
  warnings: string[];
}
