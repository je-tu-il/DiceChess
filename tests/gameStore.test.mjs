import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import game from '../src/store/gameStore.js';

beforeEach(() => game.getState().startGame('local'));

test('only the active side advances after a valid move', () => {
  game.getState().setTopFace(3);
  const initial = [...game.getState().games];
  game.getState().selectSquare('e2');
  game.getState().selectSquare('e4');
  assert.equal(game.getState().phase, 'ROLLING');
  assert.equal(game.getState().moveHistory[3][0], 'e4');
  assert.deepEqual(game.getState().games.filter((_, index) => index !== 3), initial.filter((_, index) => index !== 3));
});

test('rejected moves leave the board and history unchanged', () => {
  game.getState().setTopFace(0);
  const before = game.getState();
  game.getState().makePlayerMove({ from: 'e2', to: 'e6' });
  game.getState().applyOpponentMove(0, { from: 'e2', to: 'e6' }, 1);
  assert.equal(game.getState(), before);
});

test('viewing another board prevents a move on the active board', () => {
  game.getState().setTopFace(0);
  game.getState().setViewedFace(1);
  const before = game.getState();
  game.getState().makePlayerMove({ from: 'e2', to: 'e4' });
  assert.equal(game.getState(), before);
});

test('resignation displays the full name of the winning color', () => {
  game.getState().startGame('online_join', 'demo', 'b');
  game.getState().handleResign(false);
  assert.equal(game.getState().phase, 'GAME_OVER');
  assert.equal(game.getState().gameOverMsg, 'Black wins by Resignation!');
});
