import { Analytics } from '@vercel/analytics/react';
import { PopupProvider } from './contexts/PopupContext';
import { TileProvider } from './contexts/TileContext';
import { FocusProvider } from './contexts/FocusContext';
import { DiscoveryProvider } from './contexts/DiscoveryContext';
import Board from './components/canvas/Board';
import FocusView from './components/focus/FocusView';
import Backdrop from './components/overlays/Backdrop';
import InfoPanel from './components/overlays/InfoPanel';
import ContactPanel from './components/overlays/ContactPanel';
import CompletePanel from './components/overlays/CompletePanel';
import ProjectPanel from './components/overlays/ProjectPanel';
import NavBar from './components/chrome/NavBar';
import ChromeOverlay from './components/chrome/ChromeOverlay';
import DiscoveryCounter from './components/ui/DiscoveryCounter';
import LoadingScreen from './components/ui/LoadingScreen';
import MouseTrail from './components/ui/MouseTrail';

export default function App() {
  return (
    <PopupProvider>
      <TileProvider>
        <FocusProvider>
          <DiscoveryProvider>
            <Board />
            <FocusView />
            <Backdrop />
            <InfoPanel />
            <ContactPanel />
            <CompletePanel />
            <ProjectPanel />
            <NavBar />
            <ChromeOverlay />
            <DiscoveryCounter />
            <LoadingScreen />
            <MouseTrail />
            <Analytics />
          </DiscoveryProvider>
        </FocusProvider>
      </TileProvider>
    </PopupProvider>
  );
}
