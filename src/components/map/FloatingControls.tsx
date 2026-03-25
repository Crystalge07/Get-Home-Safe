import { useMapStore } from '@/store/useMapStore';
import { Flame, Building2, MapPin, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const FloatingControls = () => {
  const {
    showHeatmap,
    toggleHeatmap,
    showPoliceFire,
    togglePoliceFire,
    showSafeAreas,
    toggleSafeAreas,
    walkMeHomeActive,
    setWalkMeHomePanelOpen,
  } = useMapStore();

  const layerButtons = [
    {
      active: showHeatmap,
      toggle: toggleHeatmap,
      icon: Flame,
      label: 'Crime Heatmap',
      tooltip: 'Show/Hide Safety Heatmap',
    },
    {
      active: showPoliceFire,
      toggle: togglePoliceFire,
      icon: Building2,
      label: 'Police & Fire Stations',
      tooltip: 'Safe Authorities',
    },
    {
      active: showSafeAreas,
      toggle: toggleSafeAreas,
      icon: MapPin,
      label: '24/7 Safe Areas',
      tooltip: 'Verified 24/7 Safe Spaces',
    },
  ];

  return (
    <>
      {/* Right side: layer toggles (top to bottom) */}
      <div className="fixed right-4 top-20 z-[1000] flex flex-col gap-2">
        {layerButtons.map(({ active, toggle, icon: Icon, label, tooltip }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <button
                onClick={toggle}
                aria-label={tooltip}
                className={`w-10 h-10 rounded-full fab-shadow border border-white/20 ring-1 ring-white/10 hover:border-white/30 hover:ring-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                  active ? 'bg-card ring-2 ring-primary/30' : 'bg-card'
                }`}
                title={label}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-foreground' : 'text-foreground/70'}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Top-left: Get Home Safe logo + Walk Me Home */}
      <div className="fixed top-4 left-4 z-[1001] flex flex-col gap-2">
        <div className="flex items-center justify-center px-3 py-2 bg-card/95 rounded-xl fab-shadow border border-white/20 ring-1 ring-white/10 backdrop-blur-sm">
          <span className="text-sm font-bold text-foreground tracking-tight text-center">Get Home Safe</span>
        </div>
        <button
          onClick={() => setWalkMeHomePanelOpen(true)}
          className={`flex items-center justify-center gap-2 px-4 h-10 rounded-xl fab-shadow border border-white/20 ring-1 ring-white/10 hover:border-white/30 hover:ring-white/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full ${
            walkMeHomeActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-card/95 text-foreground backdrop-blur-sm'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-xs font-medium">
            {walkMeHomeActive ? 'Sharing...' : 'Walk Me Home'}
          </span>
          {walkMeHomeActive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary-foreground/60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground" />
            </span>
          )}
        </button>
      </div>
    </>
  );
};

export default FloatingControls;
