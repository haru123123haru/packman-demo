// ========== キャラクター基底クラス ==========
import { tileSize } from './constants.js';
import { gameState } from './gameState.js';

export class Character {
  constructor(x, y, color) {
    this.startX = x;
    this.startY = y;
    this.tileX = x;
    this.tileY = y;
    this.pixelX = x * tileSize;
    this.pixelY = y * tileSize;
    this.targetPixelX = this.pixelX;
    this.targetPixelY = this.pixelY;
    this.color = color;
    this.direction = null;
    this.nextDirection = null;
    this.isMoving = false;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    const centerX = this.pixelX + tileSize / 2;
    const centerY = this.pixelY + tileSize / 2;
    ctx.arc(centerX, centerY, tileSize / 2 - 5, 0, Math.PI * 2);
    ctx.fill();
  }

  reset() {
    this.tileX = this.startX;
    this.tileY = this.startY;
    this.pixelX = this.startX * tileSize;
    this.pixelY = this.startY * tileSize;
    this.targetPixelX = this.pixelX;
    this.targetPixelY = this.pixelY;
    this.direction = null;
    this.nextDirection = null;
    this.isMoving = false;
  }

  updatePixelPosition() {
    const speed = gameState.moveSpeed;

    if (this.pixelX < this.targetPixelX) {
      this.pixelX = Math.min(this.pixelX + speed, this.targetPixelX);
    } else if (this.pixelX > this.targetPixelX) {
      this.pixelX = Math.max(this.pixelX - speed, this.targetPixelX);
    }

    if (this.pixelY < this.targetPixelY) {
      this.pixelY = Math.min(this.pixelY + speed, this.targetPixelY);
    } else if (this.pixelY > this.targetPixelY) {
      this.pixelY = Math.max(this.pixelY - speed, this.targetPixelY);
    }

    if (this.pixelX === this.targetPixelX && this.pixelY === this.targetPixelY) {
      this.isMoving = false;
    }
  }
}
