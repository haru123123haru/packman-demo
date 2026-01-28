// ========== 敵クラス ==========
import { Character } from './Character.js';
import { tileSize } from './constants.js';
import { gameState } from './gameState.js';
import { playKillEnemySound } from './audio.js';

export class Enemy extends Character {
  constructor(x, y, color, name) {
    super(x, y, color);
    this.originalColor = color;
    this.name = name;
    this.moveTimer = 0;
    this.isScared = false;
    this.isDead = false;
    this.deadTimer = 0;
  }

  draw(ctx, player) {
    if (this.isDead) {
      this.drawEyesOnly(ctx);
      return;
    }

    const centerX = this.pixelX + tileSize / 2;
    const topY = this.pixelY + 4;
    const radius = tileSize / 2 - 4;
    const bottomY = this.pixelY + tileSize - 4;

    if (this.isScared) {
      if (gameState.powerModeTimer < 60 && gameState.frameCount % 10 < 5) {
        ctx.fillStyle = "white";
      } else {
        ctx.fillStyle = "#2121de";
      }
    } else {
      ctx.fillStyle = this.color;
    }

    ctx.beginPath();
    ctx.arc(centerX, topY + radius, radius, Math.PI, 0, false);
    ctx.lineTo(centerX + radius, bottomY);

    const waveCount = 4;
    const waveWidth = (radius * 2) / waveCount;
    const waveHeight = 5;

    for (let i = 0; i < waveCount; i++) {
      const startX = centerX + radius - i * waveWidth;
      const endX = startX - waveWidth;
      const midX = (startX + endX) / 2;
      ctx.lineTo(midX, bottomY - waveHeight);
      ctx.lineTo(endX, bottomY);
    }

    ctx.lineTo(centerX - radius, topY + radius);
    ctx.closePath();
    ctx.fill();

    if (this.isScared) {
      this.drawScaredFace(ctx, centerX, topY + radius);
    } else {
      this.drawNormalEyes(ctx, centerX, topY + radius, player);
    }
  }

