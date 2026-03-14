import { useMapStore } from '@/store/useMapStore';
import { Flame, Building2, MapPin, Users, Shield } from 'lucide-react';

const FloatingControls = () => {
  const {
    showHeatmap,
    toggleHeatmap,
    showPoliceFire,
    togglePoliceFire,
    showSafeAreas,
    toggleSafeAreas,
    walkMeHomeActive,
    setWalkMeHome,
  } = useMapStore();

  const layerButtons = [
    { active: showHeatmap, toggle: toggleHeatmap, icon: Flame, label: 'Crime Heatmap', activeColor: 'text-danger' },
    { active: showPoliceFire, toggle: togglePoliceFire, icon: Building2, label: 'Police & Fire Stations', activeColor: 'text-primary' },
    { active: showSafeAreas, toggle: toggleSafeAreas, icon: MapPin, label: '24/7 Safe Areas', activeColor: 'text-accent' },
  ];

  return (
    <>
      {/* Right side: layer toggles (top to bottom) */}
      <div className="fixed right-4 top-20 z-[1000] flex flex-col gap-2">
        {layerButtons.map(({ active, toggle, icon: Icon, label, activeColor }) => (
          <button
            key={label}
            onClick={toggle}
            className={`w-10 h-10 rounded-full fab-shadow flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
              active ? 'bg-card ring-2 ring-primary/30' : 'bg-card'
            }`}
            title={label}
          >
            <Icon className={`w-4 h-4 ${active ? activeColor : 'text-muted-foreground'}`} />
          </button>
        ))}
      </div>

      {/* Bottom-right: Walk Me Home FAB (pinned at bottom) */}
      <div className="fixed right-4 bottom-4 z-[1000]">
        <button
          onClick={() => setWalkMeHome(!walkMeHomeActive)}
          className={`flex items-center gap-2 px-4 h-10 rounded-full fab-shadow transition-all duration-200 hover:scale-105 active:scale-95 ${
            walkMeHomeActive
              ? 'bg-accent text-accent-foreground'
              : 'bg-card text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-xs font-medium">
            {walkMeHomeActive ? 'Sharing...' : 'Walk Me Home'}
          </span>
          {walkMeHomeActive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-accent-foreground/60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-foreground" />
            </span>
          )}
        </button>
      </div>

      {/* Top-left: SafeMap logo */}
      <div className="fixed top-4 left-4 z-[1000]">
        <div className="flex items-center gap-2 px-3 py-2 bg-card/95 rounded-xl fab-shadow backdrop-blur-sm">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">SafeMap</span>
        </div>
      </div>
    </>
  );
};

export default FloatingControls;
