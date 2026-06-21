import React, { useRef, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import useGameStore from '../store/gameStore';
import { drawChessboard } from '../utils/drawChessboard';

const BOARD_SIZE = 480;
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PROMOTION_PIECES_WHITE = [
  { piece: 'q', symbol: '♕' },
  { piece: 'r', symbol: '♖' },
  { piece: 'b', symbol: '♗' },
  { piece: 'n', symbol: '♘' },
];

const PROMOTION_PIECES_BLACK = [
  { piece: 'q', symbol: '♛' },
  { piece: 'r', symbol: '♜' },
  { piece: 'b', symbol: '♝' },
  { piece: 'n', symbol: '♞' },
];

export default function ActiveBoardPanel() {
  const canvasRef = useRef(null);
  const topFace = useGameStore((s) => s.topFace);
  const viewedFace = useGameStore((s) => s.viewedFace);
  const viewMoveIndex = useGameStore((s) => s.viewMoveIndex);
  const boardStatus = useGameStore((s) => s.boardStatus);
  const games = useGameStore((s) => s.games);
  const phase = useGameStore((s) => s.phase);
  const gameMode = useGameStore((s) => s.gameMode);
  const selectedSquare = useGameStore((s) => s.selectedSquare);
  const legalMoves = useGameStore((s) => s.legalMoves);
  const moveHistory = useGameStore((s) => s.moveHistory);
  const promotionPending = useGameStore((s) => s.promotionPending);
  const selectSquare = useGameStore((s) => s.selectSquare);
  const promoteAndMove = useGameStore((s) => s.promoteAndMove);
  const handleResign = useGameStore((s) => s.handleResign);
  const setGameOverMsg = useGameStore((s) => s.setGameOverMsg);

  // Determine which FEN to show
  let fen = viewedFace !== null ? games[viewedFace] : null;
  const history = viewedFace !== null ? moveHistory[viewedFace] : [];
  
  if (viewedFace !== null && viewMoveIndex[viewedFace] !== -1) {
    const chess = new Chess();
    const movesToPlay = history.slice(0, viewMoveIndex[viewedFace] + 1);
    for (const m of movesToPlay) {
      chess.move(m);
    }
    fen = chess.fen();
  }

  // Draw the board
  useEffect(() => {
    if (!canvasRef.current || viewedFace === null || !fen) return;

    const canvas = canvasRef.current;
    canvas.width = BOARD_SIZE;
    canvas.height = BOARD_SIZE;
    const ctx = canvas.getContext('2d');

    const isCurrentTop = viewedFace === topFace && viewMoveIndex[viewedFace] === -1;

    drawChessboard(ctx, BOARD_SIZE, fen, viewedFace, {
      isActive: isCurrentTop,
      selectedSquare: (phase === 'PLAYER_TURN' && isCurrentTop) ? selectedSquare : null,
      legalMoves: (phase === 'PLAYER_TURN' && isCurrentTop) ? legalMoves : [],
      lastMoveFrom: null,
      lastMoveTo: null,
    });
  }, [fen, viewedFace, topFace, viewMoveIndex, selectedSquare, legalMoves, phase]);

  // Handle click on the board canvas
  const handleCanvasClick = useCallback(
    (e) => {
      if (phase !== 'PLAYER_TURN' || topFace === null || viewedFace !== topFace) return;
      if (viewMoveIndex[viewedFace] !== -1) return; // Cannot play in past
      if (boardStatus[viewedFace] !== null) return; // Cannot play on finished board

      const chess = new Chess(fen);
      if (chess.isGameOver()) return;

      // In bot mode, only white can play
      if (gameMode === 'bot' && chess.turn() !== 'w') return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Scale from display size to logical board
      const scaleX = BOARD_SIZE / rect.width;
      const scaleY = BOARD_SIZE / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const col = Math.floor(x / (BOARD_SIZE / 8));
      const row = Math.floor(y / (BOARD_SIZE / 8));

      if (col < 0 || col > 7 || row < 0 || row > 7) return;

      const square = FILES[col] + RANKS[row];
      selectSquare(square);
    },
    [phase, topFace, viewedFace, viewMoveIndex, fen, selectSquare, gameMode]
  );

  if (viewedFace === null || fen === null) return null;

  const chess = new Chess(fen);
  const isGameOver = chess.isGameOver();
  const turn = chess.turn();

  let gameOverMessage = '';
  if (boardStatus[viewedFace] === 'w') {
    gameOverMessage = gameMode?.startsWith('online') ? 'White wins by checkmate!' : 'Player 1 wins by checkmate!';
  } else if (boardStatus[viewedFace] === 'b') {
    gameOverMessage = gameMode?.startsWith('online') ? 'Black wins by checkmate!' : 'Player 2 wins by checkmate!';
  } else if (boardStatus[viewedFace] === 'draw') {
    gameOverMessage = 'Draw';
  }

  // Status text
  const getStatusText = () => {
    if (viewMoveIndex[viewedFace] !== -1) return 'Viewing History';
    if (boardStatus[viewedFace] !== null) return `Board Finished: ${gameOverMessage}`;
    if (viewedFace !== topFace) return 'Viewing Board (Not active)';
    if (isGameOver) return gameOverMessage;
    if (phase === 'BOT_TURN') return 'Bot is thinking...';
    if (phase === 'OPPONENT_TURN') return 'Opponent is thinking...';
    if (phase === 'PLAYER_TURN') {
      if (gameMode === 'local') {
        return turn === 'w' ? 'Player 1 (White) — click a piece' : 'Player 2 (Black) — click a piece';
      }
      return 'Your turn — click a piece';
    }
    return '';
  };

  // Promotion pieces based on turn color
  const promotionPieces = turn === 'w' ? PROMOTION_PIECES_WHITE : PROMOTION_PIECES_BLACK;

  return (
    <div className="board-panel-backdrop" onClick={(e) => e.target === e.currentTarget && null}>
      <div className="board-panel">
        <div className="board-panel-header">
          <div className="board-panel-title">
            Board <span className="face-badge">FACE {viewedFace + 1}</span>
            {viewedFace !== topFace && <span style={{marginLeft: '10px', fontSize: '12px', color: '#ffb0c8'}}>(Inactive)</span>}
          </div>
          <div className="board-panel-status">
            {getStatusText()}
          </div>
        </div>

        <div className="board-canvas-wrapper">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{ cursor: phase === 'PLAYER_TURN' && boardStatus[viewedFace] === null ? 'pointer' : 'default' }}
          />

          {/* Game Over Overlay */}
          {boardStatus[viewedFace] !== null && (
            <div className="game-over-overlay">
              <h3>Game Over</h3>
              <p>{gameOverMessage}</p>
            </div>
          )}

          {/* Promotion Dialog */}
          {promotionPending && (
            <div className="promotion-dialog">
              {promotionPieces.map(({ piece, symbol }) => (
                <button
                  key={piece}
                  className="promotion-piece"
                  onClick={() => promoteAndMove(piece)}
                >
                  {symbol}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="board-panel-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="turn-indicator">
              <span className={`turn-dot ${turn === 'w' ? 'white' : 'black'}`} />
              <span>
                {gameMode === 'local'
                  ? (turn === 'w' ? 'Player 1 (White)' : 'Player 2 (Black)')
                  : (turn === 'w' ? 'White' : 'Black')
                } to move
              </span>
            </div>
            <span>Move {Math.ceil(history.length / 2) || 1}</span>
          </div>
          
          {phase !== 'GAME_OVER' && boardStatus[viewedFace] === null && gameMode?.startsWith('online') && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setGameOverMsg('Draw accepted!')}
                style={{ background: '#333', color: 'white', border: '1px solid #555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                Propose Draw
              </button>
              <button 
                onClick={() => handleResign(true)}
                style={{ background: '#ff4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                Resign
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
