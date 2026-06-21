import React from 'react';
import Scene3D from './components/Scene3D';
import UIOverlay from './components/UIOverlay';
import GameModeMenu from './components/GameModeMenu';
import useGameStore from './store/gameStore';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Scene3D />
      </div>
      {phase === 'MENU' ? <GameModeMenu /> : <UIOverlay />}
    </div>
  );
}
