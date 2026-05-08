# North Bend Viticulture Climate Dashboard

A Swiss-modern Next.js dashboard for tracking the current viticulture season in North Bend, Washington and comparing it with prior vintages, McMinnville as a Willamette Valley proxy, and Beaune as a Burgundy proxy.

## Stack

- Next.js app router with TypeScript
- Tailwind CSS
- Recharts for climate curves and comparison charts
- Framer Motion for restrained micro-interactions
- Vitest for the viticulture calculation tests

## Setup

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

`npm install` / `npm run dev` also works if you prefer npm, but the included lockfile is `pnpm-lock.yaml`.

## Environment

No API key is required for the default Open-Meteo data flow.

Optional NOAA validation:

```bash
NOAA_TOKEN=your_token_here
NOAA_STATION_ID=GHCND:YOUR_STATION_ID
```

`NOAA_TOKEN` enables NOAA/NCEI Climate Data Online validation hooks. `NOAA_STATION_ID` is optional but recommended when you want a specific station-based comparison.

## Data Sources

Priority order:

1. [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) for daily season history: `temperature_2m_max`, `temperature_2m_min`, `temperature_2m_mean`, and `precipitation_sum`.
2. [Open-Meteo Forecast API](https://open-meteo.com/) for current conditions and near-term daily forecast context.
3. [NOAA/NCEI CDO API](https://www.ncdc.noaa.gov/cdo-web/webservices/v2) for optional US station validation when `NOAA_TOKEN` is configured.
4. [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) as a gridded fallback when Open-Meteo season data is unreachable.
5. [North Bend Weather](https://www.northbendweather.com/) is linked as a local live-weather reference. The app does not scrape it aggressively and does not use it as a metrics source.

The dashboard does not fabricate demo data. If live providers fail, the UI shows unavailable or fallback states with source notes.

## Viticulture Logic

- Season window: April 1 through October 31.
- Daily GDD: `max(((Tmax + Tmin) / 2) - base, 0)`.
- GDD base: `50 F` or `10 C`.
- Frost risk: daily low at or below `32 F` / `0 C`.
- Heat spike: daily high at or above `90 F` / `32 C`.
- Vintage similarity uses weighted distance across cumulative GDD, precipitation, frost events, heat events, and average diurnal range.
- Current-year analog comparisons align prior vintages to the same day of season.

## Useful Commands

```bash
pnpm test
pnpm build
pnpm lint
```

The focused tests live in `lib/viticulture/calculations.test.ts`.

## Project Structure

```text
app/
  api/dashboard/route.ts       Dashboard data endpoint
  page.tsx                     App entry
components/dashboard/          Dashboard UI, charts, cards, source panels
lib/weather/                   Provider contracts and data fetchers
lib/viticulture/               GDD, trends, season summaries, analog scoring
lib/dashboard/                 API composition layer
```
