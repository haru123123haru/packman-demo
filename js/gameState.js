// ========== ゲーム状態管理 ==========
import { mapTemplates } from './constants.js';

export const gameState = {
  map: [],
  isGameStarted: false,
  isPaused: false,
  isGameOver: false,
  isLevelClear: false,
  frameCount: 0,
  level: 1,
  lives: 3,
  baseSpeed: 3,
  moveSpeed: 3,
  isPowerMode: false,
  powerModeTimer: 0,
  overlayTimer: 0,
  dotsEaten: 0,
  fruit: null,
  highScore: parseInt(localStorage.getItem("pacmanHighScore") || "0"),
};

// マップを初期化
export function initMap() {
  const templateIndex = (gameState.level - 1) % mapTemplates.length;
  gameState.map = mapTemplates[templateIndex].map(row => [...row]);
}

// ハイスコア保存
export function saveHighScore(score) {
  if (score > gameState.highScore) {
    gameState.highScore = score;
    localStorage.setItem("pacmanHighScore", gameState.highScore);
  }
}

// ゲーム状態リセット
export function resetGameState() {
  gameState.isGameOver = false;
  gameState.isGameStarted = true;
  gameState.level = 1;
  gameState.lives = 3;
  gameState.moveSpeed = gameState.baseSpeed;
  gameState.isPowerMode = false;
  gameState.powerModeTimer = 0;
  gameState.dotsEaten = 0;
  gameState.fruit = null;
  initMap();
}

// 次のレベルへ
export function advanceLevel() {
  gameState.isLevelClear = false;
  gameState.level++;
  gameState.moveSpeed = gameState.baseSpeed + Math.floor(gameState.level / 2);
  gameState.isPowerMode = false;
  gameState.powerModeTimer = 0;
  gameState.dotsEaten = 0;
  gameState.fruit = null;
  initMap();
}