  drawNormalEyes(ctx, centerX, eyeY, player) {
    const eyeRadius = 4;
    const eyeOffsetX = 5;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(centerX - eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    const pupilRadius = 2;
    let pupilOffsetX = 0;
    let pupilOffsetY = 0;

    if (player) {
      const dx = player.pixelX - this.pixelX;
      const dy = player.pixelY - this.pixelY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        pupilOffsetX = (dx / dist) * 2;
        pupilOffsetY = (dy / dist) * 2;
      }
    }

    ctx.fillStyle = "#2121de";
    ctx.beginPath();
    ctx.arc(centerX - eyeOffsetX + pupilOffsetX, eyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffsetX + pupilOffsetX, eyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawScaredFace(ctx, centerX, eyeY) {
    ctx.fillStyle = "#ffb8ae";
    ctx.beginPath();
    ctx.arc(centerX - 5, eyeY, 2, 0, Math.PI * 2);
    ctx.arc(centerX + 5, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffb8ae";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 6, eyeY + 8);
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(centerX - 6 + i * 3 + 1.5, eyeY + (i % 2 === 0 ? 10 : 6));
    }
    ctx.stroke();
  }

  drawEyesOnly(ctx) {
    const centerX = this.pixelX + tileSize / 2;
    const eyeY = this.pixelY + tileSize / 2;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(centerX - 5, eyeY, 4, 0, Math.PI * 2);
    ctx.arc(centerX + 5, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2121de";
    ctx.beginPath();
    ctx.arc(centerX - 5, eyeY, 2, 0, Math.PI * 2);
    ctx.arc(centerX + 5, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  move(player) {
    if (this.isMoving) return;

    if (this.isDead) {
      this.deadTimer++;
      if (this.deadTimer > 120) {
        this.respawn();
      }
      return;
    }

    this.moveTimer++;
    const moveFrequency = this.isScared ? 3 : 2;
    if (this.moveTimer < moveFrequency) return;
    this.moveTimer = 0;

    const map = gameState.map;
    const dirs = ["up", "down", "left", "right"];

    let validDirs = dirs.filter((dir) => {
      let nextX = this.tileX;
      let nextY = this.tileY;
      if (dir === "up") nextY -= 1;
      if (dir === "down") nextY += 1;
      if (dir === "left") nextX -= 1;
      if (dir === "right") nextX += 1;

      if (nextX < 0) nextX = map[0].length - 1;
      if (nextX >= map[0].length) nextX = 0;

      return map[nextY] && map[nextY][nextX] !== 1 && map[nextY][nextX] !== 4;
    });

    if (validDirs.length === 0) return;

    let bestDir = this.direction || validDirs[0];

    if (this.isScared) {
      let maxDistance = -1;
      for (let dir of validDirs) {
        let testX = this.tileX;
        let testY = this.tileY;
        if (dir === "up") testY -= 1;
        if (dir === "down") testY += 1;
        if (dir === "left") testX -= 1;
        if (dir === "right") testX += 1;

        let distance = Math.abs(player.tileX - testX) + Math.abs(player.tileY - testY);
        if (distance > maxDistance) {
          maxDistance = distance;
          bestDir = dir;
        }
      }
    } else {
      let targetX = player.tileX;
      let targetY = player.tileY;

      switch (this.name) {
        case "Blinky":
          targetX = player.tileX;
          targetY = player.tileY;
          break;

        case "Pinky":
          const ahead = 4;
          switch (player.direction) {
            case "up": targetY = player.tileY - ahead; break;
            case "down": targetY = player.tileY + ahead; break;
            case "left": targetX = player.tileX - ahead; break;
            case "right": targetX = player.tileX + ahead; break;
          }
          break;

        case "Inky":
          if (Math.random() < 0.3) {
            bestDir = validDirs[Math.floor(Math.random() * validDirs.length)];
            targetX = -1;
          } else {
            const inkyAhead = 2;
            switch (player.direction) {
              case "up": targetY = player.tileY - inkyAhead; break;
              case "down": targetY = player.tileY + inkyAhead; break;
              case "left": targetX = player.tileX - inkyAhead; break;
              case "right": targetX = player.tileX + inkyAhead; break;
            }
          }
          break;

        case "Clyde":
          const distToPlayer = Math.abs(player.tileX - this.tileX) + Math.abs(player.tileY - this.tileY);
          if (distToPlayer < 8) {
            targetX = 1;
            targetY = map.length - 2;
          } else {
            targetX = player.tileX;
            targetY = player.tileY;
          }
          break;

        default:
          targetX = player.tileX;
          targetY = player.tileY;
      }

      if (targetX >= 0) {
        let minDistance = Infinity;
        for (let dir of validDirs) {
          let testX = this.tileX;
          let testY = this.tileY;
          if (dir === "up") testY -= 1;
          if (dir === "down") testY += 1;
          if (dir === "left") testX -= 1;
          if (dir === "right") testX += 1;

          let distance = Math.abs(targetX - testX) + Math.abs(targetY - testY);
          if (distance < minDistance) {
            minDistance = distance;
            bestDir = dir;
          }
        }
      }
    }

    this.direction = bestDir;

    let nextX = this.tileX;
    let nextY = this.tileY;
    if (this.direction === "up") nextY -= 1;
    if (this.direction === "down") nextY += 1;
    if (this.direction === "left") nextX -= 1;
    if (this.direction === "right") nextX += 1;

    if (nextX < 0) nextX = map[0].length - 1;
    if (nextX >= map[0].length) nextX = 0;

    if (map[nextY] && map[nextY][nextX] !== 1 && map[nextY][nextX] !== 4) {
      // ワープトンネル検出
      const isWarpingLeft = this.tileX === 0 && nextX === map[0].length - 1;
      const isWarpingRight = this.tileX === map[0].length - 1 && nextX === 0;

      this.tileX = nextX;
      this.tileY = nextY;
      this.targetPixelX = this.tileX * tileSize;
      this.targetPixelY = this.tileY * tileSize;

      if (isWarpingLeft || isWarpingRight) {
        this.pixelX = this.targetPixelX;
      }

      this.isMoving = true;
    }
  }

  setScared(scared) {
    this.isScared = scared;
  }

  die(player) {
    this.isDead = true;
    this.deadTimer = 0;
    player.score += 200;
    playKillEnemySound();
  }

  respawn() {
    this.isDead = false;
    this.deadTimer = 0;
    this.reset();
  }
}
