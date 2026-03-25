import { useCallback, useEffect, useRef, useState } from 'react';
import { useJsApiLoader, GoogleMap, useGoogleMap } from '@react-google-maps/api';
import { useMapStore } from '@/store/useMapStore';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 43.6532, lng: -79.3832 };
const DEFAULT_ZOOM = 11;
const LIBRARIES: ('places')[] = ['places'];

const GTA_BOUNDS = {
  north: 44.45,
  south: 43.2,
  west: -80.15,
  east: -78.7,
};

const TPS_NEIGHBOURHOOD_CRIME_RATES_URL =
  'https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Neighbourhood_Crime_Rates_Open_Data/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson';

/** Dark map style for Google Maps */
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2d2d2d' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2d2d2d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
];

const POLICE_FIRE_MARKERS = [
  { lat: 43.6546, lng: -79.4014, type: 'police' as const, name: 'Toronto Police 52 Division' },
  { lat: 43.6518, lng: -79.3817, type: 'fire' as const, name: 'Toronto Fire Station 332' },
  { lat: 43.6577, lng: -79.3892, type: 'hospital' as const, name: 'Toronto General Hospital' },
];

const SAFE_AREAS_24_7 = [
  { lat: 43.6489, lng: -79.3816, type: 'pharmacy' as const, name: 'Shoppers Drug Mart (24h)' },
  { lat: 43.6581, lng: -79.3872, type: 'hospital' as const, name: 'SickKids Emergency' },
  { lat: 43.6426, lng: -79.3871, type: 'business' as const, name: '24/7 Convenience' },
];

const getAssaultRate = (feature: google.maps.Data.Feature): number => {
  const value = feature.getProperty('ASSAULT_RATE_2025');
  const rate = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(rate) ? rate : 0;
};

const getNeighbourhoodName = (feature: google.maps.Data.Feature): string => {
  const value =
    feature.getProperty('AREA_NAME') ??
    feature.getProperty('NEIGHBOURHOOD_158') ??
    feature.getProperty('NEIGHBOURHOOD') ??
    'Unknown neighbourhood';
  return String(value);
};

const getChoroplethColor = (assaultRate: number): string => {
  if (assaultRate >= 1000) return '#7d0c0c';
  if (assaultRate >= 750) return '#b83025';
  if (assaultRate >= 500) return '#d4614a';
  if (assaultRate >= 250) return '#e8a882';
  if (assaultRate >= 196) return '#f7e0d0';
  return '#f7e0d0';
};

