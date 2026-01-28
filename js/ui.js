// ========== UI描画 ==========
import { gameState } from './gameState.js';
import { isSoundEnabled } from './audio.js';

export function drawUI(ctx, canvas, player) {
  const uiY = canvas.height - 25;

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + player.score, 10, uiY);

  ctx.fillStyle = "#ffff00";
  ctx.fillText("HI: " + gameState.highScore, 150, uiY);

  ctx.fillStyle = "white";
  ctx.fillText("Lv: " + gameState.level, 280, uiY);

  ctx.fillStyle = "yellow";
  for (let i = 0; i < gameState.lives; i++) {
    ctx.beginPath();
    ctx.moveTo(360 + i * 30, uiY - 5);
    ctx.arc(360 + i * 30, uiY - 5, 10, 0.25 * Math.PI, -0.25 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  if (gameState.isPowerMode) {
    ctx.fillStyle = "#00ffff";
    ctx.fillText("POWER!", 470, uiY);
  }

  ctx.fillStyle = isSoundEnabled ? "#00ff00" : "#666";
  ctx.font = "14px Arial";
  ctx.fillText(isSoundEnabled ? "♪ON" : "♪OFF", 560, uiY);
}

export function drawStartScreen(ctx, canvas) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "yellow";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAC-MAN", canvas.width / 2, canvas.height / 2 - 100);

  const ghostColors = ["#ff0000", "#ffb8ff", "#00ffff", "#ffb852"];
  const ghostX = canvas.width / 2 - 60;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = ghostColors[i];
    ctx.beginPath();
    ctx.arc(ghostX + i * 40, canvas.height / 2 - 40, 12, Math.PI, 0, false);
    ctx.lineTo(ghostX + i * 40 + 12, canvas.height / 2 - 28);
    ctx.lineTo(ghostX + i * 40 + 6, canvas.height / 2 - 34);
    ctx.lineTo(ghostX + i * 40, canvas.height / 2 - 28);
    ctx.lineTo(ghostX + i * 40 - 6, canvas.height / 2 - 34);
    ctx.lineTo(ghostX + i * 40 - 12, canvas.height / 2 - 28);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#ffff00";
  ctx.font = "18px Arial";
  ctx.fillText("HIGH SCORE: " + gameState.highScore, canvas.width / 2, canvas.height / 2 + 10);

  ctx.fillStyle = "white";
  ctx.fillText("Level: " + gameState.level + "    Lives: " + gameState.lives, canvas.width / 2, canvas.height / 2 + 45);

  if (gameState.frameCount % 60 < 40) {
    ctx.font = "22px Arial";
    ctx.fillText("Press SPACE or TAP to Start", canvas.width / 2, canvas.height / 2 + 90);
  }

  ctx.font = "14px Arial";
  ctx.fillStyle = "#aaa";
  ctx.fillText("Arrow Keys / Swipe to Move", canvas.width / 2, canvas.height / 2 + 125);
  ctx.fillText("P: Pause  |  M: Sound ON/OFF", canvas.width / 2, canvas.height / 2 + 145);
}

export function drawPauseScreen(ctx, canvas) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = "20px Arial";
  ctx.fillText("Press P to Resume", canvas.width / 2, canvas.height / 2 + 30);
}

export function drawGameOverScreen(ctx, canvas, player) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff0000";
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + player.score, canvas.width / 2, canvas.height / 2);

  if (player.score >= gameState.highScore && player.score > 0) {
    ctx.fillStyle = "#ffff00";
    ctx.font = "20px Arial";
    ctx.fillText("NEW HIGH SCORE!", canvas.width / 2, canvas.height / 2 + 35);
  } else {
    ctx.fillStyle = "#aaa";
    ctx.font = "18px Arial";
    ctx.fillText("High Score: " + gameState.highScore, canvas.width / 2, canvas.height / 2 + 35);
  }

  if (gameState.overlayTimer > 60 && gameState.frameCount % 60 < 40) {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Press SPACE or TAP to Restart", canvas.width / 2, canvas.height / 2 + 90);
  }
}

export function drawLevelClearScreen(ctx, canvas, player) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ff00";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("LEVEL " + gameState.level + " CLEAR!", canvas.width / 2, canvas.height / 2 - 60);

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + player.score, canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = "#aaa";
  ctx.font = "18px Arial";
  ctx.fillText("High Score: " + gameState.highScore, canvas.width / 2, canvas.height / 2 + 35);

  if (gameState.overlayTimer > 60 && gameState.frameCount % 60 < 40) {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Press SPACE or TAP for Next Level", canvas.width / 2, canvas.height / 2 + 90);
  }
}
