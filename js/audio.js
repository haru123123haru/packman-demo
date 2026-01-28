// ========== サウンドシステム ==========
import { gameState } from './gameState.js';

let audioContext = null;
let bgmOscillator = null;
let bgmGain = null;

export let isSoundEnabled = true;

// AudioContextを初期化
export function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

// 効果音：エサを食べる
export function playEatSound() {
  if (!audioContext || !isSoundEnabled) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.frequency.setValueAtTime(600, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);
  gain.gain.setValueAtTime(0.1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
  osc.start();
  osc.stop(audioContext.currentTime + 0.05);
}

// 効果音：パワーエサを食べる
export function playPowerEatSound() {
  if (!audioContext || !isSoundEnabled) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(200, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.15);
  osc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
  gain.gain.setValueAtTime(0.15, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  osc.start();
  osc.stop(audioContext.currentTime + 0.3);
}

// 効果音：敵を倒す
export function playKillEnemySound() {
  if (!audioContext || !isSoundEnabled) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(800, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
  gain.gain.setValueAtTime(0.15, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
  osc.start();
  osc.stop(audioContext.currentTime + 0.2);
}

// 効果音：ゲームオーバー
export function playGameOverSound() {
  if (!audioContext || !isSoundEnabled) return;
  const notes = [400, 350, 300, 200];
  notes.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.2);
    gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.2 + 0.2);
    osc.start(audioContext.currentTime + i * 0.2);
    osc.stop(audioContext.currentTime + i * 0.2 + 0.2);
  });
}

// 効果音：レベルクリア
export function playLevelClearSound() {
  if (!audioContext || !isSoundEnabled) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
    gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);
    osc.start(audioContext.currentTime + i * 0.15);
    osc.stop(audioContext.currentTime + i * 0.15 + 0.3);
  });
}

// 効果音：ライフ失う
export function playDeathSound() {
  if (!audioContext || !isSoundEnabled) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(500, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
  gain.gain.setValueAtTime(0.2, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  osc.start();
  osc.stop(audioContext.currentTime + 0.5);
}

// フルーツ取得音
export function playFruitSound() {
  if (!audioContext || !isSoundEnabled) return;
  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.08);
    gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.08 + 0.15);
    osc.start(audioContext.currentTime + i * 0.08);
    osc.stop(audioContext.currentTime + i * 0.08 + 0.15);
  });
}

// BGM再生
export function playBGM() {
  if (!audioContext || !isSoundEnabled) return;
  stopBGM();

  const tempos = [0.25, 0.2, 0.15];
  const baseNotes = [
    [130.81, 146.83, 164.81, 146.83],
    [146.83, 164.81, 174.61, 164.81],
    [164.81, 196.00, 220.00, 196.00],
  ];

  const tempo = tempos[(gameState.level - 1) % tempos.length];
  const notes = baseNotes[(gameState.level - 1) % baseNotes.length];

  bgmGain = audioContext.createGain();
  bgmGain.gain.setValueAtTime(0.08, audioContext.currentTime);
  bgmGain.connect(audioContext.destination);

  let noteIndex = 0;

  function playNote() {
    if (!bgmGain || !gameState.isGameStarted || gameState.isPaused ||
        gameState.isGameOver || gameState.isLevelClear) return;

    const osc = audioContext.createOscillator();
    const noteGain = audioContext.createGain();
    osc.connect(noteGain);
    noteGain.connect(bgmGain);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
    noteGain.gain.setValueAtTime(0.5, audioContext.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + tempo * 0.9);

    osc.start();
    osc.stop(audioContext.currentTime + tempo * 0.9);

    noteIndex = (noteIndex + 1) % notes.length;
    bgmOscillator = setTimeout(playNote, tempo * 1000);
  }

  playNote();
}

// BGM停止
export function stopBGM() {
  if (bgmOscillator) {
    clearTimeout(bgmOscillator);
    bgmOscillator = null;
  }
}

// サウンドトグル
export function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  if (!isSoundEnabled) {
    stopBGM();
  } else if (gameState.isGameStarted && !gameState.isPaused &&
             !gameState.isGameOver && !gameState.isLevelClear) {
    playBGM();
  }
}
