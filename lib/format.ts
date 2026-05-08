import type { UnitSystem } from "@/lib/weather";

export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  if (value == null || !Number.isFinite(value)) {
    return "Unavailable";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    ...options
  }).format(value);
}

export function formatMetricValue(
  value: number | null | undefined,
  suffix: string,
  options: Intl.NumberFormatOptions = {}
): string {
  if (value == null || !Number.isFinite(value)) {
    return "Unavailable";
  }
  return `${formatNumber(value, options)} ${suffix}`;
}

export function formatDelta(value: number | null | undefined, suffix = ""): string {
  if (value == null || !Number.isFinite(value)) {
    return "No baseline";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}${suffix ? ` ${suffix}` : ""}`;
}

export function tempSuffix(unit: UnitSystem): string {
  return unit === "imperial" ? "F" : "C";
}

export function rainSuffix(unit: UnitSystem): string {
  return unit === "imperial" ? "in" : "mm";
}

export function shortDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "Unavailable";
  }
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function dateRangeLabel(startDate: string, endDate: string): string {
  return `${shortDate(startDate)} to ${shortDate(endDate)}`;
}

export function sourceStateLabel(state: string): string {
  return state.replaceAll("-", " ").toUpperCase();
}
