import { NextResponse } from "next/server";
import { getClimateDashboard } from "@/lib/dashboard";
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
  const unit: UnitSystem = url.searchParams.get("unit") === "metric" ? "metric" : "imperial";
  const postalCode = url.searchParams.get("postalCode") ?? undefined;
  const country = url.searchParams.get("country") ?? "us";

  const data = await getClimateDashboard({
    postalCode,
    country,
    unit,
    year,
    currentDate
  });

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600"
    }
  });
}
