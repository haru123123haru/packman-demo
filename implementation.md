# Packman ビジュアル改善の実装解説

## 1. パックマンの口アニメーション

### 概要
パックマンの口を開閉させ、移動方向に応じて口の向きを変える。

### 実装方法

#### 状態管理
```javascript
class Packman extends Character {
  constructor(x, y) {
    super(x, y, "yellow");
    this.mouthOpen = true;      // 口の開閉状態
    this.mouthAngle = 0.25;     // 口の開き具合（0〜0.5）
  }
}
```

#### アニメーション更新
```javascript
updateMouth() {
  if (frameCount % 8 === 0) {
    this.mouthOpen = !this.mouthOpen;
  }
}
```
- `frameCount`はグローバル変数で毎フレーム増加
- 8フレームごとに口の開閉を切り替え（60fpsなら約7.5回/秒）

#### 描画処理
```javascript
draw(ctx, tileSize) {
  // 口のサイズ決定
  const mouthSize = this.mouthOpen ? this.mouthAngle : 0.05;

  // 方向に応じた回転角度
  let rotation = 0;
  switch (this.direction) {
    case "right": rotation = 0; break;
    case "down":  rotation = Math.PI / 2; break;
    case "left":  rotation = Math.PI; break;
    case "up":    rotation = -Math.PI / 2; break;
  }

  // 扇形を描画（口の部分を切り欠く）
  ctx.arc(
    centerX, centerY, radius,
    rotation + mouthSize * Math.PI,  // 開始角度
    rotation - mouthSize * Math.PI   // 終了角度
  );
}
```
- `arc()`の開始・終了角度で口を表現
- `rotation`で移動方向に応じて全体を回転

---

## 2. ゴーストデザイン

### 概要
丸ではなく、上半分が半円、下部が波形の足を持つゴースト風デザイン。

### 実装方法

#### 本体の描画
```javascript
draw(ctx, tileSize) {
  // 上半分（半円）
  ctx.arc(centerX, topY + radius, radius, Math.PI, 0, false);

  // 右側の直線
  ctx.lineTo(centerX + radius, bottomY);

  // 下部の波形（3本の足）
  const waveCount = 3;
  const waveWidth = (radius * 2) / waveCount;
  const waveHeight = 6;

  for (let i = 0; i < waveCount; i++) {
    const startX = centerX + radius - i * waveWidth;
    const endX = startX - waveWidth;
    const midX = (startX + endX) / 2;

    ctx.lineTo(midX, bottomY - waveHeight);  // 波の頂点
    ctx.lineTo(endX, bottomY);               // 波の底
  }
}
```

#### 目の描画（プレイヤーを追う）
```javascript
// 白目
ctx.arc(centerX - eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
ctx.arc(centerX + eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);

// 黒目の方向計算
const dx = player.pixelX - this.pixelX;
const dy = player.pixelY - this.pixelY;
const dist = Math.sqrt(dx * dx + dy * dy);
pupilOffsetX = (dx / dist) * 2;  // 正規化して少しオフセット
pupilOffsetY = (dy / dist) * 2;

// 黒目を描画
ctx.arc(centerX - eyeOffsetX + pupilOffsetX, eyeY + pupilOffsetY, pupilRadius, ...);
```
- プレイヤーへのベクトルを正規化
- 黒目の位置を少しずらすことで「見ている」感を演出

---

## 3. スムーズな移動

### 概要
タイル間を瞬間移動ではなく、滑らかに移動するアニメーション。

### 実装方法

#### 座標の二重管理
```javascript
class Character {
  constructor(x, y, color) {
    // タイル座標（ロジック用）
    this.tileX = x;
    this.tileY = y;

    // ピクセル座標（描画用）
    this.pixelX = x * tileSize;
    this.pixelY = y * tileSize;

    // 目標ピクセル座標
    this.targetPixelX = this.pixelX;
    this.targetPixelY = this.pixelY;

    this.isMoving = false;
  }
}
```

#### ピクセル座標の補間
```javascript
updatePixelPosition() {
  const speed = moveSpeed;  // 1フレームあたりの移動量（4px）

  // X方向
  if (this.pixelX < this.targetPixelX) {
    this.pixelX = Math.min(this.pixelX + speed, this.targetPixelX);
  } else if (this.pixelX > this.targetPixelX) {
    this.pixelX = Math.max(this.pixelX - speed, this.targetPixelX);
  }

  // Y方向（同様）

  // 目標到達で移動完了
  if (this.pixelX === this.targetPixelX && this.pixelY === this.targetPixelY) {
    this.isMoving = false;
  }
}
```

