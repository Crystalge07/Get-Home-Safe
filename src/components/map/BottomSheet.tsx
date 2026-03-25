import { motion, useDragControls, useMotionValue, animate } from 'framer-motion';
import { useMapStore } from '@/store/useMapStore';
import { Search } from 'lucide-react';
import RouteCards from './RouteCards';
import { useRef, useState, useEffect } from 'react';

const SNAP_POINTS = { collapsed: 72, mid: 200, full: 440 };
const GTA_BOUNDS = {
  south: 43.2,
  west: -80.15,
  north: 44.45,
  east: -78.7,
};

const BottomSheet = () => {
  const {
    originQuery,
    destinationQuery,
    setOriginQuery,
    setDestinationQuery,
    setOrigin,
    setDestination,
    mapsLoaded,
  } = useMapStore();
  const [sheetHeight, setSheetHeight] = useState(SNAP_POINTS.mid);
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  // Attach Places Autocomplete when script is loaded
  useEffect(() => {
    if (!mapsLoaded || typeof google === 'undefined') return;
    const o = originInputRef.current;
    const d = destInputRef.current;
    if (!o || !d) return;
    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      types: ['establishment', 'geocode'],
      fields: ['geometry', 'formatted_address', 'name'],
      bounds: GTA_BOUNDS,
      strictBounds: true,
      componentRestrictions: { country: 'ca' },
    };
    const a1 = new google.maps.places.Autocomplete(o, autocompleteOptions);
    const a2 = new google.maps.places.Autocomplete(d, autocompleteOptions);
    a1.addListener('place_changed', () => {
      const place = a1.getPlace();
      const loc = place.geometry?.location;
      if (loc) {
        const label = place.name
          ? `${place.name}, ${place.formatted_address ?? ''}`
          : (place.formatted_address ?? '');
        setOrigin({ lat: loc.lat(), lng: loc.lng(), label });
        setOriginQuery(o.value);
      }
    });
    a2.addListener('place_changed', () => {
      const place = a2.getPlace();
      const loc = place.geometry?.location;
      if (loc) {
        const label = place.name
          ? `${place.name}, ${place.formatted_address ?? ''}`
          : (place.formatted_address ?? '');
        setDestination({ lat: loc.lat(), lng: loc.lng(), label });
        setDestinationQuery(d.value);
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

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-card rounded-t-2xl sheet-shadow overflow-hidden border border-white/20 ring-1 ring-white/10"
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={originInputRef}
            type="text"
            placeholder="Starting location"
            defaultValue={originQuery}
            onChange={(e) => setOriginQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/20 ring-1 ring-white/10 focus:ring-2 focus:ring-primary/30 transition-shadow"
            onFocus={() => setSheetHeight(SNAP_POINTS.full)}
          />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={destInputRef}
            type="text"
            placeholder="Destination"
            defaultValue={destinationQuery}
            onChange={(e) => setDestinationQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/20 ring-1 ring-white/10 focus:ring-2 focus:ring-primary/30 transition-shadow"
            onFocus={() => setSheetHeight(SNAP_POINTS.full)}
          />
        </div>

        <RouteCards />
      </div>
    </motion.div>
  );
};

export default BottomSheet;
