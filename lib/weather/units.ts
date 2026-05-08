import type { UnitSystem } from "./types";

export function temperatureUnitParam(unit: UnitSystem): "fahrenheit" | "celsius" {
  return unit === "imperial" ? "fahrenheit" : "celsius";
}

export function precipitationUnitParam(unit: UnitSystem): "inch" | "mm" {
  return unit === "imperial" ? "inch" : "mm";
}

export function temperatureSuffix(unit: UnitSystem): string {
  return unit === "imperial" ? "F" : "C";
}

export function precipitationSuffix(unit: UnitSystem): string {
  return unit === "imperial" ? "in" : "mm";
}
