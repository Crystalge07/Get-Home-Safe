import { motion, useDragControls, useMotionValue, animate } from 'framer-motion';
import { useMapStore } from '@/store/useMapStore';
import { Search } from 'lucide-react';
import RouteCards from './RouteCards';
import { useRef, useState, useEffect } from 'react';
import type { SafetyLayerMode } from '@/store/useMapStore';

const SNAP_POINTS = { collapsed: 72, mid: 380, full: 560 };

const BottomSheet = () => {
  const {
    originQuery,
    destinationQuery,
    setOriginQuery,
    setDestinationQuery,
    setOrigin,
    setDestination,
    safetyLayerMode,
    setSafetyLayerMode,
    mapsLoaded,
  } = useMapStore();
  const [sheetHeight, setSheetHeight] = useState(SNAP_POINTS.mid);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  const handleGetRoute = () => {
    if (!mapsLoaded || typeof google === 'undefined') return;
    setGeocodeError(null);
    const geocoder = new google.maps.Geocoder();
    const geocode = (address: string): Promise<{ lat: number; lng: number } | null> =>
      new Promise((resolve) => {
        geocoder.geocode({ address }, (results: google.maps.GeocoderResult[] | null) => {
          if (results?.[0]?.geometry?.location) {
            resolve({ lat: results[0].geometry!.location!.lat(), lng: results[0].geometry!.location!.lng() });
          } else resolve(null);
        });
      });
    Promise.all([geocode(originQuery.trim()), geocode(destinationQuery.trim())]).then(([o, d]) => {
      if (o) setOrigin(o);
      if (d) setDestination(d);
      if (!o || !d) setGeocodeError('Could not find one or both addresses. Try selecting from suggestions.');
    });
  };

  // Attach Places Autocomplete when script is loaded
  useEffect(() => {
    if (!mapsLoaded || typeof google === 'undefined') return;
    const o = originInputRef.current;
    const d = destInputRef.current;
    if (!o || !d) return;
    const a1 = new google.maps.places.Autocomplete(o, { types: ['geocode'] });
    const a2 = new google.maps.places.Autocomplete(d, { types: ['geocode'] });
    a1.addListener('place_changed', () => {
      const place = a1.getPlace();
      const loc = place.geometry?.location;
      if (loc) {
        setOrigin({ lat: loc.lat(), lng: loc.lng(), label: place.formatted_address ?? undefined });
        setOriginQuery(place.formatted_address ?? '');
      }
    });
    a2.addListener('place_changed', () => {
      const place = a2.getPlace();
      const loc = place.geometry?.location;
      if (loc) {
        setDestination({ lat: loc.lat(), lng: loc.lng(), label: place.formatted_address ?? undefined });
        setDestinationQuery(place.formatted_address ?? '');
      }
    });
    return () => {
      google.maps.event.clearInstanceListeners(a1);
      google.maps.event.clearInstanceListeners(a2);
    };
  }, [mapsLoaded, setOrigin, setDestination, setOriginQuery, setDestinationQuery]);

  const handleDragEnd = (_: unknown, info: { velocity: { y: number }; point: { y: number } }) => {
    const velocity = info.velocity.y;
    const windowH = window.innerHeight;
    const sheetTop = windowH - sheetHeight + y.get();
    const distFromBottom = windowH - sheetTop;

    if (velocity > 300) {
      setSheetHeight(SNAP_POINTS.collapsed);
    } else if (velocity < -300) {
      setSheetHeight(SNAP_POINTS.full);
    } else {
      if (distFromBottom < 150) setSheetHeight(SNAP_POINTS.collapsed);
      else if (distFromBottom < 400) setSheetHeight(SNAP_POINTS.mid);
      else setSheetHeight(SNAP_POINTS.full);
    }
    animate(y, 0, { type: 'spring', stiffness: 400, damping: 35 });
  };

  const expandSheet = () => {
    if (sheetHeight === SNAP_POINTS.collapsed) setSheetHeight(SNAP_POINTS.mid);
    else if (sheetHeight === SNAP_POINTS.mid) setSheetHeight(SNAP_POINTS.full);
  };

  const safetyModes: { key: SafetyLayerMode; label: string }[] = [
    { key: 'crime', label: 'Crime-based safety' },
    { key: 'general', label: 'General safety index' },
  ];

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-card rounded-t-2xl sheet-shadow overflow-hidden"
      animate={{ height: sheetHeight }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      <motion.div
        className="flex justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing"
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: -200, bottom: 200 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ y }}
        onClick={expandSheet}
      >
        <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
      </motion.div>

      <div className="px-4 pb-4 space-y-3 overflow-y-auto" style={{ maxHeight: sheetHeight - 40 }}>
        {/* Origin */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={originInputRef}
            type="text"
            placeholder="Starting location"
            value={originQuery}
            onChange={(e) => setOriginQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            onFocus={() => setSheetHeight(SNAP_POINTS.full)}
          />
        </div>
        {/* Destination */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={destInputRef}
            type="text"
            placeholder="Destination"
            value={destinationQuery}
            onChange={(e) => setDestinationQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            onFocus={() => setSheetHeight(SNAP_POINTS.full)}
          />
        </div>

        <button
          type="button"
          onClick={handleGetRoute}
          disabled={!originQuery.trim() || !destinationQuery.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50 disabled:pointer-events-none"
        >
          Get route (walking)
        </button>
        {geocodeError && <p className="text-xs text-destructive">{geocodeError}</p>}

        {/* Safety layer toggle: Crime-based vs General safety index */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Safety data</p>
          <div className="flex gap-1.5 p-1 bg-secondary rounded-xl">
            {safetyModes.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSafetyLayerMode(key)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  safetyLayerMode === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <RouteCards />
      </div>
    </motion.div>
  );
};

export default BottomSheet;
