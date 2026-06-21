import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import useGameStore from '../store/gameStore';
import ActiveBoardPanel from './ActiveBoardPanel';
import { peerManager } from '../utils/peerManager';

const FACE_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export default function UIOverlay() {
  const phase = useGameStore((s) => s.phase);
  const gameMode = useGameStore((s) => s.gameMode);
  const topFace = useGameStore((s) => s.topFace);
  const viewedFace = useGameStore((s) => s.viewedFace);
  const viewMoveIndex = useGameStore((s) => s.viewMoveIndex);
  const games = useGameStore((s) => s.games);
  const rollDie = useGameStore((s) => s.rollDie);
  const rollCount = useGameStore((s) => s.rollCount);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const myColor = useGameStore((s) => s.myColor);
  const roomId = useGameStore((s) => s.roomId);
  const backToMenu = useGameStore((s) => s.backToMenu);
  const setViewedFace = useGameStore((s) => s.setViewedFace);
  const navigateHistory = useGameStore((s) => s.navigateHistory);
  const applyOpponentMove = useGameStore((s) => s.applyOpponentMove);
  const handleResign = useGameStore((s) => s.handleResign);
  const setPhase = useGameStore((s) => s.setPhase);
  const gameOverMsg = useGameStore((s) => s.gameOverMsg);

  const [localRoomId, setLocalRoomId] = useState('');
  const [copyStatus, setCopyStatus] = useState('Copy');

  // PeerJS Connection Management
  useEffect(() => {
    if (gameMode === 'online_host' && phase === 'WAITING_FOR_OPPONENT') {
      if (!peerManager.peer) {
        // If we have roomId (due to takeover), force it. Otherwise undefined.
        peerManager.initialize(true, (id) => {
          setLocalRoomId(id);
        }, undefined, roomId || undefined);
      }
      peerManager.onConnection(() => {
        const state = useGameStore.getState();
        if (state.topFace !== null) {
          // Reconnecting to an existing game
          peerManager.send({
            type: 'SYNC_STATE',
            data: {
              games: state.games,
              moveHistory: state.moveHistory,
              boardStatus: state.boardStatus,
              topFace: state.topFace,
              rollTargetFace: state.rollTargetFace,
              rollCount: state.rollCount,
              phase: state.phase,
              currentPlayer: state.currentPlayer,
              hostColor: state.myColor
            }
          });
          // Restore host's phase
          setPhase(state.currentPlayer === state.myColor ? 'PLAYER_TURN' : 'OPPONENT_TURN');
        } else {
          // First time roll
          const nextFace = Math.floor(Math.random() * 6);
          useGameStore.getState().rollDie(nextFace);
          peerManager.send({ type: 'ROLL', face: nextFace });
        }
      });
      peerManager.onClose(() => {
        setPhase('WAITING_FOR_OPPONENT');
      });
      peerManager.onData((data) => {
        const state = useGameStore.getState();
        if (data.type === 'MOVE_AND_ROLL') {
          state.applyOpponentMove(data.face, data.move, data.nextFace);
        } else if (data.type === 'MOVE_AND_END') {
          state.applyOpponentMove(data.face, data.move, null);
        } else if (data.type === 'RESIGN') {
          state.handleResign(false);
        } else if (data.type === 'ROLL') {
          state.rollDie(data.face);
        }
      });
    } else if (gameMode === 'online_join' && phase === 'CONNECTING') {
      if (!peerManager.peer) {
        peerManager.initialize(false, () => {
          peerManager.connect(roomId, () => {
            if (useGameStore.getState().phase === 'CONNECTING') {
              setPhase('READY');
            }
          });
        });
      } else {
        peerManager.connect(roomId, () => {
          if (useGameStore.getState().phase === 'CONNECTING') {
            setPhase('READY');
          }
        });
      }

      peerManager.onClose(() => {
        const store = useGameStore.getState();
        if (store.phase !== 'MENU') {
          // Host Takeover! The host dropped, so we become the host using the SAME room ID.
          peerManager.destroy();
          store.setGameMode('online_host');
          store.setPhase('WAITING_FOR_OPPONENT');
        }
      });

      peerManager.onData((data) => {
        const state = useGameStore.getState();
        if (data.type === 'SYNC_STATE') {
          state.syncState(data.data);
        } else if (data.type === 'MOVE_AND_ROLL') {
          state.applyOpponentMove(data.face, data.move, data.nextFace);
        } else if (data.type === 'MOVE_AND_END') {
          state.applyOpponentMove(data.face, data.move, null);
        } else if (data.type === 'RESIGN') {
          state.handleResign(false);
        } else if (data.type === 'ROLL') {
          state.rollDie(data.face);
        } else if (data.type === 'KICK') {
          peerManager.destroy();
          state.backToMenu("Vous avez été exclu par l'hôte.");
        }
      });
    }

    return () => {
      if (useGameStore.getState().phase === 'MENU') peerManager.destroy();
    };
  }, [gameMode, phase, roomId]);

  // Keyboard navigation for history
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        navigateHistory(-1);
      } else if (e.key === 'ArrowRight') {
        navigateHistory(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateHistory]);

  // Status text
  const getStatusText = () => {
    switch (phase) {
      case 'MENU': return '';
      case 'WAITING_FOR_OPPONENT': return 'Waiting for opponent...';
      case 'CONNECTING': return 'Connecting to host...';
      case 'READY': return 'Starting game...';
      case 'ROLLING': return 'Rolling...';
      case 'GAME_OVER': return gameOverMsg || 'Game Over';
      case 'PLAYER_TURN':
        if (topFace !== null) {
          const chess = new Chess(games[topFace]);
          if (chess.isGameOver()) return `Board #${topFace + 1} — Game Over`;
          return `Your turn on Board #${topFace + 1}`;
        }
        return 'Your turn';
      case 'OPPONENT_TURN':
        return `Opponent's turn on Board #${topFace + 1}...`;
      default:
        return '';
    }
  };

  const getPhaseClass = () => {
    switch (phase) {
      case 'ROLLING': return 'rolling';
      case 'PLAYER_TURN': return 'player';
      case 'OPPONENT_TURN': return 'bot';
      case 'GAME_OVER': return 'game-over';
      default: return 'ready';
    }
  };

  const showPanel = (phase === 'PLAYER_TURN' || phase === 'OPPONENT_TURN' || phase === 'GAME_OVER') && viewedFace !== null;

  // Don't render overlay in menu phase
  if (phase === 'MENU') return null;

  return (
    <div className="ui-overlay">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="logo">
          <div className="logo-icon">♟</div>
          <span className="logo-text">DiceChess</span>
          {gameMode && (
            <span className="mode-badge">
              {gameMode.startsWith('online') ? '🌐 Online' : ''}
            </span>
          )}
        </div>
        <div
          className={`status-banner ${phase === 'PLAYER_TURN' || phase === 'OPPONENT_TURN' ? 'active' : ''}`}
        >
          <span className={`phase-dot ${getPhaseClass()}`} />
          {getStatusText()}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {gameMode === 'online_host' && phase !== 'WAITING_FOR_OPPONENT' && phase !== 'GAME_OVER' && (
            <button className="back-menu-btn" style={{ fontSize: '14px', width: 'auto', padding: '0 10px', background: '#ff4444' }} onClick={() => {
              peerManager.send({ type: 'KICK' });
              // Disconnect the current peer connection, but don't destroy the PeerJS instance
              // so we can accept new connections
              if (peerManager.connection) {
                peerManager.connection.close();
                peerManager.connection = null;
              }
              // Return host to waiting phase
              setPhase('WAITING_FOR_OPPONENT');
            }} title="Kick Opponent">
              Kick
            </button>
          )}
          <button className="back-menu-btn" onClick={() => {
            if(gameMode?.startsWith('online')) peerManager.destroy();
            backToMenu();
          }} title="Back to menu">
            ✕
          </button>
        </div>
      </div>

      {/* Board Indicators (Right Side) */}
      <div className="board-indicators">
        {games.map((fen, i) => {
          const chess = new Chess(fen);
          const isOver = chess.isGameOver();
          return (
            <div
              key={i}
              onClick={() => {
                if (phase !== 'ROLLING' && phase !== 'READY' && phase !== 'WAITING_FOR_OPPONENT' && phase !== 'CONNECTING') {
                  setViewedFace(i);
                }
              }}
              className={`board-indicator ${viewedFace === i ? 'active' : ''} ${isOver ? 'game-over' : ''} ${topFace === i ? 'top-face-highlight' : ''}`}
            >
              {FACE_LABELS[i]}
            </div>
          );
        })}
        
        {/* View 3D Die Button */}
        {(phase === 'PLAYER_TURN' || phase === 'OPPONENT_TURN' || phase === 'GAME_OVER') && (
          <div 
            onClick={() => {
              setViewedFace(null);
            }}
            className={`board-indicator ${viewedFace === null ? 'active' : ''}`}
            style={{ marginTop: '15px', fontSize: '20px' }}
            title="Voir le dé 3D"
          >
            🎲
          </div>
        )}
      </div>

      {/* Center Messages */}
      {phase === 'WAITING_FOR_OPPONENT' && (
        <div className="side-message">
          <h2>Room Created</h2>
          <p>Share this code:</p>
          <div className="room-id-box">
            <input 
              id="room-code-input"
              className="room-id-input"
              value={localRoomId || roomId || '...'} 
              readOnly 
              onClick={(e) => e.target.select()}
            />
            <button 
              className="back-menu-btn"
              style={{width: 'auto', padding: '0 10px', fontSize: '14px'}}
              onClick={() => {
              const input = document.getElementById('room-code-input');
              input.select();
              try {
                document.execCommand('copy');
                setCopyStatus('Copied!');
              } catch(e) {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(localRoomId);
                  setCopyStatus('Copied!');
                }
              }
              setTimeout(() => setCopyStatus('Copy'), 2000);
            }}>{copyStatus}</button>
          </div>
        </div>
      )}

      {phase === 'GAME_OVER' && (
        <div className="center-message game-over-screen">
          <h2>{gameOverMsg}</h2>
          <button onClick={() => {
            peerManager.destroy();
            backToMenu();
          }}>Return to Menu</button>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="bottom-controls">
        {viewedFace !== null && viewMoveIndex && viewMoveIndex[viewedFace] !== -1 && (
          <div className="history-controls">
            <span style={{color: 'white', marginRight: '10px'}}>Viewing Past Move</span>
          </div>
        )}
      </div>

      {/* Active Board Panel */}
      {showPanel && <ActiveBoardPanel />}
    </div>
  );
}
