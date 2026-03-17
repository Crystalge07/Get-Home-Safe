import { create } from 'zustand';

export type RouteMode = 'fastest' | 'safest' | 'balanced';

interface MapState {
  routeMode: RouteMode;
  setRouteMode: (mode: RouteMode) => void;

  /** Crime heatmap overlay */
  showHeatmap: boolean;
  toggleHeatmap: () => void;

  /** Police and fire station markers */
  showPoliceFire: boolean;
  togglePoliceFire: () => void;

  /** 24/7 safe areas: hospitals, pharmacies, 24hr businesses */
  showSafeAreas: boolean;
  toggleSafeAreas: () => void;



  walkMeHomeActive: boolean;
  setWalkMeHome: (v: boolean) => void;

  /** Walk Me Home modal/panel open (select trusted contacts) */
  walkMeHomePanelOpen: boolean;
  setWalkMeHomePanelOpen: (v: boolean) => void;

  sheetOpen: boolean;
  setSheetOpen: (v: boolean) => void;

  /** Origin and destination for routing (address or place IDs) */
  originQuery: string;
  destinationQuery: string;
  setOriginQuery: (q: string) => void;
  setDestinationQuery: (q: string) => void;

  /** Resolved origin/destination for display and Directions API */
  origin: { lat: number; lng: number; label?: string } | null;
  destination: { lat: number; lng: number; label?: string } | null;
  setOrigin: (v: { lat: number; lng: number; label?: string } | null) => void;
  setDestination: (v: { lat: number; lng: number; label?: string } | null) => void;

  /** Last fetched route result for display (lat/lng path) */
  routeResult: {
    fastest: { polyline: { lat: number; lng: number }[]; duration: string; distance: string } | null;
    safest: { polyline: { lat: number; lng: number }[]; duration: string; distance: string; score: string } | null;
  } | null;
  setRouteResult: (v: MapState['routeResult']) => void;

  /** True when Google Maps script has loaded (for Places Autocomplete in BottomSheet) */
  mapsLoaded: boolean;
  setMapsLoaded: (v: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  routeMode: 'balanced',
  setRouteMode: (mode) => set({ routeMode: mode }),

  showHeatmap: false,
  toggleHeatmap: () => set((s) => ({ showHeatmap: !s.showHeatmap })),

  showPoliceFire: false,
  togglePoliceFire: () => set((s) => ({ showPoliceFire: !s.showPoliceFire })),

  showSafeAreas: false,
  toggleSafeAreas: () => set((s) => ({ showSafeAreas: !s.showSafeAreas })),



  walkMeHomeActive: false,
  setWalkMeHome: (v) => set({ walkMeHomeActive: v }),

  walkMeHomePanelOpen: false,
  setWalkMeHomePanelOpen: (v) => set({ walkMeHomePanelOpen: v }),

  sheetOpen: true,
  setSheetOpen: (v) => set({ sheetOpen: v }),

  originQuery: '',
  destinationQuery: '',
  setOriginQuery: (q) => set({ originQuery: q }),
  setDestinationQuery: (q) => set({ destinationQuery: q }),

  origin: null,
  destination: null,
  setOrigin: (v) => set({ origin: v }),
  setDestination: (v) => set({ destination: v }),

  routeResult: null,
  setRouteResult: (v) => set({ routeResult: v }),

  mapsLoaded: false,
  setMapsLoaded: (v) => set({ mapsLoaded: v }),
}));
