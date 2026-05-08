# Wine Climate Atlas

Responsive Next.js climate dashboard for comparing a user-selected growing area with famous wine regions around the world.

## Run Locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## What It Does

- Accepts a US area / ZIP code and geocodes it with Zippopotam.us.
- Defaults to North Bend, WA when no code is entered or geocoding fails.
- Fetches real daily climate data from Open-Meteo Historical Weather API.
- Calculates GDD, rainfall, frost days, heat days, diurnal range, and 30-day trends.
- Ranks the selected climate against famous wine regions including Willamette, Napa, Burgundy, Bordeaux, Champagne, Rioja, Tuscany, Mosel, Mendoza, Barossa, Stellenbosch, and Marlborough.

## Data Sources

- Open-Meteo Historical Weather API: no key required.
- Zippopotam.us postal geocoding: no key required.

No fake climate values are used. If a provider is unavailable, the app shows warnings and omits unavailable comparison regions from ranking.

## Verification

```bash
pnpm lint
pnpm test
pnpm build
```
