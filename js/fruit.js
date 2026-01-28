// ========== フルーツボーナス ==========
import { tileSize, fruitTypes, FRUIT_DURATION } from './constants.js';
import { gameState } from './gameState.js';
import { playFruitSound } from './audio.js';

export function spawnFruit() {
  const fruitIndex = Math.min((gameState.level - 1), fruitTypes.length - 1);
  gameState.fruit = {
    ...fruitTypes[fruitIndex],
    x: 9,
    y: 14,
    timer: FRUIT_DURATION,
  };
}

export function updateFruit() {
  if (gameState.fruit) {
    gameState.fruit.timer--;
    if (gameState.fruit.timer <= 0) {
      gameState.fruit = null;
    }
  }
}

export function drawFruit(ctx) {
  const fruit = gameState.fruit;
  if (!fruit) return;

  const x = fruit.x * tileSize + tileSize / 2;
  const y = fruit.y * tileSize + tileSize / 2;
  const radius = 10;

  ctx.fillStyle = fruit.color;

  switch (fruit.shape) {
    case "cherry":
      ctx.beginPath();
      ctx.arc(x - 5, y + 3, 6, 0, Math.PI * 2);
      ctx.arc(x + 5, y + 3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#00aa00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 3);
      ctx.quadraticCurveTo(x, y - 12, x + 5, y - 3);
      ctx.stroke();
      break;

    case "strawberry":
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.quadraticCurveTo(x + 10, y, x, y + 10);
      ctx.quadraticCurveTo(x - 10, y, x, y - 8);
      ctx.fill();
      ctx.fillStyle = "#00aa00";
      ctx.fillRect(x - 4, y - 12, 8, 5);
      break;

    case "apple":
      ctx.beginPath();
      ctx.arc(x, y + 2, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(x - 1, y - 12, 3, 6);
      ctx.fillStyle = "#00aa00";
      ctx.beginPath();
      ctx.ellipse(x + 5, y - 8, 4, 2, 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "star":
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;

    default:
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
  }

  // 点滅効果
  if (fruit.timer < 120 && gameState.frameCount % 20 < 10) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function checkFruitCollision(player) {
  const fruit = gameState.fruit;
  if (!fruit) return;

  if (player.tileX === fruit.x && player.tileY === fruit.y) {
    player.score += fruit.points;
    playFruitSound();
    gameState.fruit = null;
  }
}
