import MapGuard from '@/components/MapGuard';
import BottomSheet from '@/components/map/BottomSheet';
import FloatingControls from '@/components/map/FloatingControls';
import WalkMeHomePanel from '@/components/map/WalkMeHomePanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const Index = () => {
  return (
    <ErrorBoundary>
      <div className="h-screen w-screen overflow-hidden relative">
        <MapGuard />
        <FloatingControls />
        <WalkMeHomePanel />
        <BottomSheet />
      </div>
    </ErrorBoundary>
  );
};

export default Index;
