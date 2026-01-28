// ========== ゲームロジック ==========
import { tileSize, POWER_MODE_DURATION } from './constants.js';
import { gameState, saveHighScore, resetGameState, advanceLevel } from './gameState.js';
import { playDeathSound, playGameOverSound, playLevelClearSound, playBGM, stopBGM } from './audio.js';
import { updateFruit, checkFruitCollision } from './fruit.js';

// パワーモード更新
export function updatePowerMode(enemies) {
  if (gameState.isPowerMode) {
    gameState.powerModeTimer--;
    if (gameState.powerModeTimer <= 0) {
      gameState.isPowerMode = false;
      enemies.forEach(enemy => enemy.setScared(false));
    }
  }
}

// パワーモード有効化
export function activatePowerMode(enemies) {
  gameState.isPowerMode = true;
  gameState.powerModeTimer = POWER_MODE_DURATION;
  enemies.forEach(enemy => enemy.setScared(true));
}

// 衝突判定
export function checkCollision(player, enemies) {
  enemies.forEach(enemy => {
    if (enemy.isDead) return;

    const dx = Math.abs(player.pixelX - enemy.pixelX);
    const dy = Math.abs(player.pixelY - enemy.pixelY);
    const collisionDistance = tileSize / 2;

    if (dx < collisionDistance && dy < collisionDistance) {
      if (gameState.isPowerMode && enemy.isScared) {
        enemy.die(player);
      } else {
        loseLife(player, enemies);
      }
    }
  });
}

// ライフを失う
export function loseLife(player, enemies) {
  gameState.lives--;
  stopBGM();

  if (gameState.lives <= 0) {
    gameOver(player);
  } else {
    playDeathSound();
    player.resetPosition();
    enemies.forEach(enemy => enemy.reset());
    gameState.isPowerMode = false;
    gameState.powerModeTimer = 0;
    enemies.forEach(enemy => enemy.setScared(false));

    setTimeout(() => {
      if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
        playBGM();
      }
    }, 600);
  }
}

// ゲームオーバー
export function gameOver(player) {
  gameState.isGameOver = true;
  gameState.overlayTimer = 0;
  saveHighScore(player.score);
  stopBGM();
  playGameOverSound();
}

// ゲームリスタート
export function restartGame(player, enemies) {
  resetGameState();
  player.reset();
  enemies.forEach(enemy => {
    enemy.reset();
    enemy.setScared(false);
  });
  playBGM();
}

// クリア判定
export function checkWin(player) {
  const map = gameState.map;
  let foodCount = 0;

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] === 0 || map[row][col] === 3) {
        foodCount++;
      }
    }
  }

  if (foodCount === 0) {
    gameState.isLevelClear = true;
    gameState.overlayTimer = 0;
    saveHighScore(player.score);
    stopBGM();
    playLevelClearSound();
  }
}

// 次のレベルへ
export function proceedToNextLevel(player, enemies) {
  advanceLevel();
  player.resetPosition();
  enemies.forEach(enemy => {
    enemy.reset();
    enemy.setScared(false);
  });
  playBGM();
}

// ゲーム更新
export function updateGameLogic(player, enemies) {
  player.updatePixelPosition();
  enemies.forEach(enemy => enemy.updatePixelPosition());

  player.updateMouth();
  updatePowerMode(enemies);
  updateFruit();

  if (!player.isMoving) {
    player.eat();
    player.move();
    checkFruitCollision(player);
  }

  enemies.forEach(enemy => {
    if (!enemy.isMoving) {
      enemy.move(player);
    }
  });

  // パワーモード時に敵をscared状態に
  if (gameState.isPowerMode) {
    enemies.forEach(enemy => {
      if (!enemy.isDead) {
        enemy.setScared(true);
      }
    });
  }

  checkCollision(player, enemies);
  checkWin(player);
}
