import { useMapStore } from '@/store/useMapStore';
import { Clock, Route, Shield } from 'lucide-react';

const ROUTES = {
  fastest: { time: '12 min', distance: '0.9 mi', score: 'C', label: 'Fastest Route' },
  safest: { time: '18 min', distance: '1.4 mi', score: 'A', label: 'Safest Route' },
  balanced: { time: '14 min', distance: '1.1 mi', score: 'B+', label: 'Balanced Route' },
};

const scoreStyles: Record<string, string> = {
  'A': 'bg-safe/15 text-safe',
  'B+': 'bg-safe/10 text-safe',
  'B': 'bg-safe/10 text-safe',
  'C': 'bg-warning/15 text-warning',
  'D': 'bg-danger/15 text-danger',
  'F': 'bg-danger/20 text-danger',
};

const RouteCards = () => {
  const { routeMode, setRouteMode } = useMapStore();

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Routes</p>
      {Object.entries(ROUTES).map(([key, route]) => {
        const isActive = routeMode === key;
        return (
          <button
            key={key}
            onClick={() => setRouteMode(key as any)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 text-left ${
              isActive
                ? 'bg-primary/8 ring-1 ring-primary/20'
                : 'bg-secondary/50 hover:bg-secondary'
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <span className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-foreground/80'}`}>
                {route.label}
              </span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {route.time}
                </span>
                <span className="flex items-center gap-1">
                  <Route className="w-3 h-3" />
                  {route.distance}
                </span>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${scoreStyles[route.score] || 'bg-muted text-muted-foreground'}`}>
              <Shield className="w-3 h-3" />
              {route.score}
            </div>
          </button>
        );
      })}

      {/* Start Walk button */}
      <button className="w-full py-3 mt-1 bg-accent text-accent-foreground rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98]">
        Start Walk
      </button>
    </div>
  );
};

export default RouteCards;
