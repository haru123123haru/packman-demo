// ========== パックマンクラス ==========
import { Character } from './Character.js';
import { tileSize, POWER_MODE_DURATION, FRUIT_APPEAR_DOTS } from './constants.js';
import { gameState } from './gameState.js';
import { playEatSound, playPowerEatSound } from './audio.js';
import { spawnFruit } from './fruit.js';

export class Packman extends Character {
  constructor(x, y) {
    super(x, y, "yellow");
    this.score = 0;
    this.mouthOpen = true;
    this.mouthAngle = 0.25;
  }

  draw(ctx) {
    const centerX = this.pixelX + tileSize / 2;
    const centerY = this.pixelY + tileSize / 2;
    const radius = tileSize / 2 - 4;

    const mouthSize = this.mouthOpen ? this.mouthAngle : 0.05;

    let rotation = 0;
    switch (this.direction) {
      case "right": rotation = 0; break;
      case "down": rotation = Math.PI / 2; break;
      case "left": rotation = Math.PI; break;
      case "up": rotation = -Math.PI / 2; break;
    }

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, rotation + mouthSize * Math.PI, rotation - mouthSize * Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  updateMouth() {
    if (gameState.frameCount % 6 === 0) {
      this.mouthOpen = !this.mouthOpen;
    }
  }

  eat() {
    const map = gameState.map;
    const tile = map[this.tileY][this.tileX];

    if (tile === 0) {
      map[this.tileY][this.tileX] = 2;
      this.score += 10;
      playEatSound();
      gameState.dotsEaten++;

      if (gameState.dotsEaten === FRUIT_APPEAR_DOTS ||
          gameState.dotsEaten === FRUIT_APPEAR_DOTS * 2) {
        if (!gameState.fruit) spawnFruit();
      }
    } else if (tile === 3) {
      map[this.tileY][this.tileX] = 2;
      this.score += 50;
      playPowerEatSound();
      this.activatePowerMode();
    }
  }

  activatePowerMode() {
    gameState.isPowerMode = true;
    gameState.powerModeTimer = POWER_MODE_DURATION;
  }

  move() {
    if (this.isMoving) return;

    const map = gameState.map;

    if (this.nextDirection) {
      let nextX = this.tileX;
      let nextY = this.tileY;

      if (this.nextDirection === "up") nextY -= 1;
      if (this.nextDirection === "down") nextY += 1;
      if (this.nextDirection === "left") nextX -= 1;
      if (this.nextDirection === "right") nextX += 1;

      if (nextX < 0) nextX = map[0].length - 1;
      if (nextX >= map[0].length) nextX = 0;

      if (map[nextY] && map[nextY][nextX] !== 1 && map[nextY][nextX] !== 4) {
        this.direction = this.nextDirection;
        this.nextDirection = null;
      }
    }

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

  setDirection(newDirection) {
    this.nextDirection = newDirection;
    if (!this.isMoving) {
      this.direction = newDirection;
    }
  }

  reset() {
    super.reset();
    this.score = 0;
  }

  resetPosition() {
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
}
