// ========== マップ描画 ==========
import { tileSize } from './constants.js';
import { gameState } from './gameState.js';

// 壁の描画（立体感あり）
function drawWall(ctx, x, y, row, col) {
  const map = gameState.map;
  const colors = [
    { main: "#2121de", dark: "#0000aa", light: "#5555ff" },
    { main: "#de21de", dark: "#aa00aa", light: "#ff55ff" },
    { main: "#21dede", dark: "#00aaaa", light: "#55ffff" },
  ];
  const colorIndex = (gameState.level - 1) % colors.length;
  const color = colors[colorIndex];

  const hasTop = row > 0 && (map[row - 1][col] === 1 || map[row - 1][col] === 4);
  const hasBottom = row < map.length - 1 && (map[row + 1][col] === 1 || map[row + 1][col] === 4);
  const hasLeft = col > 0 && (map[row][col - 1] === 1 || map[row][col - 1] === 4);
  const hasRight = col < map[0].length - 1 && (map[row][col + 1] === 1 || map[row][col + 1] === 4);

  const padding = 2;
  const radius = 4;

  ctx.fillStyle = color.main;

  const wx = x + padding;
  const wy = y + padding;
  const ww = tileSize - padding * 2;
  const wh = tileSize - padding * 2;

  ctx.beginPath();

  const tlRadius = (!hasTop && !hasLeft) ? radius : 0;
  const trRadius = (!hasTop && !hasRight) ? radius : 0;
  const brRadius = (!hasBottom && !hasRight) ? radius : 0;
  const blRadius = (!hasBottom && !hasLeft) ? radius : 0;

  ctx.moveTo(wx + tlRadius, wy);
  ctx.lineTo(wx + ww - trRadius, wy);
  if (trRadius) ctx.arcTo(wx + ww, wy, wx + ww, wy + trRadius, trRadius);
  ctx.lineTo(wx + ww, wy + wh - brRadius);
  if (brRadius) ctx.arcTo(wx + ww, wy + wh, wx + ww - brRadius, wy + wh, brRadius);
  ctx.lineTo(wx + blRadius, wy + wh);
  if (blRadius) ctx.arcTo(wx, wy + wh, wx, wy + wh - blRadius, blRadius);
  ctx.lineTo(wx, wy + tlRadius);
  if (tlRadius) ctx.arcTo(wx, wy, wx + tlRadius, wy, tlRadius);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = color.light;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (!hasTop) {
    ctx.moveTo(wx + tlRadius, wy + 1);
    ctx.lineTo(wx + ww - trRadius, wy + 1);
  }
  if (!hasLeft) {
    ctx.moveTo(wx + 1, wy + tlRadius);
    ctx.lineTo(wx + 1, wy + wh - blRadius);
  }
  ctx.stroke();

  ctx.strokeStyle = color.dark;
  ctx.beginPath();
  if (!hasBottom) {
    ctx.moveTo(wx + blRadius, wy + wh - 1);
    ctx.lineTo(wx + ww - brRadius, wy + wh - 1);
  }
  if (!hasRight) {
    ctx.moveTo(wx + ww - 1, wy + trRadius);
    ctx.lineTo(wx + ww - 1, wy + wh - brRadius);
  }
  ctx.stroke();
}

function drawGhostHouse(ctx, x, y) {
  ctx.fillStyle = "#111";
  ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
}

export function drawMap(ctx) {
  const map = gameState.map;

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const x = col * tileSize;
      const y = row * tileSize;

      if (map[row][col] === 1) {
        drawWall(ctx, x, y, row, col);
      } else if (map[row][col] === 4) {
        drawGhostHouse(ctx, x, y);
      } else if (map[row][col] === 0) {
        ctx.fillStyle = "#ffb8ae";
        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (map[row][col] === 3) {
        ctx.fillStyle = gameState.frameCount % 20 < 10 ? "#ffb8ae" : "#ffffff";
        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
