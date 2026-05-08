import type { SeasonWindow } from "./types";

export const DEFAULT_SEASON_START = { month: 4, day: 1 };
export const DEFAULT_SEASON_END = { month: 10, day: 31 };

export function todayInTimeZone(timezone = "America/Los_Angeles"): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function dateForYear(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function compactDate(isoDate: string): string {
  return isoDate.replaceAll("-", "");
}

export function daysBetweenInclusive(startDate: string, endDate: string): number {
  const start = parseIsoDate(startDate).getTime();
  const end = parseIsoDate(endDate).getTime();
  return Math.max(0, Math.floor((end - start) / 86400000) + 1);
}

export function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

export function minIsoDate(a: string, b: string): string {
  return a <= b ? a : b;
}

export function maxIsoDate(a: string, b: string): string {
  return a >= b ? a : b;
}

export function replaceYear(isoDate: string, year: number): string {
  return `${year}${isoDate.slice(4)}`;
}

export function getSeasonWindow(year: number, currentDate: string): SeasonWindow {
  const currentYear = Number(currentDate.slice(0, 4));
  const startDate = dateForYear(
    year,
    DEFAULT_SEASON_START.month,
    DEFAULT_SEASON_START.day
  );
  const seasonEnd = dateForYear(year, DEFAULT_SEASON_END.month, DEFAULT_SEASON_END.day);
  const isCurrentYear = year === currentYear;
  const endDate = isCurrentYear ? minIsoDate(currentDate, seasonEnd) : seasonEnd;
  const clampedEndDate = maxIsoDate(endDate, startDate);

  return {
    year,
    startDate,
    endDate: clampedEndDate,
    isCurrentYear,
    isCompleteSeason: clampedEndDate >= seasonEnd,
    dayOfSeason: daysBetweenInclusive(startDate, clampedEndDate)
  };
}

export function getAnalogWindow(year: number, targetWindow: SeasonWindow): SeasonWindow {
  const startDate = dateForYear(
    year,
    DEFAULT_SEASON_START.month,
    DEFAULT_SEASON_START.day
  );
  const targetEndMonthDay = targetWindow.endDate.slice(5);
  const analogEnd = `${year}-${targetEndMonthDay}`;
  const seasonEnd = dateForYear(year, DEFAULT_SEASON_END.month, DEFAULT_SEASON_END.day);
  const endDate = minIsoDate(maxIsoDate(analogEnd, startDate), seasonEnd);

  return {
    year,
    startDate,
    endDate,
    isCurrentYear: false,
    isCompleteSeason: endDate >= seasonEnd,
    dayOfSeason: daysBetweenInclusive(startDate, endDate)
  };
}

export function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
