import GoogleMapView from '@/components/map/GoogleMapView';
import BottomSheet from '@/components/map/BottomSheet';
import FloatingControls from '@/components/map/FloatingControls';

const Index = () => {
  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <GoogleMapView />
      <FloatingControls />
      <BottomSheet />
    </div>
  );
};

export default Index;
