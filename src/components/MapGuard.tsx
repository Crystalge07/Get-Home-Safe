import GoogleMapView from '@/components/map/GoogleMapView';

/**
 * Only renders the map when VITE_GOOGLE_MAPS_API_KEY is set.
 * Prevents useJsApiLoader from running with an empty key (which can cause runtime errors).
 */
const MapGuard = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || String(apiKey).trim() === '') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="text-lg font-medium text-foreground">Google Maps API key missing</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Add <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_GOOGLE_MAPS_API_KEY</code> to a{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env</code> file in the project root, then restart the dev server.
        </p>
      </div>
    );
  }

  return <GoogleMapView />;
};

export default MapGuard;
