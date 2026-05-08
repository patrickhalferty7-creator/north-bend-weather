import type { WeatherSourceStatus } from "./types";
import { sourceStatus } from "./sources";

export function getNorthBendWeatherReference(): WeatherSourceStatus {
  return sourceStatus("north-bend-weather", "reference", {
    note: "Linked for local live-weather context. Metrics are not scraped from the site."
  });
}