#### 移動処理の流れ
```javascript
move(map) {
  // 移動中は新しい移動を開始しない
  if (this.isMoving) return;

  // タイル座標を更新
  this.tileX = nextX;
  this.tileY = nextY;

  // 目標ピクセル座標を設定
  this.targetPixelX = this.tileX * tileSize;
  this.targetPixelY = this.tileY * tileSize;

  this.isMoving = true;
}
```

#### ゲームループの変更
```javascript
// Before: setInterval(gameTick, 200);
// After:
function gameTick(timestamp) {
  // 毎フレームピクセル座標を更新
  player.updatePixelPosition();
  enemy.updatePixelPosition();

  // タイル移動は移動完了時のみ
  if (!player.isMoving) {
    player.eat(map);
    player.move(map);
  }

  requestAnimationFrame(gameTick);
}
```

### requestAnimationFrameのメリット
- 約60fpsで安定した描画
- ブラウザのリフレッシュレートに同期
- タブが非アクティブ時は自動的に停止（省電力）

---

---

## 4. パワーエサ

### 概要
食べると一定時間パワーモードになり、敵を倒せるようになる。

### 実装方法

#### マップデータの拡張
```javascript
// 0:通常エサ, 1:壁, 2:空, 3:パワーエサ
const map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 0, 0, 0, 0, 0, 0, 3, 1],  // 四隅にパワーエサ
  // ...
  [1, 3, 0, 0, 0, 0, 0, 0, 3, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
```

#### パワーモード状態管理
```javascript
let isPowerMode = false;
let powerModeTimer = 0;
const POWER_MODE_DURATION = 300; // 約5秒（60fps × 5）

function activatePowerMode() {
  isPowerMode = true;
  powerModeTimer = POWER_MODE_DURATION;
  enemies.forEach(enemy => enemy.setScared(true));
}

function updatePowerMode() {
  if (isPowerMode) {
    powerModeTimer--;
    if (powerModeTimer <= 0) {
      isPowerMode = false;
      enemies.forEach(enemy => enemy.setScared(false));
    }
  }
}
```

#### パワーエサの描画（点滅）
```javascript
if (map[row][col] === 3) {
  ctx.fillStyle = frameCount % 20 < 10 ? "white" : "yellow";
  ctx.beginPath();
  ctx.arc(x + tileSize / 2, y + tileSize / 2, 10, 0, Math.PI * 2);
  ctx.fill();
}
```

#### 敵の怯え状態
```javascript
class Enemy extends Character {
  setScared(scared) {
    this.isScared = scared;
  }

  move(map) {
    if (this.isScared) {
      // パワーモード中は逃げる（プレイヤーから最も遠い方向へ）
      let maxDistance = -1;
      for (let dir of validDirs) {
        let distance = Math.abs(player.tileX - testX) + Math.abs(player.tileY - testY);
        if (distance > maxDistance) {
          maxDistance = distance;
          bestDir = dir;
        }
      }
    }
  }
}
```

---

## 5. 複数の敵

### 概要
4体の色違いゴーストを配置して難易度を上げる。

### 実装方法

#### 敵の配列管理
```javascript
const enemies = [
  new Enemy(8, 8, "red", "Blinky"),
  new Enemy(8, 1, "pink", "Pinky"),
  new Enemy(1, 8, "cyan", "Inky"),
  new Enemy(5, 5, "orange", "Clyde"),
];
```

#### Enemyクラスの拡張
```javascript
class Enemy extends Character {
  constructor(x, y, color, name) {
    super(x, y, color);
    this.originalColor = color;
    this.name = name;
    this.isScared = false;
    this.isDead = false;
  }
}
```

#### 一括処理
```javascript
// 更新
enemies.forEach(enemy => enemy.updatePixelPosition());
enemies.forEach(enemy => enemy.move(map));

// 描画
enemies.forEach(enemy => enemy.draw(ctx, tileSize));

// 衝突判定
enemies.forEach(enemy => {
  // 各敵との衝突をチェック
});
```

---

## 6. ライフシステム

