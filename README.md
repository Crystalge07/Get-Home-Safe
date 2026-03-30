# SafeMap

Find the safest walking route home. SafeMap shows crime heatmaps, police & fire stations, 24/7 safe areas, and lets you choose between the fastest route and the safest route based on neighbourhood crime data and proximity to safety-related places.

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Google Maps JavaScript API & Directions API
- Zustand, TanStack Query, Framer Motion

## Setup

1. Clone the repository and install dependencies:

```sh
npm i
```

2. Create a `.env` file in the project root with your Google Maps API key (Maps JavaScript API and Directions API must be enabled):

```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

3. Start the dev server:

```sh
npm run dev
```

## Data sources

- **Neighbourhood crime polygons**: The map loads [Toronto Police Service (TPS) Neighbourhood Crime Rates Open Data](https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Neighbourhood_Crime_Rates_Open_Data/FeatureServer) as GeoJSON. The choropleth and route scoring use the `ASSAULT_RATE_2025` field on each neighbourhood polygon.
- **Safety markers** (police, fire, hospitals, and selected “safe space” place types): Loaded via the Google Places API, scoped to the bounding box of the loaded crime polygons (Greater Toronto Area–centric in practice).

Implementation lives in `src/components/map/GoogleMapView.tsx` (including the ArcGIS query URL). To use a different jurisdiction or dataset, you would replace or parameterize that GeoJSON source and align property names (e.g. assault rate field) with what the scorer expects.

## How routing works (“fastest”, “safest”, “balanced”)

SafeMap does **not** run a custom graph search over every street. It asks Google’s **Directions API** for **walking** directions with **route alternatives** enabled, then **scores each returned route** with a simple model.

### Step 1 — Candidate routes

Google may return several alternative walking routes between origin and destination. Each route is turned into a polyline (sequence of lat/lng points). Only these alternatives are considered; paths that Google does not return are never evaluated.

### Step 2 — Safety score per route

For each candidate route, the app walks the polyline and **samples every second point** (to keep work reasonable). At each sample it computes:

1. **Proximity reward** — Distance in meters to the **nearest** “safety” point (aggregated police, fire, hospital, and safe-space markers from Places). Each sample adds a reward between `0` and `1`: full contribution when within **220 m**, falling off linearly to zero farther away. If no safety markers are loaded yet, the code treats distance as **400 m** for every sample (so the reward term is uniformly weak until markers exist).

2. **Crime penalty** — The sample is tested against TPS **neighbourhood polygons** (point-in-polygon). If the point lies inside a polygon, that neighbourhood’s **assault rate** (`ASSAULT_RATE_2025`) adds a penalty proportional to `assaultRate / 1200` for that sample. Points outside all polygons add **no** assault penalty (treated as zero risk in the model).

The per-route score is **reward minus penalty**, summed over samples. Higher is “safer” in this heuristic.

### Step 3 — Picking the three modes

- **Fastest** — The candidate with the **shortest travel time** (Directions duration).
- **Safest** — The candidate with the **highest safety score** (not necessarily the fastest).
- **Balanced** — Candidates are ranked by a **50/50 blend**: normalized travel time versus how far each route’s safety score falls **below** the best (safest) score. The implementation prefers a route that is not identical to the “safest” pick when another reasonable alternative exists.

The UI lets you switch which of these three polylines is highlighted.

## Map layers (UI)

- **Crime heatmap (choropleth)** — TPS neighbourhood polygons coloured by assault rate; optional overlay.
- **Police & fire** — Markers for authorities from Places (within the loaded coverage area).
- **Safe areas** — Markers for selected 24/7–oriented place types (e.g. hospitals, pharmacies, universities, convenience stores), filtered the same way.

## Build

```sh
npm run build
```
