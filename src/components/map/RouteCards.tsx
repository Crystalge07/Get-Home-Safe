import { useMapStore } from '@/store/useMapStore';
import { Clock, Route } from 'lucide-react';

const DEFAULT_ROUTES = {
  fastest: { time: '—', distance: '—', label: 'Fastest Route' },
  safest: { time: '—', distance: '—', label: 'Safest Route' },
  balanced: { time: '—', distance: '—', label: 'Balanced Route' },
};

const RouteCards = () => {
  const { routeMode, setRouteMode, routeResult } = useMapStore();

  const routes = {
    fastest: routeResult?.fastest
      ? {
          time: routeResult.fastest.duration,
          distance: routeResult.fastest.distance,
          label: 'Fastest Route',
        }
      : DEFAULT_ROUTES.fastest,
    safest: routeResult?.safest
      ? {
          time: routeResult.safest.duration,
          distance: routeResult.safest.distance,
          label: 'Safest Route',
        }
      : DEFAULT_ROUTES.safest,
    balanced: routeResult?.fastest
      ? {
          time: routeResult.fastest.duration,
          distance: routeResult.fastest.distance,
          label: 'Balanced Route',
        }
      : DEFAULT_ROUTES.balanced,
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Routes (walking)</p>
      {(['fastest', 'balanced', 'safest'] as const).map((key) => {
        const route = routes[key];
        const isActive = routeMode === key;
        return (
          <button
            key={key}
            onClick={() => setRouteMode(key)}
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
          </button>
        );
      })}

      <button className="w-full py-3 mt-1 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98]">
        Start Walk
      </button>
    </div>
  );
};

export default RouteCards;
