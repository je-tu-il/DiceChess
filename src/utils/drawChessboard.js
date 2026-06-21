import { Chess } from 'chess.js';

/**
 * Unicode chess piece mapping (using solid shapes for opaque style)
 */
const PIECE_SYMBOLS = {
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

/**
 * Color scheme for the chessboard
 */
const COLORS = {
  lightSquare: '#e8dcc8',
  darkSquare: '#7b6b5a',
  lightSquareHL: '#c8b8ff',
  darkSquareHL: '#8b7bcc',
  selectedLight: '#ffb0c8',
  selectedDark: '#cc7090',
  legalDot: 'rgba(108, 99, 255, 0.45)',
  legalCapture: 'rgba(255, 107, 157, 0.55)',
  lastMoveLight: 'rgba(255, 255, 100, 0.3)',
  lastMoveDark: 'rgba(255, 255, 100, 0.2)',
  border: '#6c63ff',
  activeBorder: '#ff6b9d',
  labelText: '#a0a0b8',
  faceLabel: 'rgba(108, 99, 255, 0.9)',
  checkSquare: 'rgba(255, 60, 60, 0.6)',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/**
 * Draw a chessboard onto a 2D canvas context.
 */
export function drawChessboard(ctx, size, fen, faceIndex, options = {}) {
  const {
    isActive = false,
    selectedSquare = null,
    legalMoves = [],
    lastMoveFrom = null,
    lastMoveTo = null,
    isFlipped = false,
  } = options;

  const chess = new Chess(fen);
  const board = chess.board();
  const sqSize = size / 8;

  // Check state for highlighting
  let kingInCheckSquare = null;
  if (chess.isCheck()) {
    const turn = chess.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          kingInCheckSquare = FILES[c] + RANKS[r];
        }
      }
    }
  }

  // Set of legal target squares
  const legalTargets = new Set(legalMoves.map((m) => m.to));
  const legalCaptures = new Set(legalMoves.filter((m) => m.captured).map((m) => m.to));

  // Draw squares
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const drawRow = isFlipped ? 7 - row : row;
      const drawCol = isFlipped ? 7 - col : col;
      const x = drawCol * sqSize;
      const y = drawRow * sqSize;
      const isLight = (row + col) % 2 === 0;
      const square = FILES[col] + RANKS[row];

      // Base color
      let color = isLight ? COLORS.lightSquare : COLORS.darkSquare;

      // Last move highlight
      if (square === lastMoveFrom || square === lastMoveTo) {
        color = isLight ? COLORS.lastMoveLight : COLORS.lastMoveDark;
        // Blend with base
        ctx.fillStyle = isLight ? COLORS.lightSquare : COLORS.darkSquare;
        ctx.fillRect(x, y, sqSize, sqSize);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, sqSize, sqSize);
        continue; // We'll draw piece separately
      }

      // Selected square
      if (square === selectedSquare) {
        color = isLight ? COLORS.selectedLight : COLORS.selectedDark;
      }

      // Check highlight
      if (square === kingInCheckSquare) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, sqSize, sqSize);
        ctx.fillStyle = COLORS.checkSquare;
        ctx.fillRect(x, y, sqSize, sqSize);
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, sqSize, sqSize);
      }
    }
  }

  // Handle last move squares (need to redo because of `continue`)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const drawRow = isFlipped ? 7 - row : row;
      const drawCol = isFlipped ? 7 - col : col;
      const square = FILES[col] + RANKS[row];
      const x = drawCol * sqSize;
      const y = drawRow * sqSize;
      const isLight = (row + col) % 2 === 0;

      if (square === lastMoveFrom || square === lastMoveTo) {
        ctx.fillStyle = isLight ? COLORS.lightSquare : COLORS.darkSquare;
        ctx.fillRect(x, y, sqSize, sqSize);
        ctx.fillStyle = isLight ? COLORS.lastMoveLight : COLORS.lastMoveDark;
        ctx.fillRect(x, y, sqSize, sqSize);

        if (square === kingInCheckSquare) {
          ctx.fillStyle = COLORS.checkSquare;
          ctx.fillRect(x, y, sqSize, sqSize);
        }
      }
    }
  }

  // Draw pieces
  const fontSize = Math.floor(sqSize * 0.75);
  ctx.font = `${fontSize}px "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const symbol = PIECE_SYMBOLS[piece.type];
        if (symbol) {
          const drawRow = isFlipped ? 7 - row : row;
          const drawCol = isFlipped ? 7 - col : col;
          const x = drawCol * sqSize + sqSize / 2;
          const y = drawRow * sqSize + sqSize / 2 + 2;

          // Piece fill
          ctx.fillStyle = piece.color === 'w' ? '#ffffff' : '#222222';
          ctx.fillText(symbol, x, y);

          // Outline
          ctx.strokeStyle = piece.color === 'w' ? '#000000' : '#ffffff';
          ctx.lineWidth = Math.max(1, fontSize * 0.04);
          ctx.strokeText(symbol, x, y);
        }
      }
    }
  }

  // Draw legal move indicators
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = FILES[col] + RANKS[row];
      const drawRow = isFlipped ? 7 - row : row;
      const drawCol = isFlipped ? 7 - col : col;
      const x = drawCol * sqSize + sqSize / 2;
      const y = drawRow * sqSize + sqSize / 2;

      if (legalTargets.has(square)) {
        if (legalCaptures.has(square)) {
          // Capture: ring around the square
          ctx.beginPath();
          ctx.arc(x, y, sqSize * 0.42, 0, Math.PI * 2);
          ctx.strokeStyle = COLORS.legalCapture;
          ctx.lineWidth = sqSize * 0.08;
          ctx.stroke();
        } else {
          // Non-capture: small dot
          ctx.beginPath();
          ctx.arc(x, y, sqSize * 0.16, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.legalDot;
          ctx.fill();
        }
      }
    }
  }

  // Face label in corner
  const labelSize = Math.floor(size * 0.06);
  ctx.font = `bold ${labelSize}px 'Inter', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const labelText = `#${faceIndex + 1}`;
  const labelPad = size * 0.02;

  // Label background
  const metrics = ctx.measureText(labelText);
  const lbw = metrics.width + labelPad * 2;
  const lbh = labelSize + labelPad * 1.5;

  ctx.fillStyle = isActive ? COLORS.activeBorder : 'rgba(20, 20, 35, 0.7)';
  ctx.beginPath();
  ctx.roundRect(labelPad, labelPad, lbw, lbh, 4);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(labelText, labelPad * 2, labelPad * 1.3);

  // Active border glow
  if (isActive) {
    ctx.strokeStyle = COLORS.activeBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    // Inner glow
    ctx.strokeStyle = 'rgba(255, 107, 157, 0.3)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, size - 8, size - 8);
  }
}

/**
 * Draw a mini-chessboard for the die texture (simplified, no interaction highlights)
 */
export function drawDieChessboard(ctx, size, fen, faceIndex, isActive = false) {
  drawChessboard(ctx, size, fen, faceIndex, { isActive, isFlipped: false });
}

