import { motion, useDragControls, useMotionValue, useTransform, animate } from 'framer-motion';
import { useMapStore } from '@/store/useMapStore';
import { Search, Navigation, Shield, Zap, ChevronUp } from 'lucide-react';
import RouteCards from './RouteCards';
import { useRef, useState } from 'react';

const SNAP_POINTS = { collapsed: 72, mid: 320, full: 520 };

const BottomSheet = () => {
  const { searchQuery, setSearchQuery, routeMode, setRouteMode } = useMapStore();
  const [sheetHeight, setSheetHeight] = useState(SNAP_POINTS.mid);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  const handleDragEnd = (_: any, info: any) => {
    const velocity = info.velocity.y;
    const currentY = info.point.y;

    if (velocity > 300) {
      setSheetHeight(SNAP_POINTS.collapsed);
    } else if (velocity < -300) {
      setSheetHeight(SNAP_POINTS.full);
    } else {
      // Snap to nearest
      const windowH = window.innerHeight;
      const sheetTop = windowH - sheetHeight + y.get();
      const distFromBottom = windowH - sheetTop;

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

  const modes = [
    { key: 'fastest' as const, label: 'Fastest', icon: Zap },
    { key: 'balanced' as const, label: 'Balanced', icon: Navigation },
    { key: 'safest' as const, label: 'Safest', icon: Shield },
  ];

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-card rounded-t-2xl sheet-shadow overflow-hidden"
      animate={{ height: sheetHeight }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      {/* Drag handle */}
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
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Where are you headed?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            onFocus={() => setSheetHeight(SNAP_POINTS.full)}
          />
        </div>

        {/* Route mode selector */}
        <div className="flex gap-1.5 p-1 bg-secondary rounded-xl">
          {modes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setRouteMode(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                routeMode === key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Route cards */}
        <RouteCards />
      </div>
    </motion.div>
  );
};

export default BottomSheet;
