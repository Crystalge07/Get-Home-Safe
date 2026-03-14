# SafeMap

Find the safest walking route home. SafeMap shows crime heatmaps, police & fire stations, 24/7 safe areas, and lets you choose between the fastest route and the safest route based on crime or general safety index data.

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

## Safety layers

- **Crime-based safety**: Heatmap and route scoring use local crime data (default demo points; can be wired to SpotCrime API or local open data in `GoogleMapView.tsx`).
- **General safety index**: Set `ARCGIS_SAFETY_GEOJSON_URL` in `src/config/arcgis.ts` to the ArcGIS feature service query URL that returns GeoJSON (e.g. from the [ArcGIS safety experience](https://experience.arcgis.com/experience/19cd9accd61542ffb62be3b5f29ee778)). The app overlays a color-coded safety zone layer and uses it for route scoring when that mode is selected.

The app uses the currently selected safety layer to score the “safest” walking route versus the “fastest” route.

## Build

```sh
npm run build
```

## Deploy

Build the project and deploy the `dist` folder to any static host (Vercel, Netlify, etc.).
