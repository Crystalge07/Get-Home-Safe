import MapView from '@/components/map/MapView';
import BottomSheet from '@/components/map/BottomSheet';
import FloatingControls from '@/components/map/FloatingControls';

const Index = () => {
  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <MapView />
      <FloatingControls />
      <BottomSheet />
    </div>
  );
};

export default Index;
