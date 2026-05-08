import type { UnitSystem } from "./types";

export function temperatureUnitParam(unit: UnitSystem): "fahrenheit" | "celsius" {
  return unit === "imperial" ? "fahrenheit" : "celsius";
}

export function precipitationUnitParam(unit: UnitSystem): "inch" | "mm" {
  return unit === "imperial" ? "inch" : "mm";
}

export function temperatureLabel(unit: UnitSystem): string {
  return unit === "imperial" ? "F" : "C";
}

export function precipitationLabel(unit: UnitSystem): string {
  return unit === "imperial" ? "in" : "mm";
}

export function celsiusToUnit(value: number, unit: UnitSystem): number {
  return unit === "imperial" ? value * 1.8 + 32 : value;
}

export function millimetersToUnit(value: number, unit: UnitSystem): number {
  return unit === "imperial" ? value / 25.4 : value;
}
