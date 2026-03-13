import { useEffect, useRef } from 'react';
import L, { type LayerGroup, type Map as LeafletMap, type TileLayer } from 'leaflet';
import { useMapStore } from '@/store/useMapStore';

const LIGHT_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

type RouteMode = 'fastest' | 'safest' | 'balanced';

type RouteData = {
  path: [number, number][];
  time: string;
  distance: string;
  score: string;
};

const ROUTES: Record<RouteMode, RouteData> = {
  fastest: {
    path: [
      [40.758, -73.9855], [40.756, -73.983], [40.7535, -73.979],
      [40.751, -73.976], [40.7485, -73.973], [40.746, -73.97],
    ],
    time: '12 min',
    distance: '0.9 mi',
    score: 'C',
  },
  safest: {
    path: [
      [40.758, -73.9855], [40.7575, -73.987], [40.756, -73.988],
      [40.754, -73.987], [40.752, -73.985], [40.75, -73.982],
      [40.748, -73.978], [40.746, -73.974], [40.746, -73.97],
    ],
    time: '18 min',
    distance: '1.4 mi',
    score: 'A',
  },
  balanced: {
    path: [
      [40.758, -73.9855], [40.7568, -73.984], [40.755, -73.9815],
      [40.753, -73.979], [40.751, -73.977], [40.749, -73.974],
      [40.747, -73.9715], [40.746, -73.97],
    ],
    time: '14 min',
    distance: '1.1 mi',
    score: 'B+',
  },
};

const CRIME_POINTS = [
  { lat: 40.7545, lng: -73.984, intensity: 0.9 },
  { lat: 40.752, lng: -73.978, intensity: 0.7 },
  { lat: 40.75, lng: -73.975, intensity: 0.5 },
  { lat: 40.757, lng: -73.981, intensity: 0.3 },
  { lat: 40.749, lng: -73.982, intensity: 0.8 },
  { lat: 40.7555, lng: -73.977, intensity: 0.6 },
  { lat: 40.753, lng: -73.986, intensity: 0.4 },
  { lat: 40.7475, lng: -73.971, intensity: 0.7 },
  { lat: 40.751, lng: -73.969, intensity: 0.5 },
  { lat: 40.7565, lng: -73.99, intensity: 0.3 },
];

const EMERGENCY_MARKERS = [
  { lat: 40.755, lng: -73.984, type: 'hospital', name: 'NYU Langone' },
  { lat: 40.748, lng: -73.972, type: 'police', name: 'NYPD 14th Precinct' },
  { lat: 40.752, lng: -73.988, type: 'fire', name: 'FDNY Engine 54' },
  { lat: 40.7495, lng: -73.98, type: 'pharmacy', name: 'CVS 24hr' },
];

const LIT_STREETS = [
  [[40.758, -73.987], [40.756, -73.988], [40.754, -73.987]],
  [[40.757, -73.983], [40.7555, -73.981], [40.754, -73.98]],
  [[40.753, -73.975], [40.751, -73.974], [40.749, -73.973]],
] as [number, number][][];

const getHeatColor = (intensity: number) => {
  if (intensity > 0.7) return 'hsl(0 84% 60%)';
  if (intensity > 0.5) return 'hsl(25 95% 53%)';
  if (intensity > 0.3) return 'hsl(38 92% 50%)';
  return 'hsl(160 84% 39%)';
};

const emergencyIcon = (type: string) => {
  const colors: Record<string, string> = {
    hospital: '#3B82F6',
    police: '#6366F1',
    fire: '#EF4444',
    pharmacy: '#10B981',
  };

  const icons: Record<string, string> = {
    hospital: '🏥',
    police: '🚔',
    fire: '🚒',
    pharmacy: '💊',
  };

  return L.divIcon({
    html: `<div style="background:${colors[type] ?? '#64748b'};width:28px;height:28px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,.25)">${icons[type] ?? '📍'}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const MapView = () => {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const heatLayerRef = useRef<LayerGroup | null>(null);
  const lightingLayerRef = useRef<LayerGroup | null>(null);
  const emergencyLayerRef = useRef<LayerGroup | null>(null);

  const { isDarkMode, routeMode, showHeatmap, showLighting, showEmergency } = useMapStore();

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const map = L.map(mapElementRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([40.753, -73.979], 15);

    mapRef.current = map;

    routeLayerRef.current = L.layerGroup().addTo(map);
    heatLayerRef.current = L.layerGroup().addTo(map);
    lightingLayerRef.current = L.layerGroup().addTo(map);
    emergencyLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(isDarkMode ? DARK_TILES : LIGHT_TILES, {
      attribution: '&copy; OpenStreetMap & CARTO',
    }).addTo(map);
  }, [isDarkMode]);

  useEffect(() => {
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    const heatLayer = heatLayerRef.current;
    const lightingLayer = lightingLayerRef.current;
    const emergencyLayer = emergencyLayerRef.current;

    if (!map || !routeLayer || !heatLayer || !lightingLayer || !emergencyLayer) return;

    routeLayer.clearLayers();
    heatLayer.clearLayers();
    lightingLayer.clearLayers();
    emergencyLayer.clearLayers();

    const activeRoute = ROUTES[routeMode as RouteMode];
    const inactiveRoutes = (Object.entries(ROUTES) as [RouteMode, RouteData][]).filter(([k]) => k !== routeMode);

    inactiveRoutes.forEach(([, route]) => {
      L.polyline(route.path, {
        color: '#94a3b8',
        weight: 3,
        opacity: 0.35,
        dashArray: '8 8',
      }).addTo(routeLayer);
    });

    L.polyline(activeRoute.path, {
      color: 'hsl(217 91% 60%)',
      weight: 5,
      opacity: 0.9,
    }).addTo(routeLayer);

    const start = activeRoute.path[0];
    const end = activeRoute.path[activeRoute.path.length - 1];

    L.circleMarker(start, {
      radius: 7,
      color: 'hsl(217 91% 60%)',
      fillColor: 'hsl(217 91% 60%)',
      fillOpacity: 1,
      weight: 3,
    }).addTo(routeLayer);

    L.circleMarker(end, {
      radius: 7,
      color: 'hsl(160 84% 39%)',
      fillColor: 'hsl(160 84% 39%)',
      fillOpacity: 1,
      weight: 3,
    }).addTo(routeLayer);

    if (showHeatmap) {
      CRIME_POINTS.forEach((pt) => {
        L.circleMarker([pt.lat, pt.lng], {
          radius: pt.intensity * 40 + 15,
          color: 'transparent',
          fillColor: getHeatColor(pt.intensity),
          fillOpacity: 0.25,
        }).addTo(heatLayer);
      });
    }

    if (showLighting) {
      LIT_STREETS.forEach((street) => {
        L.polyline(street, {
          color: isDarkMode ? '#FDE68A' : '#FBBF24',
          weight: 6,
          opacity: isDarkMode ? 0.5 : 0.35,
          lineCap: 'round',
        }).addTo(lightingLayer);
      });
    }

    if (showEmergency) {
      EMERGENCY_MARKERS.forEach((marker) => {
        L.marker([marker.lat, marker.lng], {
          icon: emergencyIcon(marker.type),
        })
          .addTo(emergencyLayer)
          .bindPopup(`<span style="font-weight:600;font-size:12px">${marker.name}</span>`);
      });
    }
  }, [routeMode, showHeatmap, showLighting, showEmergency, isDarkMode]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <div ref={mapElementRef} className="h-full w-full" aria-label="SafeMap map" />;
};

export default MapView;
