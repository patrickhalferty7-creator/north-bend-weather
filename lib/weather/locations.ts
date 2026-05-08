import type { LocationConfig } from "./types";

export const NORTH_BEND: LocationConfig = {
  id: "north-bend",
  name: "North Bend, Washington",
  shortName: "North Bend",
  regionLabel: "Cascade foothills",
  country: "United States",
  latitude: 47.4957,
  longitude: -121.7868,
  timezone: "America/Los_Angeles",
  climateNote: "Cool maritime-influenced foothill site with high rainfall and low heat-spike pressure."
};

export const GLOBAL_WINE_REGIONS: LocationConfig[] = [
  {
    id: "willamette",
    name: "McMinnville, Oregon",
    shortName: "Willamette Valley",
    regionLabel: "Oregon, USA",
    country: "United States",
    latitude: 45.2101,
    longitude: -123.1987,
    timezone: "America/Los_Angeles",
    benchmark: true,
    climateNote: "Cool-climate Pinot Noir benchmark with a mild, dry-summer growing season."
  },
  {
    id: "napa",
    name: "Napa, California",
    shortName: "Napa Valley",
    regionLabel: "California, USA",
    country: "United States",
    latitude: 38.2975,
    longitude: -122.2869,
    timezone: "America/Los_Angeles",
    benchmark: true,
    climateNote: "Warm Mediterranean valley climate with reliable heat accumulation."
  },
  {
    id: "burgundy",
    name: "Beaune, France",
    shortName: "Burgundy",
    regionLabel: "Cote d'Or, France",
    country: "France",
    latitude: 47.026,
    longitude: 4.84,
    timezone: "Europe/Paris",
    benchmark: true,
    climateNote: "Continental cool-climate benchmark for Pinot Noir and Chardonnay."
  },
  {
    id: "bordeaux",
    name: "Bordeaux, France",
    shortName: "Bordeaux",
    regionLabel: "Gironde, France",
    country: "France",
    latitude: 44.8378,
    longitude: -0.5792,
    timezone: "Europe/Paris",
    benchmark: true,
    climateNote: "Maritime-influenced red wine region with moderate heat and meaningful rainfall."
  },
  {
    id: "champagne",
    name: "Reims, France",
    shortName: "Champagne",
    regionLabel: "Marne, France",
    country: "France",
    latitude: 49.2583,
    longitude: 4.0317,
    timezone: "Europe/Paris",
    benchmark: true,
    climateNote: "Marginal cool-climate sparkling wine benchmark."
  },
  {
    id: "rioja",
    name: "Logrono, Spain",
    shortName: "Rioja",
    regionLabel: "La Rioja, Spain",
    country: "Spain",
    latitude: 42.4627,
    longitude: -2.44499,
    timezone: "Europe/Madrid",
    benchmark: true,
    climateNote: "Warm continental-Mediterranean Tempranillo benchmark."
  },
  {
    id: "tuscany",
    name: "Montalcino, Italy",
    shortName: "Tuscany",
    regionLabel: "Montalcino, Italy",
    country: "Italy",
    latitude: 43.0583,
    longitude: 11.489,
    timezone: "Europe/Rome",
    benchmark: true,
    climateNote: "Warm hillside Sangiovese climate with strong summer ripening."
  },
  {
    id: "mosel",
    name: "Bernkastel-Kues, Germany",
    shortName: "Mosel",
    regionLabel: "Rhineland-Palatinate, Germany",
    country: "Germany",
    latitude: 49.916,
    longitude: 7.0766,
    timezone: "Europe/Berlin",
    benchmark: true,
    climateNote: "Cool Riesling benchmark with low heat spikes and long ripening."
  },
  {
    id: "mendoza",
    name: "Mendoza, Argentina",
    shortName: "Mendoza",
    regionLabel: "Cuyo, Argentina",
    country: "Argentina",
    latitude: -32.8895,
    longitude: -68.8458,
    timezone: "America/Argentina/Mendoza",
    benchmark: true,
    climateNote: "Arid high-desert Malbec climate with large diurnal range."
  },
  {
    id: "barossa",
    name: "Tanunda, Australia",
    shortName: "Barossa",
    regionLabel: "South Australia",
    country: "Australia",
    latitude: -34.5236,
    longitude: 138.9597,
    timezone: "Australia/Adelaide",
    benchmark: true,
    climateNote: "Warm dry Shiraz benchmark with frequent heat accumulation."
  },
  {
    id: "stellenbosch",
    name: "Stellenbosch, South Africa",
    shortName: "Stellenbosch",
    regionLabel: "Western Cape, South Africa",
    country: "South Africa",
    latitude: -33.9321,
    longitude: 18.8602,
    timezone: "Africa/Johannesburg",
    benchmark: true,
    climateNote: "Mediterranean Cape climate moderated by ocean influence."
  },
  {
    id: "marlborough",
    name: "Blenheim, New Zealand",
    shortName: "Marlborough",
    regionLabel: "South Island, New Zealand",
    country: "New Zealand",
    latitude: -41.5134,
    longitude: 173.9612,
    timezone: "Pacific/Auckland",
    benchmark: true,
    climateNote: "Bright cool-climate Sauvignon Blanc benchmark with marked diurnal range."
  }
];
