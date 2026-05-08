import { DashboardApp } from "@/components/dashboard/DashboardApp";
import { getDashboardData } from "@/lib/dashboard";
import { todayInTimeZone } from "@/lib/weather";

export default async function Home() {
  const currentDate = todayInTimeZone();
  const currentYear = Number(currentDate.slice(0, 4));
  const initialData = await getDashboardData({
    year: currentYear,
    unit: "imperial",
    compareYears: [currentYear - 1, currentYear - 2, 2021, 2018],
    currentDate
  });

  return (
    <DashboardApp
      initialYear={currentYear}
      currentYear={currentYear}
      initialData={initialData}
    />
  );
}