### 概要
3回まで死ねるようにし、残機を画面に表示する。

### 実装方法

#### 状態管理
```javascript
let lives = 3;
```

#### ライフ減少処理
```javascript
function loseLife() {
  lives--;
  if (lives <= 0) {
    gameOver();
  } else {
    // プレイヤーと敵をリセット（マップはそのまま）
    player.reset();
    enemies.forEach(enemy => enemy.reset());
    isPowerMode = false;
  }
}
```

#### キャラクターのリセット
```javascript
class Character {
  constructor(x, y, color) {
    this.startX = x;  // 初期位置を保存
    this.startY = y;
  }

  reset() {
    this.tileX = this.startX;
    this.tileY = this.startY;
    this.pixelX = this.startX * tileSize;
    this.pixelY = this.startY * tileSize;
    this.targetPixelX = this.pixelX;
    this.targetPixelY = this.pixelY;
    this.direction = null;
    this.isMoving = false;
  }
}
```

#### ライフ表示（パックマンアイコン）
```javascript
function drawUI() {
  ctx.fillStyle = "yellow";
  for (let i = 0; i < lives; i++) {
    ctx.beginPath();
    ctx.moveTo(280 + i * 25, 15);
    ctx.arc(280 + i * 25, 15, 10, 0.25 * Math.PI, -0.25 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }
}
```

---

## 7. レベルシステム

### 概要
クリアすると次のレベルに進み、難易度が上がる。

### 実装方法

#### マップテンプレート
```javascript
const mapTemplates = [
  // レベル1
  [ [1,1,1,...], [1,3,0,...], ... ],
  // レベル2
  [ [1,1,1,...], [1,3,0,...], ... ],
  // レベル3
  [ [1,1,1,...], [1,3,0,...], ... ],
];

function initMap() {
  const templateIndex = (level - 1) % mapTemplates.length;
  map = mapTemplates[templateIndex].map(row => [...row]);  // ディープコピー
}
```

#### レベルアップ処理
```javascript
function nextLevel() {
  level++;
  moveSpeed = baseSpeed + level;  // レベルごとに速度アップ

  initMap();
  player.reset();
  enemies.forEach(enemy => enemy.reset());
}
```

#### レベルに応じた演出
```javascript
function drawMap() {
  if (map[row][col] === 1) {
    // 壁の色をレベルで変更
    ctx.fillStyle = level === 1 ? "green" : level === 2 ? "blue" : "purple";
  }
}
```

#### クリア判定
```javascript
function checkWin() {
  let foodCount = 0;
  for (let row of map) {
    for (let cell of row) {
      if (cell === 0 || cell === 3) foodCount++;
    }
  }
  if (foodCount === 0) {
    nextLevel();
  }
}
```

---

---

## 8. ハイスコア保存

### 概要
localStorageを使用して最高記録を永続的に保存する。

### 実装方法

#### 読み込み
```javascript
// ページ読み込み時にlocalStorageから取得
let highScore = localStorage.getItem("pacmanHighScore") || 0;
highScore = parseInt(highScore);
```

#### 保存
```javascript
function saveHighScore() {
  if (player.score > highScore) {
    highScore = player.score;
    localStorage.setItem("pacmanHighScore", highScore);
  }
}
```
- ゲームオーバー時とレベルクリア時に呼び出す

#### UI表示
```javascript
function drawUI() {
  ctx.fillStyle = "#ffff00";
  ctx.fillText("HI: " + highScore, 150, uiY);
}
```

#### 新記録表示
```javascript
function drawGameOverScreen() {
  if (player.score >= highScore && player.score > 0) {
    ctx.fillStyle = "#ffff00";
    ctx.fillText("NEW HIGH SCORE!", canvas.width / 2, canvas.height / 2 + 35);
  }
}
```

---

## 9. 一時停止機能

### 概要
Pキーでゲームを一時停止/再開できる。

### 実装方法

#### 状態管理
```javascript
let isPaused = false;
```

#### キー入力処理
```javascript
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "p":
    case "P":
      if (isGameStarted) {
        isPaused = !isPaused;  // トグル
      }
      break;
  }
});
```

#### ゲームループでの判定
```javascript
function gameTick(timestamp) {
  // 一時停止中は描画のみ、ロジック更新はスキップ
  if (!isGameStarted || isPaused || isGameOver || isLevelClear) {
    updateGame();  // 画面は描画
    requestAnimationFrame(gameTick);
    return;        // ロジック更新をスキップ
  }

  // 通常のゲーム処理...
}
```

