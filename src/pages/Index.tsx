import GoogleMapView from '@/components/map/GoogleMapView';
import BottomSheet from '@/components/map/BottomSheet';
import FloatingControls from '@/components/map/FloatingControls';
import WalkMeHomePanel from '@/components/map/WalkMeHomePanel';

const Index = () => {
  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <GoogleMapView />
      <FloatingControls />
      <WalkMeHomePanel />
      <BottomSheet />
    </div>
  );
};

export default Index;
