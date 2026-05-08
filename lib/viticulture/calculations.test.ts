import { describe, expect, it } from "vitest";
import { LOCATIONS } from "@/lib/weather";
import {
  buildSeasonSeries,
  calculateDailyGdd,
  calculateVintageAnalogs
} from "./calculations";
import type { DailyWeather } from "@/lib/weather";

const location = LOCATIONS["north-bend"];

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
  it("uses max(((Tmax + Tmin) / 2) - base, 0) for Fahrenheit", () => {
    expect(
      calculateDailyGdd({
        temperatureMax: 70,
        temperatureMin: 50,
        unit: "imperial"
      })
    ).toBe(10);
  });

  it("never returns negative GDD", () => {
    expect(
      calculateDailyGdd({
        temperatureMax: 48,
        temperatureMin: 36,
        unit: "imperial"
      })
    ).toBe(0);
  });

  it("supports Celsius base 10", () => {
    expect(
      calculateDailyGdd({
        temperatureMax: 24,
        temperatureMin: 12,
        unit: "metric"
      })
    ).toBe(8);
  });
});

describe("buildSeasonSeries", () => {
  it("computes cumulative GDD, frost days, heat days, and precipitation", () => {
    const series = buildSeasonSeries({
      daily: [
        day("2026-04-01", 70, 50, 0.1),
        day("2026-04-02", 91, 31, 0),
        day("2026-04-03", 55, 45, 0.2)
      ],
      location,
      unit: "imperial",
      year: 2026,
      startDate: "2026-04-01",
      endDate: "2026-04-03",
      currentDate: "2026-04-03"
    });

    expect(series.daily.map((entry) => entry.cumulativeGdd)).toEqual([10, 21, 21]);
    expect(series.summary.frostDays).toBe(1);
    expect(series.summary.heatSpikeDays).toBe(1);
    expect(series.summary.precipitation).toBe(0.3);
  });
});

describe("calculateVintageAnalogs", () => {
  it("ranks closest years by weighted distance", () => {
    const target = buildSeasonSeries({
      daily: [day("2026-04-01", 70, 50, 0.1), day("2026-04-02", 72, 52, 0)],
      location,
      unit: "imperial",
      year: 2026,
      startDate: "2026-04-01",
      endDate: "2026-04-02",
      currentDate: "2026-04-02"
    });
    const close = buildSeasonSeries({
      daily: [day("2021-04-01", 70, 49, 0.12), day("2021-04-02", 73, 52, 0)],
      location,
      unit: "imperial",
      year: 2021,
      startDate: "2021-04-01",
      endDate: "2021-04-02",
      currentDate: "2026-04-02"
    });
    const distant = buildSeasonSeries({
      daily: [day("2018-04-01", 45, 31, 2), day("2018-04-02", 48, 32, 1)],
      location,
      unit: "imperial",
      year: 2018,
      startDate: "2018-04-01",
      endDate: "2018-04-02",
      currentDate: "2026-04-02"
    });

    const analogs = calculateVintageAnalogs({
      target,
      candidates: [
        { year: 2018, series: distant },
        { year: 2021, series: close }
      ],
      limit: 2
    });

    expect(analogs[0].year).toBe(2021);
    expect(analogs[0].score).toBeGreaterThan(analogs[1].score);
  });
});
