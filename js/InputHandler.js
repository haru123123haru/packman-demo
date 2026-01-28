// ========== 入力ハンドラー ==========
import { gameState } from './gameState.js';
import { initAudio, playBGM, stopBGM, toggleSound } from './audio.js';

export class InputHandler {
  constructor(canvas, player, onRestart, onNextLevel) {
    this.player = player;
    this.onRestart = onRestart;
    this.onNextLevel = onNextLevel;

    // キーボード入力
    window.addEventListener("keydown", (e) => this.handleKeyDown(e));

    // タッチ操作
    this.setupTouchControls(canvas);
  }

  handleKeyDown(e) {
    // ゲームオーバー/クリア画面でスペースを押したらリスタート
    if (gameState.isGameOver || gameState.isLevelClear) {
      if (e.key === " ") {
        initAudio();
        if (gameState.isGameOver) {
          this.onRestart();
        } else if (gameState.isLevelClear) {
          this.onNextLevel();
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        this.player.setDirection("up");
        break;
      case "ArrowDown":
        e.preventDefault();
        this.player.setDirection("down");
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.player.setDirection("left");
        break;
      case "ArrowRight":
        e.preventDefault();
        this.player.setDirection("right");
        break;
      case " ":
        e.preventDefault();
        if (!gameState.isGameStarted) {
          initAudio();
          gameState.isGameStarted = true;
          playBGM();
        }
        break;
      case "p":
      case "P":
        if (gameState.isGameStarted) {
          gameState.isPaused = !gameState.isPaused;
          if (gameState.isPaused) {
            stopBGM();
          } else {
            playBGM();
          }
        }
        break;
      case "m":
      case "M":
        toggleSound();
        break;
    }
  }

  setupTouchControls(canvas) {
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 30;

    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      if (!gameState.isGameStarted || gameState.isGameOver || gameState.isLevelClear) {
        initAudio();
        if (gameState.isGameOver) {
          this.onRestart();
        } else if (gameState.isLevelClear) {
          this.onNextLevel();
        } else {
          gameState.isGameStarted = true;
          playBGM();
        }
      }
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      if (!gameState.isGameStarted || gameState.isPaused ||
          gameState.isGameOver || gameState.isLevelClear) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          this.player.setDirection("right");
        } else {
          this.player.setDirection("left");
        }
      } else {
        if (deltaY > 0) {
          this.player.setDirection("down");
        } else {
          this.player.setDirection("up");
        }
      }
    }, { passive: false });
  }
}
