import React, { useState, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import UIOverlay from './components/UIOverlay';
import GameModeMenu from './components/GameModeMenu';
import useGameStore from './store/gameStore';
import { preloadPieceImages } from './utils/pieceImages';

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    preloadPieceImages().then(() => setImagesLoaded(true));
  }, []);

  if (!imagesLoaded) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
        Loading Assets...
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Scene3D />
      </div>
      {phase === 'MENU' ? <GameModeMenu /> : <UIOverlay />}
    </div>
  );
}
