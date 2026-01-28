// ========== メインエントリーポイント ==========
import { gameState, initMap } from './gameState.js';
import { Packman } from './Packman.js';
import { Enemy } from './Enemy.js';
import { InputHandler } from './InputHandler.js';
import { drawMap } from './map.js';
import { drawFruit } from './fruit.js';
import { drawUI, drawStartScreen, drawPauseScreen, drawGameOverScreen, drawLevelClearScreen } from './ui.js';
import { updateGameLogic, restartGame, proceedToNextLevel } from './game.js';

// Canvas設定
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// キャラクター初期化
const player = new Packman(1, 1);
const enemies = [
  new Enemy(9, 10, "#ff0000", "Blinky"),
  new Enemy(10, 10, "#ffb8ff", "Pinky"),
  new Enemy(9, 9, "#00ffff", "Inky"),
  new Enemy(10, 9, "#ffb852", "Clyde"),
];

// マップ初期化
initMap();

// 入力ハンドラー初期化
const inputHandler = new InputHandler(
  canvas,
  player,
  () => restartGame(player, enemies),
  () => proceedToNextLevel(player, enemies)
);

// 描画更新
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "left";

  drawMap(ctx);
  drawFruit(ctx);
  player.draw(ctx);
  enemies.forEach(enemy => enemy.draw(ctx, player));

  drawUI(ctx, canvas, player);

  if (!gameState.isGameStarted) {
    drawStartScreen(ctx, canvas);
  } else if (gameState.isPaused) {
    drawPauseScreen(ctx, canvas);
  } else if (gameState.isGameOver) {
    drawGameOverScreen(ctx, canvas, player);
  } else if (gameState.isLevelClear) {
    drawLevelClearScreen(ctx, canvas, player);
  }
}

// ゲームループ
function gameTick() {
  gameState.frameCount++;

  if (!gameState.isGameStarted || gameState.isPaused ||
      gameState.isGameOver || gameState.isLevelClear) {
    if (gameState.isGameOver || gameState.isLevelClear) {
      gameState.overlayTimer++;
    }
    render();
    requestAnimationFrame(gameTick);
    return;
  }

  updateGameLogic(player, enemies);
  render();

  requestAnimationFrame(gameTick);
}

// ゲーム開始
requestAnimationFrame(gameTick);