#### 一時停止画面
```javascript
function drawPauseScreen() {
  // 半透明オーバーレイ
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = "20px Arial";
  ctx.fillText("Press P to Resume", canvas.width / 2, canvas.height / 2 + 30);
}
```

---

## 10. ゲームオーバー/クリア画面

### 概要
alertの代わりにcanvas上にオーバーレイ画面を表示する。

### 実装方法

#### 状態管理
```javascript
let isGameOver = false;
let isLevelClear = false;
let overlayTimer = 0;  // 表示アニメーション用
```

#### ゲームオーバー処理
```javascript
function gameOver() {
  isGameOver = true;
  overlayTimer = 0;
  saveHighScore();
}

function restartGame() {
  isGameOver = false;
  isGameStarted = true;
  level = 1;
  lives = 3;
  player.score = 0;
  // ... リセット処理
}
```

#### 点滅テキスト
```javascript
function drawGameOverScreen() {
  // ... 背景とスコア表示

  // 1秒後から点滅開始
  if (overlayTimer > 60 && frameCount % 60 < 40) {
    ctx.fillText("Press SPACE or TAP to Restart", ...);
  }
}
```
- `overlayTimer > 60`: 1秒待ってから表示
- `frameCount % 60 < 40`: 60フレーム中40フレーム表示（点滅効果）

#### 入力受付
```javascript
window.addEventListener("keydown", (e) => {
  if (isGameOver || isLevelClear) {
    if (e.key === " ") {
      if (isGameOver) restartGame();
      else if (isLevelClear) proceedToNextLevel();
    }
    return;  // 他の入力は無視
  }
});
```

---

## 11. タッチ操作対応

### 概要
スマートフォンでスワイプ操作とタップでプレイできるようにする。

### 実装方法

#### HTML設定
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0,
      user-scalable=no, maximum-scale=1.0">

<style>
  body {
    touch-action: none;  /* ブラウザのデフォルトタッチ動作を無効化 */
  }
</style>
```

#### スワイプ検出
```javascript
setupTouchControls() {
  let touchStartX = 0;
  let touchStartY = 0;
  const minSwipeDistance = 30;  // 最小スワイプ距離

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    // タップでゲーム開始/リスタート
    if (!isGameStarted || isGameOver || isLevelClear) {
      // 状態に応じた処理
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // スワイプ距離が短すぎる場合は無視
    if (Math.abs(deltaX) < minSwipeDistance &&
        Math.abs(deltaY) < minSwipeDistance) {
      return;
    }

    // 横と縦、どちらの移動が大きいかで方向を決定
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      player.setDirection(deltaX > 0 ? "right" : "left");
    } else {
      player.setDirection(deltaY > 0 ? "down" : "up");
    }
  }, { passive: false });
}
```

#### ポイント
- `e.preventDefault()`: ページスクロールを防止
- `{ passive: false }`: preventDefaultを有効にするオプション
- `touchstart`で開始位置を記録
- `touchend`で移動量を計算して方向を決定
- 横/縦の移動量を比較して、大きい方の軸で方向を判定

#### レスポンシブ対応
```css
canvas {
  max-width: 100%;
  max-height: 90vh;
}

