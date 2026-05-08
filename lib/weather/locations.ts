import type { LocationConfig, LocationId } from "./types";

export const LOCATIONS: Record<LocationId, LocationConfig> = {
  "north-bend": {
    id: "north-bend",
    name: "North Bend, Washington",
    shortName: "North Bend",
    regionLabel: "Cascade foothills",
    latitude: 47.4957,
    longitude: -121.7868,
    timezone: "America/Los_Angeles"
  },
  willamette: {
    id: "willamette",
    name: "McMinnville, Oregon",
    shortName: "Willamette",
    regionLabel: "Willamette Valley proxy",
    latitude: 45.2101,
    longitude: -123.1987,
    timezone: "America/Los_Angeles"
  },
  burgundy: {
    id: "burgundy",
    name: "Beaune, France",
    shortName: "Burgundy",
    regionLabel: "Burgundy proxy",
    latitude: 47.026,
    longitude: 4.84,
    timezone: "Europe/Paris"
  }
};

export const CORE_LOCATION_IDS: LocationId[] = [
  "north-bend",
  "willamette",
  "burgundy"
];

export function getLocation(id: LocationId): LocationConfig {
  return LOCATIONS[id];
}
