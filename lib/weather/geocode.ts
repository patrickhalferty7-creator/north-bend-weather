import type { LocationConfig } from "./types";

interface ZippopotamResponse {
  "post code": string;
  country: string;
  places: Array<{
    "place name": string;
    state: string;
    latitude: string;
    longitude: string;
  }>;
}

export async function geocodePostalArea({
  postalCode,
  country = "us"
}: {
  postalCode: string;
  country?: string;
}): Promise<LocationConfig> {
  const normalized = postalCode.trim();
  if (!normalized) {
    throw new Error("Enter a ZIP or postal area code.");
  }

  const url = new URL(`https://api.zippopotam.us/${country}/${encodeURIComponent(normalized)}`);
  const response = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 * 14 }
  });

  if (!response.ok) {
    throw new Error(`Could not find coordinates for ${normalized}.`);
  }

  const data = (await response.json()) as ZippopotamResponse;
  const place = data.places[0];
  if (!place) {
    throw new Error(`No places found for ${normalized}.`);
  }

  return {
    id: `user-${country}-${normalized.toLowerCase()}`,
    name: `${place["place name"]}, ${place.state}`,
    shortName: `${place["place name"]}`,
    regionLabel: `${data.country} ${data["post code"]}`,
    country: data.country,
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    timezone: country.toLowerCase() === "us" ? "America/Los_Angeles" : undefined,
    climateNote: "User-selected growing area."
  };
}
