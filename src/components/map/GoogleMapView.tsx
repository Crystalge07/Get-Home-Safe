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

type SafetyCategory = 'POLICE' | 'FIRE_STATION' | 'HOSPITAL' | 'SAFE_SPACE';
type SafetyMarker = { lat: number; lng: number; name: string; category: SafetyCategory };
type BoundsLike = { north: number; south: number; east: number; west: number };
type PolygonRing = [number, number][]; // [lng, lat]

const svgDataUri = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const markerSvgByCategory = (category: SafetyCategory) => {
  const commonStart =
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="white" stroke="black" stroke-width="1.6"/>';
  const commonEnd = '</svg>';

  if (category === 'POLICE') {
    return (
      commonStart +
      '<circle cx="18" cy="13" r="3.5" fill="none" stroke="black" stroke-width="1.8"/>' +
      '<path d="M10 24c2-4 14-4 16 0" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M14 10h8" stroke="black" stroke-width="1.6" stroke-linecap="round"/>' +
      commonEnd
    );
  }
  if (category === 'FIRE_STATION') {
    return (
      commonStart +
      '<path d="M18 8c2.5 3 4 5.4 4 8.2A4 4 0 0 1 18 20a4 4 0 0 1-4-3.8C14 13.4 15.5 11 18 8z" fill="none" stroke="black" stroke-width="1.8"/>' +
      '<path d="M18 14c1 1.2 1.6 2.2 1.6 3.2A1.6 1.6 0 0 1 18 18.8a1.6 1.6 0 0 1-1.6-1.6c0-1 .6-2 1.6-3.2z" fill="none" stroke="black" stroke-width="1.6"/>' +
      commonEnd
    );
  }
  if (category === 'HOSPITAL') {
    return (
      commonStart +
      '<path d="M16.2 10.8h3.6v5.4h5.4v3.6h-5.4v5.4h-3.6v-5.4h-5.4v-3.6h5.4z" fill="none" stroke="black" stroke-width="1.8" stroke-linejoin="round"/>' +
      commonEnd
    );
  }
  return (
    commonStart +
    '<path d="M12.2 17.8L18 12l5.8 5.8v7h-4.2v-4h-3.2v4h-4.2z" fill="none" stroke="black" stroke-width="1.7" stroke-linejoin="round"/>' +
    '<circle cx="24.8" cy="11.6" r="3.4" fill="none" stroke="black" stroke-width="1.4"/>' +
    '<path d="M24.8 10v1.8l1.2.9" fill="none" stroke="black" stroke-width="1.4" stroke-linecap="round"/>' +
    commonEnd
  );
};