@media (pointer: coarse) {
  .touch-hint {
    display: block;  /* タッチデバイスでのみヒント表示 */
  }
}
```

---

## 12. 効果音

### 概要
Web Audio APIを使用してプログラムで効果音を生成する。外部ファイル不要。

### 実装方法

#### AudioContextの初期化
```javascript
let audioContext = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // サスペンド状態の場合は再開（ブラウザのポリシー対応）
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}
```
- ユーザー操作（クリック/タップ）後に初期化が必要（ブラウザのセキュリティポリシー）

#### 効果音の基本構造
```javascript
function playEatSound() {
  if (!audioContext || !isSoundEnabled) return;

  // オシレーター（音源）を作成
  const osc = audioContext.createOscillator();
  // ゲイン（音量）ノードを作成
  const gain = audioContext.createGain();

  // 接続: オシレーター → ゲイン → 出力
  osc.connect(gain);
  gain.connect(audioContext.destination);

  // 周波数を設定（音の高さ）
  osc.frequency.setValueAtTime(600, audioContext.currentTime);
  // 周波数を時間で変化させる（上昇音）
  osc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);

  // 音量を設定し、フェードアウト
  gain.gain.setValueAtTime(0.1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

  // 再生開始と停止
  osc.start();
  osc.stop(audioContext.currentTime + 0.05);
}
```

#### オシレーターの種類
```javascript
osc.type = "sine";      // サイン波（滑らかな音）
osc.type = "square";    // 矩形波（ピコピコ音）
osc.type = "sawtooth";  // ノコギリ波（ブザー音）
osc.type = "triangle";  // 三角波（柔らかいピコピコ音）
```

#### 複数音のメロディ
```javascript
function playLevelClearSound() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6（ド・ミ・ソ・ド）

  notes.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    // ... 接続

    // 時間をずらして再生
    osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
    gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);

    osc.start(audioContext.currentTime + i * 0.15);
    osc.stop(audioContext.currentTime + i * 0.15 + 0.3);
  });
}
```

---

## 13. BGM（背景音楽）

### 概要
setTimeoutでループ再生するシンプルなBGMシステム。

### 実装方法

#### BGM再生
```javascript
let bgmOscillator = null;  // タイマーID保持用
let bgmGain = null;        // マスターゲイン

function playBGM() {
  if (!audioContext || !isSoundEnabled) return;
  stopBGM();  // 既存のBGMを停止

  // レベルに応じた設定
  const tempos = [0.25, 0.2, 0.15];  // レベルが上がると速くなる
  const baseNotes = [
    [130.81, 146.83, 164.81, 146.83],  // Level 1: C3ベース
    [146.83, 164.81, 174.61, 164.81],  // Level 2: D3ベース
    [164.81, 196.00, 220.00, 196.00],  // Level 3: E3ベース
  ];

  const tempo = tempos[(level - 1) % tempos.length];
  const notes = baseNotes[(level - 1) % baseNotes.length];

  // マスターゲインを作成
  bgmGain = audioContext.createGain();
  bgmGain.gain.setValueAtTime(0.08, audioContext.currentTime);
  bgmGain.connect(audioContext.destination);

  let noteIndex = 0;

  function playNote() {
    // ゲームが停止中なら再生しない
    if (!bgmGain || !isGameStarted || isPaused || isGameOver || isLevelClear) return;

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

    // 次の音へ
    noteIndex = (noteIndex + 1) % notes.length;

    // 次の音をスケジュール
    bgmOscillator = setTimeout(playNote, tempo * 1000);
  }

  playNote();
}
```

#### BGM停止
```javascript
function stopBGM() {
  if (bgmOscillator) {
    clearTimeout(bgmOscillator);
    bgmOscillator = null;
  }
}
```

#### 再生タイミング
```javascript
// ゲーム開始時
if (!isGameStarted) {
  initAudio();
  isGameStarted = true;
  playBGM();  // BGM開始
}

// 一時停止時
if (isPaused) {
  stopBGM();
} else {
  playBGM();
}

// ゲームオーバー/クリア時
stopBGM();
playGameOverSound();  // または playLevelClearSound()
```

---

## 14. サウンドトグル

### 概要
Mキーでサウンドのオン/オフを切り替える。

### 実装方法

```javascript
let isSoundEnabled = true;

function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  if (!isSoundEnabled) {
    stopBGM();
  } else if (isGameStarted && !isPaused && !isGameOver && !isLevelClear) {
    playBGM();
  }
}

// キー入力
case "m":
case "M":
  toggleSound();
  break;
```

#### UI表示
```javascript
// サウンド状態
ctx.fillStyle = isSoundEnabled ? "#00ff00" : "#666";
ctx.font = "14px Arial";
ctx.fillText(isSoundEnabled ? "♪ON" : "♪OFF", 560, uiY);
```

---

## 15. フルーツボーナス

### 概要
一定数のエサを食べるとボーナスフルーツが出現し、取ると高得点。

### 実装方法

#### フルーツデータ定義
```javascript
const fruitTypes = [
  { name: "cherry", color: "#ff0000", points: 100, shape: "cherry" },
  { name: "strawberry", color: "#ff6699", points: 300, shape: "strawberry" },
  { name: "orange", color: "#ffa500", points: 500, shape: "circle" },
  { name: "apple", color: "#00ff00", points: 700, shape: "apple" },
  { name: "melon", color: "#90ee90", points: 1000, shape: "circle" },
  { name: "galaxian", color: "#00ffff", points: 2000, shape: "star" },
];

