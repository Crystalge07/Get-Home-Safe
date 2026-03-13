import { create } from 'zustand';

type RouteMode = 'fastest' | 'safest' | 'balanced';

interface MapState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (v: boolean) => void;

  routeMode: RouteMode;
  setRouteMode: (mode: RouteMode) => void;

  showHeatmap: boolean;
  toggleHeatmap: () => void;

  showLighting: boolean;
  toggleLighting: () => void;

  showSafeHavens: boolean;
  toggleSafeHavens: () => void;

  showEmergency: boolean;
  toggleEmergency: () => void;

  walkMeHomeActive: boolean;
  setWalkMeHome: (v: boolean) => void;

  sheetOpen: boolean;
  setSheetOpen: (v: boolean) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const getInitialDarkMode = () => {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 20;
};

export const useMapStore = create<MapState>((set) => ({
  isDarkMode: getInitialDarkMode(),
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
  setDarkMode: (v) => set({ isDarkMode: v }),

  routeMode: 'balanced',
  setRouteMode: (mode) => set({ routeMode: mode }),

  showHeatmap: false,
  toggleHeatmap: () => set((s) => ({ showHeatmap: !s.showHeatmap })),

  showLighting: false,
  toggleLighting: () => set((s) => ({ showLighting: !s.showLighting })),

  showSafeHavens: false,
  toggleSafeHavens: () => set((s) => ({ showSafeHavens: !s.showSafeHavens })),

  showEmergency: false,
  toggleEmergency: () => set((s) => ({ showEmergency: !s.showEmergency })),

  walkMeHomeActive: false,
  setWalkMeHome: (v) => set({ walkMeHomeActive: v }),

  sheetOpen: true,
  setSheetOpen: (v) => set({ sheetOpen: v }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
