import { useCallback, useEffect, useRef, useState } from 'react';
import { useJsApiLoader, GoogleMap, useGoogleMap } from '@react-google-maps/api';
import { useMapStore } from '@/store/useMapStore';
import { ARCGIS_SAFETY_GEOJSON_URL } from '@/config/arcgis';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 40.753, lng: -73.979 };
const DEFAULT_ZOOM = 15;

const LIBRARIES: ('places' | 'visualization')[] = ['places', 'visualization'];

/** Dark map style for Google Maps */
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2d2d2d' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ color: '#2d2d2d' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#2d2d2d' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2d2d2d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#383838' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

/** Crime points for heatmap (can be replaced by SpotCrime API or open data) */
const CRIME_POINTS = [
  { lat: 40.7545, lng: -73.984, weight: 0.9 },
  { lat: 40.752, lng: -73.978, weight: 0.7 },
  { lat: 40.75, lng: -73.975, weight: 0.5 },
  { lat: 40.757, lng: -73.981, weight: 0.3 },
  { lat: 40.749, lng: -73.982, weight: 0.8 },
  { lat: 40.7555, lng: -73.977, weight: 0.6 },
  { lat: 40.753, lng: -73.986, weight: 0.4 },
  { lat: 40.7475, lng: -73.971, weight: 0.7 },
  { lat: 40.751, lng: -73.969, weight: 0.5 },
  { lat: 40.7565, lng: -73.99, weight: 0.3 },
];

const POLICE_FIRE_MARKERS = [
  { lat: 40.755, lng: -73.984, type: 'hospital' as const, name: 'NYU Langone' },
  { lat: 40.748, lng: -73.972, type: 'police' as const, name: 'NYPD 14th Precinct' },
  { lat: 40.752, lng: -73.988, type: 'fire' as const, name: 'FDNY Engine 54' },
];

const SAFE_AREAS_24_7 = [
  { lat: 40.7495, lng: -73.98, type: 'pharmacy' as const, name: 'CVS 24hr' },
  { lat: 40.754, lng: -73.981, type: 'hospital' as const, name: 'Emergency' },
  { lat: 40.747, lng: -73.976, type: 'business' as const, name: '24/7 Diner' },
];