function RouteAndLayers() {
  const map = useGoogleMap();
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const routeMarkersRef = useRef<google.maps.Marker[]>([]);
  const choroplethLayerRef = useRef<google.maps.Data | null>(null);
  const tooltipRef = useRef<{
    setContent: (title: string, subtitle: string) => void;
    setPosition: (latLng: google.maps.LatLng) => void;
    show: () => void;
    hide: () => void;
    destroy: () => void;
  } | null>(null);
  const policeFireMarkersRef = useRef<google.maps.Marker[]>([]);
  const safeAreasMarkersRef = useRef<google.maps.Marker[]>([]);

  const { routeResult, routeMode, showHeatmap, showPoliceFire, showSafeAreas } = useMapStore();

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

    const startMarker = new google.maps.Marker({
      position: path[0],
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
      position: path[path.length - 1],
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

  // TPS neighbourhood choropleth overlay (replaces HeatmapLayer)
  useEffect(() => {
    if (!map) return;

    if (!showHeatmap) {
      if (choroplethLayerRef.current) {
        choroplethLayerRef.current.setMap(null);
        choroplethLayerRef.current = null;
      }
      tooltipRef.current?.hide();
      return;
    }

    let cancelled = false;
    let mouseOverListener: google.maps.MapsEventListener | null = null;
    let mouseOutListener: google.maps.MapsEventListener | null = null;

    const loadChoropleth = async () => {
      try {
        if (!tooltipRef.current) {
          class HoverTooltipOverlay extends google.maps.OverlayView {
            private div: HTMLDivElement | null = null;
            private position: google.maps.LatLng | null = null;

            onAdd() {
              const div = document.createElement('div');
              div.style.position = 'absolute';
              div.style.transform = 'translate(-50%, calc(-100% - 10px))';
              div.style.background = '#1a1a1a';
              div.style.color = '#ffffff';
              div.style.borderRadius = '10px';
              div.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
              div.style.padding = '6px 8px';
              div.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
              div.style.whiteSpace = 'nowrap';
              div.style.pointerEvents = 'none';
              div.style.display = 'none';
              div.style.zIndex = '1200';
              this.div = div;
              this.getPanes()?.floatPane.appendChild(div);
            }

            draw() {
              if (!this.div || !this.position) return;
              const p = this.getProjection()?.fromLatLngToDivPixel(this.position);
              if (!p) return;
              this.div.style.left = `${p.x}px`;
              this.div.style.top = `${p.y}px`;
            }

            onRemove() {
              if (this.div?.parentNode) this.div.parentNode.removeChild(this.div);
              this.div = null;
            }

            setTooltipContent(title: string, subtitle: string) {
              if (!this.div) return;
              this.div.innerHTML = `<div style="font-weight:700;font-size:12px;line-height:1.1">${title}</div><div style="opacity:.9;margin-top:3px;font-size:11px;line-height:1.1">${subtitle}</div>`;
            }

            setTooltipPosition(latLng: google.maps.LatLng) {
              this.position = latLng;
              this.draw();
            }

            showTooltip() {
              if (this.div) this.div.style.display = 'block';
            }

            hideTooltip() {
              if (this.div) this.div.style.display = 'none';
            }
          }

          const overlay = new HoverTooltipOverlay();
          overlay.setMap(map);
          tooltipRef.current = {
            setContent: (title, subtitle) => overlay.setTooltipContent(title, subtitle),
            setPosition: (latLng) => overlay.setTooltipPosition(latLng),
            show: () => overlay.showTooltip(),
            hide: () => overlay.hideTooltip(),
            destroy: () => overlay.setMap(null),
          };
        }

        const geojson = await fetch(TPS_NEIGHBOURHOOD_CRIME_RATES_URL).then((r) => (r.ok ? r.json() : null));
        if (!geojson || cancelled) return;

        if (choroplethLayerRef.current) {
          choroplethLayerRef.current.setMap(null);
          choroplethLayerRef.current = null;
        }

        const layer = new google.maps.Data({ map });
        choroplethLayerRef.current = layer;
        layer.addGeoJson(geojson);

        layer.setStyle((feature) => {
          const assaultRate = getAssaultRate(feature);
          return {
            fillColor: getChoroplethColor(assaultRate),
            fillOpacity: 0.7,
            strokeColor: '#ffffff',
            strokeWeight: 1,
            strokeOpacity: 0.4,
          };
        });

        mouseOverListener = layer.addListener('mouseover', (event: any) => {
          const neighbourhood = getNeighbourhoodName(event.feature);
          const assaultRate = getAssaultRate(event.feature);
          tooltipRef.current?.setContent(neighbourhood, `Assault rate (2025): ${assaultRate.toLocaleString()}`);
          tooltipRef.current?.setPosition(event.latLng);
          tooltipRef.current?.show();
        });

        // Follow cursor while moving within polygon.
        layer.addListener('mousemove', (event: any) => {
          tooltipRef.current?.setPosition(event.latLng);
        });

        mouseOutListener = layer.addListener('mouseout', () => {
          tooltipRef.current?.hide();
        });
      } catch {
        // Keep map usable if external data fails.
      }
    };

    loadChoropleth();
    return () => {
      cancelled = true;
      if (mouseOverListener) google.maps.event.removeListener(mouseOverListener);
      if (mouseOutListener) google.maps.event.removeListener(mouseOutListener);
    };
  }, [map, showHeatmap]);

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
  const { origin, destination, originQuery, destinationQuery, setRouteResult } = useMapStore();
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

  // Fetch walking directions when origin and destination are set
  useEffect(() => {
    if (!map || !origin || !destination || !apiKey) return;

    const service = new google.maps.DirectionsService();
    const originParam: string | google.maps.LatLng = originQuery.trim()
      ? originQuery.trim()
      : new google.maps.LatLng(origin.lat, origin.lng);
    const destParam: string | google.maps.LatLng = destinationQuery.trim()
      ? destinationQuery.trim()
      : new google.maps.LatLng(destination.lat, destination.lng);

    service.route(
      {
        origin: originParam,
        destination: destParam,
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true,
      },
      (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result?.routes?.length) {
          setRouteResult(null);
          return;
        }

        const extractRoute = (route: google.maps.DirectionsRoute) => {
          const leg = route.legs[0];
          const path = route.overview_path || [];
          const polyline = path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
          const duration = leg.duration?.text ?? '';
          const distance = leg.distance?.text ?? '';
          const durationSeconds = leg.duration?.value ?? 0;
          return { polyline, duration, distance, durationSeconds };
        };

        const parsed = result.routes.map(extractRoute);
        parsed.sort((a, b) => a.durationSeconds - b.durationSeconds);

        const fastest = parsed[0];
        const safest = parsed.length > 1 ? parsed[parsed.length - 1] : parsed[0];

        setRouteResult({
          fastest: { polyline: fastest.polyline, duration: fastest.duration, distance: fastest.distance },
          safest: { polyline: safest.polyline, duration: safest.duration, distance: safest.distance, score: 'B+' },
        });
      }
    );
  }, [map, origin, destination, originQuery, destinationQuery, apiKey, setRouteResult]);

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
        Loading map...
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
        restriction: { latLngBounds: GTA_BOUNDS, strictBounds: true },
      }}
    >
      <RouteAndLayers />
    </GoogleMap>
  );
}
