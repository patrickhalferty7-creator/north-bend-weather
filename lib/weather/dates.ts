export const SEASON_START = { month: 4, day: 1 };
export const SEASON_END = { month: 10, day: 31 };

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

export function daysBetweenInclusive(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Math.max(0, Math.floor((end - start) / 86400000) + 1);
}

export function getSeasonWindow(year: number, currentDate: string) {
  const startDate = dateForYear(year, SEASON_START.month, SEASON_START.day);
  const seasonEnd = dateForYear(year, SEASON_END.month, SEASON_END.day);
  const currentYear = Number(currentDate.slice(0, 4));
  const endDate = year === currentYear && currentDate < seasonEnd ? currentDate : seasonEnd;

  return {
    year,
    startDate,
    endDate: endDate < startDate ? startDate : endDate,
    dayOfSeason: daysBetweenInclusive(startDate, endDate < startDate ? startDate : endDate)
  };
}
