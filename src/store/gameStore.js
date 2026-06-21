import { create } from 'zustand';
import { Chess } from 'chess.js';
import { peerManager } from '../utils/peerManager';

/**
 * Game phases:
 * MENU         — choosing game mode
 * READY        — waiting for user to click roll
 * ROLLING      — die animation is playing
 * PLAYER_TURN  — current player can interact with the top-face board
 * BOT_TURN     — bot is computing and playing (only in vs Bot mode)
 */

/**
 * Game modes:
 * 'bot'    — Player (White) vs Bot (Black)
 * 'local'  — Player 1 (White) vs Player 2 (Black) on same device
 */

function createInitialGames() {
  return Array.from({ length: 6 }, () => new Chess().fen());
}

const useGameStore = create((set, get) => ({
  phase: 'MENU',
  gameMode: null, // 'bot' | 'local' | 'online_host' | 'online_join'
  games: createInitialGames(),
  topFace: null,
  viewedFace: null, // for viewing other boards without playing
  viewMoveIndex: Array.from({ length: 6 }, () => -1), // -1 means viewing current state, else viewing history
  selectedSquare: null,
  legalMoves: [],
  moveHistory: Array.from({ length: 6 }, () => []),
  boardStatus: Array.from({ length: 6 }, () => null),
  rollCount: 0,
  rollTargetFace: null,
  promotionPending: null, // { from, to } when promotion is needed
  currentPlayer: 'w', // tracked for local mode display ('w' or 'b')
  myColor: 'w', // only relevant for online
  roomId: null,
  peerError: null,
  gameOverMsg: null,

  setPhase: (phase) => set({ phase }),

  startGame: (mode, roomId = null, myColor = 'w') => {
    set({
      gameMode: mode,
      phase: mode === 'online_join' ? 'CONNECTING' : (mode === 'online_host' ? 'WAITING_FOR_OPPONENT' : 'READY'),
      games: createInitialGames(),
      topFace: null,
      viewedFace: null,
      viewMoveIndex: Array.from({ length: 6 }, () => -1),
      selectedSquare: null,
      legalMoves: [],
      moveHistory: Array.from({ length: 6 }, () => []),
      boardStatus: Array.from({ length: 6 }, () => null),
      rollCount: 0,
      rollTargetFace: null,
      promotionPending: null,
      currentPlayer: 'w',
      myColor,
      roomId,
      gameOverMsg: null,
    });
  },

  backToMenu: () => {
    set({
      phase: 'MENU',
      gameMode: null,
      games: createInitialGames(),
      topFace: null,
      viewedFace: null,
      viewMoveIndex: Array.from({ length: 6 }, () => -1),
      selectedSquare: null,
      legalMoves: [],
      moveHistory: Array.from({ length: 6 }, () => []),
      boardStatus: Array.from({ length: 6 }, () => null),
      rollCount: 0,
      rollTargetFace: null,
      promotionPending: null,
      currentPlayer: 'w',
      roomId: null,
      peerError: null,
      gameOverMsg: null,
    });
  },

  rollDie: (face) => {
    set({ phase: 'ROLLING', topFace: null, viewedFace: null, selectedSquare: null, legalMoves: [], promotionPending: null, rollTargetFace: face });
    set((s) => ({ rollCount: s.rollCount + 1 }));
  },

  syncState: (data) => {
    set({
      games: data.games,
      moveHistory: data.moveHistory,
      boardStatus: data.boardStatus,
      topFace: data.topFace,
      viewedFace: data.topFace,
      rollTargetFace: data.rollTargetFace,
      rollCount: data.rollCount,
    });
    // Re-evaluate whose turn it is
    get().setTopFace(data.topFace);
  },

  setViewedFace: (faceIndex) => {
    set({ viewedFace: faceIndex, selectedSquare: null, legalMoves: [] });
  },

  navigateHistory: (direction) => {
    const state = get();
    if (state.viewedFace === null) return;
    const face = state.viewedFace;
    const historyLen = state.moveHistory[face].length;
    let newIndex = state.viewMoveIndex[face];
    
    if (direction === -1) {
      if (newIndex === -1) newIndex = historyLen - 1; // Start viewing previous
      else if (newIndex > 0) newIndex -= 1;
    } else if (direction === 1) {
      if (newIndex !== -1 && newIndex < historyLen - 1) newIndex += 1;
      else if (newIndex === historyLen - 1) newIndex = -1; // Back to current
    }

    const newIndices = [...state.viewMoveIndex];
    newIndices[face] = newIndex;
    set({ viewMoveIndex: newIndices });
  },

  updateBoardStatuses: (newGames) => {
    const state = get();
    const newStatuses = [...state.boardStatus];
    let finishedCount = 0;
    let whiteWins = 0;
    let blackWins = 0;

    for (let i = 0; i < 6; i++) {
      if (newStatuses[i] === null) {
        const chess = new Chess(newGames[i]);
        if (chess.isCheckmate()) {
          newStatuses[i] = chess.turn() === 'w' ? 'b' : 'w';
        } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
          newStatuses[i] = 'draw';
        }
      }
      
      if (newStatuses[i] !== null) {
        finishedCount++;
        if (newStatuses[i] === 'w') whiteWins++;
        if (newStatuses[i] === 'b') blackWins++;
      }
    }

    set({ boardStatus: newStatuses });

    if (finishedCount === 6) {
      if (whiteWins > blackWins) return `White wins ${whiteWins}-${blackWins}!`;
      if (blackWins > whiteWins) return `Black wins ${blackWins}-${whiteWins}!`;
      return `It's a draw! (${whiteWins}-${blackWins})`;
    }

    return null;
  },

  setTopFace: (faceIndex) => {
    const state = get();
    const chess = new Chess(state.games[faceIndex]);

    const overMsg = get().updateBoardStatuses(state.games);
    if (overMsg) {
      set({ topFace: faceIndex, viewedFace: faceIndex, phase: 'GAME_OVER', gameOverMsg: overMsg });
      return;
    }

    if (chess.isGameOver()) {
      // Should not be possible since we only roll unfinished faces, but just in case
      set({ topFace: faceIndex, viewedFace: faceIndex, phase: 'PLAYER_TURN' });
      return;
    }

    const turn = chess.turn(); 
    set({ currentPlayer: turn });

    if (state.gameMode === 'online_host' || state.gameMode === 'online_join') {
      if (turn === state.myColor) {
        set({ topFace: faceIndex, viewedFace: faceIndex, phase: 'PLAYER_TURN' });
      } else {
        set({ topFace: faceIndex, viewedFace: faceIndex, phase: 'OPPONENT_TURN' });
      }
    } else {
      set({ topFace: faceIndex, viewedFace: faceIndex, phase: 'PLAYER_TURN' });
    }
  },

  selectSquare: (square) => {
    const state = get();
    if (state.phase !== 'PLAYER_TURN' || state.viewedFace !== state.topFace || state.topFace === null) return;
    if (state.viewMoveIndex[state.topFace] !== -1) return; // Cannot play while viewing history

    const chess = new Chess(state.games[state.topFace]);
    const turn = chess.turn();

    if ((state.gameMode === 'online_host' || state.gameMode === 'online_join') && turn !== state.myColor) return;

    const currentSelected = state.selectedSquare;

    if (currentSelected) {
      // If clicking a legal move target, attempt the move
      const targetMove = state.legalMoves.find((m) => m.to === square);
      if (targetMove) {
        // Check if it's a promotion move
        if (targetMove.promotion) {
          set({ promotionPending: { from: currentSelected, to: square } });
          return;
        }
        get().makePlayerMove({ from: currentSelected, to: square });
        return;
      }
    }

    // Select a new piece (must be the current turn's color)
    const piece = chess.get(square);
    if (piece && piece.color === turn) {
      const moves = chess.moves({ square, verbose: true });
      set({ selectedSquare: square, legalMoves: moves });
    } else {
      set({ selectedSquare: null, legalMoves: [] });
    }
  },

  makePlayerMove: (move) => {
    const state = get();
    if (state.topFace === null) return;

    const chess = new Chess(state.games[state.topFace]);
    const result = chess.move(move);
    if (!result) return;

    const newGames = [...state.games];
    newGames[state.topFace] = chess.fen();

    const newHistory = [...state.moveHistory];
    newHistory[state.topFace] = [...newHistory[state.topFace], result.san];

    const overMsg = get().updateBoardStatuses(newGames);
    const updatedState = get(); // Refresh state after updateBoardStatuses

    if (overMsg) {
      set({
        games: newGames,
        moveHistory: newHistory,
        selectedSquare: null,
        legalMoves: [],
        promotionPending: null,
        phase: 'GAME_OVER',
        gameOverMsg: overMsg
      });
      // Online sync
      if (state.gameMode.startsWith('online')) {
        peerManager.send({ type: 'MOVE_AND_END', face: state.topFace, move });
      }
      return;
    }

    const availableFaces = [];
    updatedState.boardStatus.forEach((status, idx) => {
      if (status === null) availableFaces.push(idx);
    });
    
    // We assume availableFaces.length > 0 because overMsg was null
    const nextFace = availableFaces[Math.floor(Math.random() * availableFaces.length)];

    if (state.gameMode.startsWith('online')) {
      // Send move and next roll face to peer
      peerManager.send({ type: 'MOVE_AND_ROLL', face: state.topFace, move, nextFace });
      
      set({
        games: newGames,
        moveHistory: newHistory,
        selectedSquare: null,
        legalMoves: [],
        promotionPending: null,
        phase: 'ROLLING',
        rollTargetFace: nextFace,
        rollCount: state.rollCount + 1
      });
    } else {
      set({
        games: newGames,
        moveHistory: newHistory,
        selectedSquare: null,
        legalMoves: [],
        promotionPending: null,
        phase: 'ROLLING',
        rollTargetFace: nextFace,
        rollCount: state.rollCount + 1
      });
    }
  },

  promoteAndMove: (promotionPiece) => {
    const state = get();
    if (!state.promotionPending) return;
    get().makePlayerMove({
      from: state.promotionPending.from,
      to: state.promotionPending.to,
      promotion: promotionPiece,
    });
  },

  cancelPromotion: () => {
    set({ promotionPending: null, selectedSquare: null, legalMoves: [] });
  },

  applyOpponentMove: (face, move, nextFace) => {
    const state = get();
    const chess = new Chess(state.games[face]);
    const result = chess.move(move);
    if (!result) return;

    const newGames = [...state.games];
    newGames[face] = chess.fen();

    const newHistory = [...state.moveHistory];
    newHistory[face] = [...newHistory[face], result.san];

    const overMsg = get().updateBoardStatuses(newGames);

    if (overMsg) {
      set({
        games: newGames,
        moveHistory: newHistory,
        topFace: face,
        viewedFace: face,
        phase: 'GAME_OVER',
        gameOverMsg: overMsg
      });
      return;
    }

    set({
      games: newGames,
      moveHistory: newHistory,
      topFace: face,
      viewedFace: face,
      phase: 'ROLLING',
      rollTargetFace: nextFace,
      rollCount: state.rollCount + 1
    });
  },

  handleResign: (byMe) => {
    const state = get();
    if (byMe && state.gameMode.startsWith('online')) {
      peerManager.send({ type: 'RESIGN' });
    }
    const winner = byMe ? (state.myColor === 'w' ? 'Black' : 'White') : state.myColor;
    set({ phase: 'GAME_OVER', gameOverMsg: `${winner} wins by Resignation!` });
  },

  setGameOverMsg: (msg) => set({ phase: 'GAME_OVER', gameOverMsg: msg }),

}));

export default useGameStore;