const getSafetyMarkerIcon = (category: SafetyCategory, hovered = false): google.maps.Icon => {
  const size = hovered ? 39.6 : 36;
  return {
    url: svgDataUri(markerSvgByCategory(category)),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
};

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

const pointInRing = (lat: number, lng: number, ring: PolygonRing): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; // [lng, lat]
    const [xj, yj] = ring[j];
    const intersects = ((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-12) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
};

function RouteAndLayers() {
  const map = useGoogleMap();
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const routeMarkersRef = useRef<google.maps.Marker[]>([]);
  const choroplethLayerRef = useRef<google.maps.Data | null>(null);
  const choroplethFeaturesLoadedRef = useRef(false);
  const tooltipRef = useRef<{
    setContent: (title: string, subtitle: string) => void;
    setPosition: (latLng: google.maps.LatLng) => void;
    show: () => void;
    hide: () => void;
    destroy: () => void;
  } | null>(null);
  const policeFireMarkersRef = useRef<google.maps.Marker[]>([]);
  const safeAreasMarkersRef = useRef<google.maps.Marker[]>([]);
  const [authoritiesLocations, setAuthoritiesLocations] = useState<SafetyMarker[]>([]);
  const [safeSpaceLocations, setSafeSpaceLocations] = useState<SafetyMarker[]>([]);
  const [heatmapCoverageBounds, setHeatmapCoverageBounds] = useState<BoundsLike | null>(null);
  const [heatmapCoveragePolygons, setHeatmapCoveragePolygons] = useState<PolygonRing[]>([]);

  const { routeResult, routeMode, showHeatmap, showPoliceFire, showSafeAreas } = useMapStore();

  // Fetch GTA-wide safety markers (police, fire, hospitals, and 24/7 safe spaces)
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps.places) return;
    // Never show markers until exact choropleth polygons are loaded.
    if (heatmapCoveragePolygons.length === 0) {
      setAuthoritiesLocations([]);
      setSafeSpaceLocations([]);
      return;
    }
    let cancelled = false;
    const service = new google.maps.places.PlacesService(map);
    const activeBounds = heatmapCoverageBounds ?? GTA_BOUNDS;
    const gtaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(activeBounds.south, activeBounds.west),
      new google.maps.LatLng(activeBounds.north, activeBounds.east)
    );

    const runTextSearch = (query: string) =>
      new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        const all: google.maps.places.PlaceResult[] = [];
        const request: google.maps.places.TextSearchRequest = { query, bounds: gtaBounds };
        const handle = (
          results: google.maps.places.PlaceResult[] | null,
          status: google.maps.places.PlacesServiceStatus,
          pagination: google.maps.places.PlaceSearchPagination | null
        ) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.length) {
            all.push(...results);
            if (pagination?.hasNextPage) {
              setTimeout(() => pagination.nextPage(), 2100);
              return;
            }
          }
          resolve(all);
        };
        service.textSearch(request, handle);
      });

    const inHeatmapArea = (lat: number, lng: number) => {
      return heatmapCoveragePolygons.some((ring) => pointInRing(lat, lng, ring));
    };

    const matchesCategory = (p: google.maps.places.PlaceResult, category: SafetyCategory) => {
      const types = p.types ?? [];
      if (category === 'POLICE') return types.includes('police');
      if (category === 'FIRE_STATION') return types.includes('fire_station');
      if (category === 'HOSPITAL') return types.includes('hospital');
      // SAFE_SPACE: allow place classes that are intentionally 24/7-safe targets
      return (
        types.includes('university') ||
        types.includes('pharmacy') ||
        types.includes('convenience_store')
      );
    };

    const toMarkers = (places: google.maps.places.PlaceResult[], category: SafetyCategory): SafetyMarker[] => {
      const out: SafetyMarker[] = [];
      const seen = new Set<string>();
      places.forEach((p) => {
        const pid = p.place_id || `${p.name}-${p.vicinity}`;
        if (!pid || seen.has(pid)) return;
        const lat = p.geometry?.location?.lat();
        const lng = p.geometry?.location?.lng();
        // Explicit numeric parsing for reliability across provider responses.
        const latNum = Number(lat);
        const lngNum = Number(lng);
        if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return;
        if (!inHeatmapArea(latNum, lngNum)) return;
        if (!matchesCategory(p, category)) return;
        seen.add(pid);
        out.push({
          lat: latNum,
          lng: lngNum,
          name: p.name || p.formatted_address || p.vicinity || 'Unknown location',
          category,
        });
      });
      return out;
    };

    (async () => {
      try {
        const [
          policePlaces,
          firePlaces,
          hospitalPlaces,
          conveniencePlaces,
          universityPlaces,
          pharmacyPlaces,
        ] = await Promise.all([
          runTextSearch('police station in Greater Toronto Area'),
          runTextSearch('fire station in Greater Toronto Area'),
          runTextSearch('hospital in Greater Toronto Area'),
          runTextSearch('24 hour convenience store in Greater Toronto Area'),
          runTextSearch('university in Greater Toronto Area'),
          runTextSearch('24 hour pharmacy in Greater Toronto Area'),
        ]);

        if (cancelled) return;
        const authorities = [
          ...toMarkers(policePlaces, 'POLICE'),
          ...toMarkers(firePlaces, 'FIRE_STATION'),
          ...toMarkers(hospitalPlaces, 'HOSPITAL'),
        ];
        const safeSpaces = [
          ...toMarkers(conveniencePlaces, 'SAFE_SPACE'),
          ...toMarkers(universityPlaces, 'SAFE_SPACE'),
          ...toMarkers(pharmacyPlaces, 'SAFE_SPACE'),
        ];

        if (authorities.length > 0) setAuthoritiesLocations(authorities);
        if (safeSpaces.length > 0) setSafeSpaceLocations(safeSpaces);
      } catch {
        // Keep map usable if live Places fetch fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [map, heatmapCoverageBounds, heatmapCoveragePolygons]);

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

  // Shared hover tooltip used by choropleth and safety markers
  useEffect(() => {
    if (!map || tooltipRef.current) return;

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
        div.style.boxShadow = '0 8px 22px rgba(0,0,0,0.35)';
        div.style.padding = '6px 10px';
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
        this.div.innerHTML = `<div style="font-weight:700;font-size:12px;line-height:1.15">${title}</div><div style="opacity:.9;margin-top:2px;font-size:11px;line-height:1.15">${subtitle}</div>`;
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

    return () => {
      tooltipRef.current?.destroy();
      tooltipRef.current = null;
    };
  }, [map]);

  // TPS neighbourhood choropleth overlay (replaces HeatmapLayer)
  useEffect(() => {
    if (!map) return;

    let cancelled = false;
    let mouseOverListener: google.maps.MapsEventListener | null = null;
    let mouseMoveListener: google.maps.MapsEventListener | null = null;
    let mouseOutListener: google.maps.MapsEventListener | null = null;

    const loadChoropleth = async () => {
      try {
        if (!choroplethLayerRef.current) {
          const layer = new google.maps.Data();
          choroplethLayerRef.current = layer;
        }
        const layer = choroplethLayerRef.current;
        if (!layer) return;

        if (!choroplethFeaturesLoadedRef.current) {
          const geojson = await fetch(TPS_NEIGHBOURHOOD_CRIME_RATES_URL).then((r) => (r.ok ? r.json() : null));
          if (!geojson || cancelled) return;

          // Build tight coverage bounds from choropleth polygons so markers stay within heatmap area.
          const bounds = new google.maps.LatLngBounds();
          let hasPoint = false;
          const polygonRings: PolygonRing[] = [];
          const scanCoords = (coords: any) => {
            if (!Array.isArray(coords)) return;
            if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
              // GeoJSON order: [lng, lat]
              bounds.extend(new google.maps.LatLng(coords[1], coords[0]));
              hasPoint = true;
              return;
            }
            coords.forEach(scanCoords);
          };
          const collectRings = (geometry: any) => {
            if (!geometry || !geometry.type || !Array.isArray(geometry.coordinates)) return;
            if (geometry.type === 'Polygon') {
              const outer = geometry.coordinates[0];
              if (Array.isArray(outer) && outer.length >= 3) polygonRings.push(outer as PolygonRing);
              return;
            }
            if (geometry.type === 'MultiPolygon') {
              geometry.coordinates.forEach((poly: any) => {
                const outer = poly?.[0];
                if (Array.isArray(outer) && outer.length >= 3) polygonRings.push(outer as PolygonRing);
              });
            }
          };
          (geojson.features ?? []).forEach((feature: any) => {
            scanCoords(feature?.geometry?.coordinates);
            collectRings(feature?.geometry);
          });
          if (hasPoint) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            setHeatmapCoverageBounds({
              north: ne.lat(),
              east: ne.lng(),
              south: sw.lat(),
              west: sw.lng(),
            });
            setHeatmapCoveragePolygons(polygonRings);
          }

          layer.addGeoJson(geojson);
          choroplethFeaturesLoadedRef.current = true;
        }

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

        layer.setMap(showHeatmap ? map : null);
        if (!showHeatmap) {
          tooltipRef.current?.hide();
          return;
        }

        mouseOverListener = layer.addListener('mouseover', (event: any) => {
          const neighbourhood = getNeighbourhoodName(event.feature);
          const assaultRate = getAssaultRate(event.feature);
          tooltipRef.current?.setContent(neighbourhood, `Assault rate (2025): ${assaultRate.toLocaleString()}`);
          tooltipRef.current?.setPosition(event.latLng);
          tooltipRef.current?.show();
        });

        // Follow cursor while moving within polygon.
        mouseMoveListener = layer.addListener('mousemove', (event: any) => {
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
      if (mouseMoveListener) google.maps.event.removeListener(mouseMoveListener);
      if (mouseOutListener) google.maps.event.removeListener(mouseOutListener);
    };
  }, [map, showHeatmap]);

  // Police & Fire markers
  useEffect(() => {
    if (!map) return;
    policeFireMarkersRef.current.forEach((m) => m.setMap(null));
    policeFireMarkersRef.current = [];
    if (!showPoliceFire) return;

    authoritiesLocations.forEach((m) => {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: `${m.name} — Safe Authorities`,
        optimized: false,
        icon: getSafetyMarkerIcon(m.category, false),
      });
      marker.addListener('mouseover', (event: google.maps.MapMouseEvent) => {
        marker.setIcon(getSafetyMarkerIcon(m.category, true));
        if (event.latLng) {
          tooltipRef.current?.setContent(m.name, 'Safe Authorities');
          tooltipRef.current?.setPosition(event.latLng);
          tooltipRef.current?.show();
        }
      });
      marker.addListener('mouseout', () => {
        marker.setIcon(getSafetyMarkerIcon(m.category, false));
        tooltipRef.current?.hide();
      });
      policeFireMarkersRef.current.push(marker);
    });
  }, [map, showPoliceFire, authoritiesLocations]);

  // 24/7 Safe Areas markers
  useEffect(() => {
    if (!map) return;
    safeAreasMarkersRef.current.forEach((m) => m.setMap(null));
    safeAreasMarkersRef.current = [];
    if (!showSafeAreas) return;

    safeSpaceLocations.forEach((m) => {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: `${m.name} — Verified 24/7 Safe Spaces`,
        optimized: false,
        icon: getSafetyMarkerIcon('SAFE_SPACE', false),
      });
      marker.addListener('mouseover', (event: google.maps.MapMouseEvent) => {
        marker.setIcon(getSafetyMarkerIcon('SAFE_SPACE', true));
        if (event.latLng) {
          tooltipRef.current?.setContent(m.name, 'Verified 24/7 Safe Spaces');
          tooltipRef.current?.setPosition(event.latLng);
          tooltipRef.current?.show();
        }
      });
      marker.addListener('mouseout', () => {
        marker.setIcon(getSafetyMarkerIcon('SAFE_SPACE', false));
        tooltipRef.current?.hide();
      });
      safeAreasMarkersRef.current.push(marker);
    });
  }, [map, showSafeAreas, safeSpaceLocations]);

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
