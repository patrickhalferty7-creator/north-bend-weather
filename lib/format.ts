import type { UnitSystem } from "@/lib/weather";

export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) {
    return "Unavailable";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

export function formatInteger(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "Unavailable";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDelta(value: number | null | undefined, suffix = ""): string {
  if (value == null || !Number.isFinite(value)) {
    return "No baseline";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, Math.abs(value) >= 10 ? 0 : 1)}${suffix ? ` ${suffix}` : ""}`;
}

export function temperatureSuffix(unit: UnitSystem): string {
  return unit === "imperial" ? "F" : "C";
}

export function precipitationSuffix(unit: UnitSystem): string {
  return unit === "imperial" ? "in" : "mm";
}

export function shortDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "Unavailable";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
