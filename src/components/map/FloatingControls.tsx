import { useMapStore } from '@/store/useMapStore';
import { Sun, Moon, Flame, Lightbulb, MapPin, Crosshair, AlertTriangle, Users } from 'lucide-react';

const FloatingControls = () => {
  const {
    isDarkMode, toggleDarkMode,
    showHeatmap, toggleHeatmap,
    showLighting, toggleLighting,
    showEmergency, toggleEmergency,
    walkMeHomeActive, setWalkMeHome,
  } = useMapStore();

  const layerButtons = [
    { active: showHeatmap, toggle: toggleHeatmap, icon: Flame, label: 'Crime', activeColor: 'text-danger' },
    { active: showLighting, toggle: toggleLighting, icon: Lightbulb, label: 'Lights', activeColor: 'text-warning' },
    { active: showEmergency, toggle: toggleEmergency, icon: MapPin, label: 'Safe', activeColor: 'text-primary' },
  ];

  return (
    <>
      {/* Top-right: day/night toggle */}
      <div className="fixed top-4 right-4 z-[1000]">
        <button
          onClick={toggleDarkMode}
          className="w-10 h-10 rounded-full bg-card fab-shadow flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          title={isDarkMode ? 'Switch to day' : 'Switch to night'}
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5 text-warning" /> : <Moon className="w-4.5 h-4.5 text-muted-foreground" />}
        </button>
      </div>

      {/* Right side: layer toggles */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
        {layerButtons.map(({ active, toggle, icon: Icon, label, activeColor }) => (
          <button
            key={label}
            onClick={toggle}
            className={`w-10 h-10 rounded-full fab-shadow flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
              active ? 'bg-card ring-2 ring-primary/30' : 'bg-card/90'
            }`}
            title={label}
          >
            <Icon className={`w-4 h-4 ${active ? activeColor : 'text-muted-foreground'}`} />
          </button>
        ))}
      </div>

      {/* Bottom-right: Walk Me Home FAB */}
      <div className="fixed right-4 z-[1000]" style={{ bottom: 340 }}>
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

// Need Shield import
import { Shield } from 'lucide-react';

export default FloatingControls;
