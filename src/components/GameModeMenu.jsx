import React, { useState } from 'react';
import useGameStore from '../store/gameStore';
import { peerManager } from '../utils/peerManager';

export default function GameModeMenu() {
  const startGame = useGameStore((s) => s.startGame);
  const menuMsg = useGameStore((s) => s.menuMsg);
  const [hoveredMode, setHoveredMode] = useState(null);

  return (
    <div className="menu-overlay">
      <div className="menu-container">
        {/* Animated background particles */}
        <div className="menu-particles">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }} />
          ))}
        </div>

        {/* Logo */}
        <div className="menu-logo">
          {menuMsg && (
            <div className="menu-msg error-msg" style={{ marginBottom: '20px', color: '#ff4444', fontWeight: 'bold' }}>
              {menuMsg}
            </div>
          )}
          <div className="menu-dice-icon">
            <span className="dice-face">♟</span>
          </div>
          <h1 className="menu-title">DiceChess</h1>
          <p className="menu-subtitle">Roll the die. Play the face. Master all six.</p>
        </div>

        <div className="menu-modes">
          {!hoveredMode?.startsWith('online_join_input') ? (
            <>

              <button
                className={`mode-card ${hoveredMode === 'online_host' ? 'hovered' : ''}`}
                onClick={() => {
                  startGame('online_host');
                }}
                onMouseEnter={() => setHoveredMode('online_host')}
                onMouseLeave={() => setHoveredMode(null)}
              >
                <div className="mode-icon">🌐</div>
                <div className="mode-info">
                  <h3 className="mode-name">Host Game</h3>
                  <p className="mode-desc">Create a room code</p>
                </div>
              </button>

              <button
                className={`mode-card ${hoveredMode === 'online_join' ? 'hovered' : ''}`}
                onClick={() => setHoveredMode('online_join_input')}
                onMouseEnter={() => setHoveredMode('online_join')}
                onMouseLeave={() => setHoveredMode(null)}
              >
                <div className="mode-icon">🔗</div>
                <div className="mode-info">
                  <h3 className="mode-name">Join Game</h3>
                  <p className="mode-desc">Enter a room code</p>
                </div>
              </button>
            </>
          ) : (
            <div className="join-form">
              <input type="text" id="join-id" placeholder="ROOM ID" maxLength="6" autoFocus />
              <div className="join-actions">
                <button className="join-btn" onClick={() => {
                  const val = document.getElementById('join-id').value.toUpperCase();
                  if(val) startGame('online_join', val, 'b');
                }}>Join Game</button>
                <button className="cancel-btn" onClick={() => setHoveredMode(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Rules hint */}
        <div className="menu-rules">
          <p>6 chess games on 6 faces • Roll to switch • Win them all</p>
        </div>
      </div>
    </div>
  );
}