function RouteAndLayers() {
  const map = useGoogleMap();
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const routeMarkersRef = useRef<google.maps.Marker[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const arcgisDataLayerRef = useRef<google.maps.Data | null>(null);
  const policeFireMarkersRef = useRef<google.maps.Marker[]>([]);
  const safeAreasMarkersRef = useRef<google.maps.Marker[]>([]);

  const {
    routeResult,
    routeMode,
    showHeatmap,
    showPoliceFire,
    showSafeAreas,
    safetyLayerMode,
  } = useMapStore();

  // Route polyline (walking route)
  useEffect(() => {
    if (!map) return;
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
    routeMarkersRef.current.forEach((m) => m.setMap(null));
    routeMarkersRef.current = [];
    if (!routeResult) return;

    const active = routeMode === 'safest' ? routeResult.safest : routeResult.fastest;
    if (!active?.polyline?.length) return;

    const path = active.polyline.map((p) => new google.maps.LatLng(p.lat, p.lng));
    routePolylineRef.current = new google.maps.Polyline({
      path,
      map,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.9,
      strokeWeight: 5,
    });
    const start = path[0];
    const end = path[path.length - 1];
    const startMarker = new google.maps.Marker({
      position: start,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    });
    const endMarker = new google.maps.Marker({
      position: end,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    });
    routeMarkersRef.current = [startMarker, endMarker];
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds);
  }, [map, routeResult, routeMode]);

  // Heatmap (crime) – when crime layer is active and toggle on
  useEffect(() => {
    if (!map || safetyLayerMode !== 'crime' || !showHeatmap) {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
      return;
    }
    if (!heatmapRef.current) {
      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: CRIME_POINTS.map((p) => ({
          location: new google.maps.LatLng(p.lat, p.lng),
          weight: p.weight,
        })),
        map,
        opacity: 0.6,
        radius: 25,
      });
    } else {
      heatmapRef.current.setMap(map);
    }
  }, [map, showHeatmap, safetyLayerMode]);

  // ArcGIS general safety index overlay (when safety layer is 'general' and heatmap on)
  useEffect(() => {
    if (!map || safetyLayerMode !== 'general' || !showHeatmap || !ARCGIS_SAFETY_GEOJSON_URL) {
      if (arcgisDataLayerRef.current) {
        arcgisDataLayerRef.current.setMap(null);
        arcgisDataLayerRef.current = null;
      }
      return;
    }
    const dataLayer = new google.maps.Data({ map });
    arcgisDataLayerRef.current = dataLayer;
    dataLayer.setStyle((feature) => {
      const score = feature.getProperty('safety_score') ?? feature.getProperty('SafetyIndex') ?? 0.5;
      const green = Math.round(score * 255);
      const red = Math.round((1 - score) * 255);
      return {
        fillColor: `rgb(${red},${green},100)`,
        fillOpacity: 0.35,
        strokeWeight: 1,
        strokeColor: '#333',
      };
    });
    let cancelled = false;
    fetch(ARCGIS_SAFETY_GEOJSON_URL)
      .then((r) => r.json())
      .then((geojson) => {
        if (!cancelled && arcgisDataLayerRef.current === dataLayer) dataLayer.addGeoJson(geojson);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      dataLayer.setMap(null);
      if (arcgisDataLayerRef.current === dataLayer) arcgisDataLayerRef.current = null;
    };
  }, [map, showHeatmap, safetyLayerMode]);

  // Police & Fire markers
  useEffect(() => {
    if (!map) return;
    policeFireMarkersRef.current.forEach((m) => m.setMap(null));
    policeFireMarkersRef.current = [];
    if (!showPoliceFire) return;
    POLICE_FIRE_MARKERS.forEach((m) => {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: m.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: m.type === 'police' ? '#6366F1' : m.type === 'fire' ? '#EF4444' : '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
      policeFireMarkersRef.current.push(marker);
    });
  }, [map, showPoliceFire]);

  // 24/7 Safe Areas markers
  useEffect(() => {
    if (!map) return;
    safeAreasMarkersRef.current.forEach((m) => m.setMap(null));
    safeAreasMarkersRef.current = [];
    if (!showSafeAreas) return;
    SAFE_AREAS_24_7.forEach((m) => {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: m.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
      safeAreasMarkersRef.current.push(marker);
    });
  }, [map, showSafeAreas]);

  return null;
}

export default function GoogleMapView() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { origin, destination, setRouteResult, safetyLayerMode } = useMapStore();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  });
  const setMapsLoaded = useMapStore((s) => s.setMapsLoaded);
  useEffect(() => {
    if (isLoaded) setMapsLoaded(true);
  }, [isLoaded, setMapsLoaded]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // Fetch directions (walking only) when origin and destination are set
  useEffect(() => {
    if (!map || !origin || !destination || !apiKey) return;

    const service = new google.maps.DirectionsService();
    const originLatLng = new google.maps.LatLng(origin.lat, origin.lng);
    const destLatLng = new google.maps.LatLng(destination.lat, destination.lng);

    service.route(
      {
        origin: originLatLng,
        destination: destLatLng,
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result.routes?.[0]) {
          setRouteResult(null);
          return;
        }
        const route = result.routes[0];
        const leg = route.legs[0];
        const path = route.overview_path || [];
        const polyline = path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
        const duration = leg.duration?.text ?? '';
        const distance = leg.distance?.text ?? '';

        // Same path for fastest and safest; score depends on active safety layer
        const score = safetyLayerMode === 'crime' ? 'B+' : 'A';
        setRouteResult({
          fastest: { polyline, duration, distance },
          safest: { polyline, duration, distance, score },
        });
      }
    );
  }, [map, origin, destination, apiKey, setRouteResult, safetyLayerMode]);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
        Failed to load Google Maps. Check your API key and network.
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={origin ? { lat: origin.lat, lng: origin.lng } : DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        zoomControl: true,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        scaleControl: true,
        styles: DARK_MAP_STYLES,
      }}
    >
      <RouteAndLayers />
    </GoogleMap>
  );
}