let fruit = null;
let dotsEaten = 0;
const FRUIT_APPEAR_DOTS = 70;  // 出現条件
const FRUIT_DURATION = 600;    // 表示時間（約10秒）
```

#### フルーツ出現
```javascript
function spawnFruit() {
  const fruitIndex = Math.min((level - 1), fruitTypes.length - 1);
  fruit = {
    ...fruitTypes[fruitIndex],
    x: 9,   // マップ中央
    y: 14,
    timer: FRUIT_DURATION,
  };
}

// エサを食べた時にチェック
eat(map) {
  if (tile === 0) {
    dotsEaten++;
    if (dotsEaten === FRUIT_APPEAR_DOTS || dotsEaten === FRUIT_APPEAR_DOTS * 2) {
      if (!fruit) spawnFruit();
    }
  }
}
```

#### フルーツ描画（形状別）
```javascript
function drawFruit() {
  if (!fruit) return;

  switch (fruit.shape) {
    case "cherry":
      // 2つの円とつる
      ctx.arc(x - 5, y + 3, 6, 0, Math.PI * 2);
      ctx.arc(x + 5, y + 3, 6, 0, Math.PI * 2);
      ctx.quadraticCurveTo(x, y - 12, x + 5, y - 3);  // つる
      break;

    case "strawberry":
      // いちご形（ベジェ曲線）
      ctx.quadraticCurveTo(x + 10, y, x, y + 10);
      ctx.quadraticCurveTo(x - 10, y, x, y - 8);
      break;

    case "star":
      // 星形（5点）
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        ctx.lineTo(px, py);
      }
      break;
  }

  // 消える前の点滅
  if (fruit.timer < 120 && frameCount % 20 < 10) {
    // 点滅エフェクト
  }
}
```

#### タイマー管理
```javascript
function updateFruit() {
  if (fruit) {
    fruit.timer--;
    if (fruit.timer <= 0) {
      fruit = null;  // 時間切れで消える
    }
  }
}
```

---

## 16. 敵のAI改善

### 概要
4体のゴーストにそれぞれ異なる性格（追跡パターン）を持たせる。

### 実装方法

#### 各ゴーストの性格
```javascript
switch (this.name) {
  case "Blinky":
    // 赤: 直接追跡（シンプル）
    targetX = player.tileX;
    targetY = player.tileY;
    break;

  case "Pinky":
    // ピンク: 待ち伏せ（プレイヤーの4マス前方を狙う）
    const ahead = 4;
    switch (player.direction) {
      case "up": targetY = player.tileY - ahead; break;
      case "down": targetY = player.tileY + ahead; break;
      case "left": targetX = player.tileX - ahead; break;
      case "right": targetX = player.tileX + ahead; break;
    }
    break;

  case "Inky":
    // シアン: 気まぐれ（ランダム性あり）
    if (Math.random() < 0.3) {
      // 30%でランダム移動
      bestDir = validDirs[Math.floor(Math.random() * validDirs.length)];
    } else {
      // 70%で2マス前方を狙う
      // ...
    }
    break;

  case "Clyde":
    // オレンジ: 臆病（近いと逃げる）
    const distToPlayer = Math.abs(player.tileX - this.tileX) +
                         Math.abs(player.tileY - this.tileY);
    if (distToPlayer < 8) {
      // 近い時は左下コーナーへ逃げる
      targetX = 1;
      targetY = map.length - 2;
    } else {
      // 遠い時は追う
      targetX = player.tileX;
      targetY = player.tileY;
    }
    break;
}
```

#### ターゲットへの移動
```javascript
// 最短距離の方向を選ぶ
let minDistance = Infinity;
for (let dir of validDirs) {
  let testX = this.tileX;
  let testY = this.tileY;
  // 方向に応じて座標を変更...

  let distance = Math.abs(targetX - testX) + Math.abs(targetY - testY);
  if (distance < minDistance) {
    minDistance = distance;
    bestDir = dir;
  }
}
```

### 各ゴーストの特徴

| ゴースト | 色 | 性格 | 行動パターン |
|----------|-----|------|--------------|
| Blinky | 赤 | 追跡者 | 常にプレイヤーを直接追う |
| Pinky | ピンク | 待ち伏せ | プレイヤーの進行方向の先回り |
| Inky | シアン | 気まぐれ | ランダム性を持った予測困難な動き |
| Clyde | オレンジ | 臆病 | 近づくと逃げ、離れると追う |

---

## 17. ワープトンネル

### 概要
マップの左右端で反対側に移動できるトンネル。

### 実装方法

#### マップデータ
```javascript
// マップの左右端を0（通路）にする
[0, 0, 0, 0, 0, 0, 0, 1, 4, 4, 4, 4, 1, 0, 0, 0, 0, 0, 0, 0],  // 行10
```

#### 移動処理
```javascript
move(map) {
  let nextX = this.tileX;

  if (this.direction === "left") nextX -= 1;
  if (this.direction === "right") nextX += 1;

  // ワープトンネル処理
  if (nextX < 0) {
    nextX = map[0].length - 1;  // 左端→右端
  }
  if (nextX >= map[0].length) {
    nextX = 0;  // 右端→左端
  }

  // 移動実行
  if (map[nextY] && map[nextY][nextX] !== 1) {
    this.tileX = nextX;
    // ...
  }
}
```

### 問題点と修正

#### 発生していた問題
スムーズ移動システムでは、`tileX`（論理座標）と`pixelX`（描画座標）を分けて管理している。
ワープ時に`tileX`だけが更新され、`pixelX`は元の位置のままだと、
`updatePixelPosition()`が0から570まで（画面の端から端まで）スムーズに移動しようとしてしまう。

```
例：左端(x=0)から左に移動
- tileX: 0 → 19（正しくワープ）
- pixelX: 0のまま
- targetPixelX: 570（19 * 30）
→ 0から570までゆっくりアニメーション（誤動作）
```

#### 修正後のコード
```javascript
if (map[nextY] && map[nextY][nextX] !== 1 && map[nextY][nextX] !== 4) {
  // ワープトンネル検出：端から端へ移動した場合
  const isWarpingLeft = this.tileX === 0 && nextX === map[0].length - 1;
  const isWarpingRight = this.tileX === map[0].length - 1 && nextX === 0;

  this.tileX = nextX;
  this.tileY = nextY;
  this.targetPixelX = this.tileX * tileSize;
  this.targetPixelY = this.tileY * tileSize;

  // ワープ時はピクセル位置も即座に更新（アニメーションをスキップ）
  if (isWarpingLeft || isWarpingRight) {
    this.pixelX = this.targetPixelX;
  }

  this.isMoving = true;
}
```

#### ポイント
- マップの端を`0`（通路）または`2`（空）にする
- 座標が範囲外になったら反対側に設定
- **ワープ検出**: 現在の位置と次の位置を比較して端から端への移動を検出
- **ピクセル位置の即時更新**: ワープ時は`pixelX`を`targetPixelX`と同じ値に設定
- プレイヤーと敵の両方に同じ修正を適用

---

## まとめ

| 機能 | 技術ポイント |
|------|-------------|
| 口アニメーション | `arc()`の角度操作、フレームカウンター |
| ゴーストデザイン | パス描画、ベクトル正規化 |
| スムーズ移動 | 座標の二重管理、線形補間、`requestAnimationFrame` |
| パワーエサ | タイマー管理、状態切り替え、敵のAI変更 |
| 複数の敵 | 配列管理、`forEach`による一括処理 |
| ライフシステム | 初期位置保存、リセット処理 |
| レベルシステム | マップテンプレート、ディープコピー、難易度調整 |
| ハイスコア保存 | `localStorage`、永続化 |
| 一時停止機能 | 状態フラグ、ゲームループ制御 |
| ゲームオーバー画面 | オーバーレイ描画、点滅アニメーション |
| タッチ操作 | `touchstart/end`、スワイプ検出、`preventDefault` |
| 効果音 | Web Audio API、`OscillatorNode`、周波数変調 |
| BGM | `setTimeout`ループ、レベル別テンポ/音階 |
| サウンドトグル | 状態フラグ、UI表示 |
| フルーツボーナス | 出現条件、タイマー、形状別描画 |
| 敵のAI改善 | 性格別ターゲット、マンハッタン距離 |
| ワープトンネル | 座標ラップアラウンド、ピクセル位置の即時更新 |
