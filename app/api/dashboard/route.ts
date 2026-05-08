import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import { todayInTimeZone, type UnitSystem } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const currentDate = todayInTimeZone();
  const currentYear = Number(currentDate.slice(0, 4));
  const requestedYear = Number(url.searchParams.get("year") ?? currentYear);
  const year = Number.isFinite(requestedYear)
    ? Math.min(Math.max(requestedYear, 2017), currentYear)
    : currentYear;
  const unitParam = url.searchParams.get("unit");
  const unit: UnitSystem = unitParam === "metric" ? "metric" : "imperial";
  const compareYearsParam = url.searchParams.get("compareYears");
  const compareYears = compareYearsParam
    ? compareYearsParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
    : [];

  const data = await getDashboardData({
    year,
    unit,
    compareYears,
    currentDate
  });

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600"
    }
  });
}
