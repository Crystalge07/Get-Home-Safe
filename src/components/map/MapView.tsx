import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup } from 'react-leaflet';
import { useMapStore } from '@/store/useMapStore';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// Mock route data (NYC area)
const ROUTES = {
  fastest: {
    path: [
      [40.7580, -73.9855], [40.7560, -73.9830], [40.7535, -73.9790],
      [40.7510, -73.9760], [40.7485, -73.9730], [40.7460, -73.9700],
    ] as [number, number][],
    time: '12 min', distance: '0.9 mi', score: 'C', scoreColor: 'var(--score-c)',
  },
  safest: {
    path: [
      [40.7580, -73.9855], [40.7575, -73.9870], [40.7560, -73.9880],
      [40.7540, -73.9870], [40.7520, -73.9850], [40.7500, -73.9820],
      [40.7480, -73.9780], [40.7460, -73.9740], [40.7460, -73.9700],
    ] as [number, number][],
    time: '18 min', distance: '1.4 mi', score: 'A', scoreColor: 'var(--score-a)',
  },
  balanced: {
    path: [
      [40.7580, -73.9855], [40.7568, -73.9840], [40.7550, -73.9815],
      [40.7530, -73.9790], [40.7510, -73.9770], [40.7490, -73.9740],
      [40.7470, -73.9715], [40.7460, -73.9700],
    ] as [number, number][],
    time: '14 min', distance: '1.1 mi', score: 'B+', scoreColor: 'var(--score-b)',
  },
};

// Mock crime heatmap data points
const CRIME_POINTS = [
  { lat: 40.7545, lng: -73.9840, intensity: 0.9 },
  { lat: 40.7520, lng: -73.9780, intensity: 0.7 },
  { lat: 40.7500, lng: -73.9750, intensity: 0.5 },
  { lat: 40.7570, lng: -73.9810, intensity: 0.3 },
  { lat: 40.7490, lng: -73.9820, intensity: 0.8 },
  { lat: 40.7555, lng: -73.9770, intensity: 0.6 },
  { lat: 40.7530, lng: -73.9860, intensity: 0.4 },
  { lat: 40.7475, lng: -73.9710, intensity: 0.7 },
  { lat: 40.7510, lng: -73.9690, intensity: 0.5 },
  { lat: 40.7565, lng: -73.9900, intensity: 0.3 },
];

// Mock emergency markers
const EMERGENCY_MARKERS = [
  { lat: 40.7550, lng: -73.9840, type: 'hospital', name: 'NYU Langone' },
  { lat: 40.7480, lng: -73.9720, type: 'police', name: 'NYPD 14th Precinct' },
  { lat: 40.7520, lng: -73.9880, type: 'fire', name: 'FDNY Engine 54' },
  { lat: 40.7495, lng: -73.9800, type: 'pharmacy', name: 'CVS 24hr' },
];

const getHeatColor = (intensity: number) => {
  if (intensity > 0.7) return 'hsl(0, 84%, 60%)';
  if (intensity > 0.5) return 'hsl(25, 95%, 53%)';
  if (intensity > 0.3) return 'hsl(38, 92%, 50%)';
  return 'hsl(160, 84%, 39%)';
};

const emergencyIcon = (type: string) => {
  const colors: Record<string, string> = {
    hospital: '#3B82F6', police: '#6366F1', fire: '#EF4444', pharmacy: '#10B981',
  };
  const icons: Record<string, string> = {
    hospital: '🏥', police: '🚔', fire: '🚒', pharmacy: '💊',
  };
  return L.divIcon({
    html: `<div style="background:${colors[type] || '#888'};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.2);border:2px solid white;">${icons[type] || '📍'}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Mock lit streets
const LIT_STREETS = [
  [[40.7580, -73.9870], [40.7560, -73.9880], [40.7540, -73.9870]],
  [[40.7570, -73.9830], [40.7555, -73.9810], [40.7540, -73.9800]],
  [[40.7530, -73.9750], [40.7510, -73.9740], [40.7490, -73.9730]],
] as [number, number][][];

const MapView = () => {
  const { isDarkMode, routeMode, showHeatmap, showLighting, showEmergency } = useMapStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const activeRoute = ROUTES[routeMode];
  const inactiveRoutes = useMemo(() =>
    Object.entries(ROUTES).filter(([k]) => k !== routeMode),
    [routeMode]
  );

  return (
    <MapContainer
      center={[40.7530, -73.9790]}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={true}
    >
      <TileLayer
        key={isDarkMode ? 'dark' : 'light'}
        url={isDarkMode ? DARK_TILES : LIGHT_TILES}
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {/* Inactive routes */}
      {inactiveRoutes.map(([key, route]) => (
        <Polyline
          key={key}
          positions={route.path}
          pathOptions={{ color: '#94a3b8', weight: 3, opacity: 0.35, dashArray: '8 8' }}
        />
      ))}

      {/* Active route */}
      <Polyline
        positions={activeRoute.path}
        pathOptions={{ color: 'hsl(217, 91%, 60%)', weight: 5, opacity: 0.9 }}
      />

      {/* Start/End markers */}
      <CircleMarker center={activeRoute.path[0]} radius={7}
        pathOptions={{ color: 'hsl(217, 91%, 60%)', fillColor: 'hsl(217, 91%, 60%)', fillOpacity: 1, weight: 3 }} />
      <CircleMarker center={activeRoute.path[activeRoute.path.length - 1]} radius={7}
        pathOptions={{ color: 'hsl(160, 84%, 39%)', fillColor: 'hsl(160, 84%, 39%)', fillOpacity: 1, weight: 3 }} />

      {/* Crime heatmap */}
      {showHeatmap && CRIME_POINTS.map((pt, i) => (
        <CircleMarker
          key={`crime-${i}`}
          center={[pt.lat, pt.lng]}
          radius={pt.intensity * 40 + 15}
          pathOptions={{
            color: 'transparent',
            fillColor: getHeatColor(pt.intensity),
            fillOpacity: 0.25,
          }}
        />
      ))}

      {/* Lighting overlay */}
      {showLighting && LIT_STREETS.map((street, i) => (
        <Polyline
          key={`lit-${i}`}
          positions={street}
          pathOptions={{
            color: isDarkMode ? '#FDE68A' : '#FBBF24',
            weight: 6,
            opacity: isDarkMode ? 0.5 : 0.35,
            lineCap: 'round',
          }}
        />
      ))}

      {/* Emergency markers */}
      {showEmergency && EMERGENCY_MARKERS.map((m, i) => (
        <Marker key={`em-${i}`} position={[m.lat, m.lng]} icon={emergencyIcon(m.type)}>
          <Popup><span className="text-sm font-medium">{m.name}</span></Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
