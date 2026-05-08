import { describe, expect, it } from "vitest";
import { NORTH_BEND } from "@/lib/weather";
import { calculateDailyGdd, compareRegions, summarizeClimate } from "./calculations";
import type { DailyWeather } from "@/lib/weather";

function day(date: string, max: number, min: number, precipitation = 0): DailyWeather {
  return {
    date,
    temperatureMax: max,
    temperatureMin: min,
    temperatureMean: (max + min) / 2,
    precipitation,
    source: "open-meteo-history"
  };
}

describe("calculateDailyGdd", () => {
  it("calculates Fahrenheit GDD from the average of Tmax and Tmin", () => {
    expect(calculateDailyGdd({ temperatureMax: 70, temperatureMin: 50, unit: "imperial" })).toBe(10);
  });

  it("never returns negative GDD", () => {
    expect(calculateDailyGdd({ temperatureMax: 45, temperatureMin: 35, unit: "imperial" })).toBe(0);
  });
});

describe("compareRegions", () => {
  it("ranks the closest climate profile first", () => {
    const subject = summarizeClimate({
      location: NORTH_BEND,
      unit: "imperial",
      startDate: "2026-04-01",
      daily: [day("2026-04-01", 70, 50, 0.1), day("2026-04-02", 72, 52, 0)]
    });
    const close = summarizeClimate({
      location: { ...NORTH_BEND, id: "close", shortName: "Close" },
      unit: "imperial",
      startDate: "2026-04-01",
      daily: [day("2026-04-01", 69, 50, 0.1), day("2026-04-02", 73, 52, 0)]
    });
    const far = summarizeClimate({
      location: { ...NORTH_BEND, id: "far", shortName: "Far" },
      unit: "imperial",
      startDate: "2026-04-01",
      daily: [day("2026-04-01", 95, 75, 0), day("2026-04-02", 98, 76, 0)]
    });

    const comparisons = compareRegions({ subject, regions: [far, close], unit: "imperial" });
    expect(comparisons[0].summary.location.shortName).toBe("Close");
    expect(comparisons[0].similarityScore).toBeGreaterThan(comparisons[1].similarityScore);
  });
});
