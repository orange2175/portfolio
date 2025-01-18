const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas設定
canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.75;

// キャラクター情報
const chara1 = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 75,
  width: 50,
  height: 50,
  speed: 5,
  jumpPower: 15,
  velocityY: 0,
  isJumping: false,
  gravity: 0.5,
  isInvincible: false,
  invincibleDuration: 2000,
  invincibleStart: 0,
  opacity: 1
};

// 地面情報
const groundHeight = 20;

// ゲーム情報
let score = 0;
const maxScore = 30;
let lives = 3;

// 敵とアイテムリスト
const enemies = [];
const items = [];
let lastItemSpawn = Date.now();

// 特殊攻撃ボタン
const specialButton = document.getElementById('specialButton');
let specialActive = false;

// 操作キー
const keys = { left: false, right: false, space: false };

// ボタンイベント
document.getElementById('left').addEventListener('touchstart', () => keys.left = true);
document.getElementById('left').addEventListener('touchend', () => keys.left = false);
document.getElementById('right').addEventListener('touchstart', () => keys.right = true);
document.getElementById('right').addEventListener('touchend', () => keys.right = false);
document.getElementById('jump').addEventListener('touchstart', () => {
  if (!chara1.isJumping) {
    chara1.velocityY = -chara1.jumpPower;
    chara1.isJumping = true;
  }
});
specialButton.addEventListener('click', () => {
  if (specialActive) {
    enemies.length = 0; // 全ての敵を消す
    specialActive = false;
    specialButton.style.display = 'none';
  }
});

// 敵生成
function createEnemy(type) {
  const enemy = {
    type: type,
    x: canvas.width + Math.random() * 300, // 通常は右端から出現
    y: canvas.height - groundHeight - 40,
    width: 30,
    height: 30,
    speed: 2 + Math.random() * 2, // 通常速度
    direction: -1 // パタパタの上下移動用
  };

  if (type === 'paratroopa') {
    // パタパタ：上下にバウンド
    enemy.y = canvas.height - groundHeight - 100;
  } else if (type === 'fast') {
    // ちょい早：速い移動
    enemy.speed += 2;
  } else if (type === 'ambush') {
    // 不意打ち：左端から出現
    enemy.x = -enemy.width - Math.random() * 300;
    enemy.speed = Math.abs(enemy.speed); // 正の速度で右に移動
  }

  return enemy;
}

// 敵生成タイマー
setInterval(() => {
  const types = ['goomba', 'paratroopa', 'fast', 'ambush'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  enemies.push(createEnemy(randomType));
}, 1500);

// アイテム生成
function createItem(type) {
  return {
    type: type,
    x: canvas.width + Math.random() * 300,
    y: canvas.height - groundHeight - 80,
    width: 20,
    height: 20,
    speed: 2
  };
}

setInterval(() => {
  const type = Math.random() < 0.5 ? 'heart' : 'star';
  items.push(createItem(type));
}, 10000);

// 当たり判定
function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// 無敵状態管理
function handleInvincibility() {
  if (chara1.isInvincible) {
    chara1.opacity = (Date.now() % 200 < 100) ? 0.5 : 1;
    if (Date.now() - chara1.invincibleStart > chara1.invincibleDuration) {
      chara1.isInvincible = false;
      chara1.opacity = 1;
    }
  }
}

// ゲームループ
function update() {
  // キャラクター移動
  if (keys.left) chara1.x -= chara1.speed;
  if (keys.right) chara1.x += chara1.speed;

  // ジャンプと重力
  chara1.velocityY += chara1.gravity;
  chara1.y += chara1.velocityY;

  // 地面判定
  if (chara1.y + chara1.height > canvas.height - groundHeight) {
    chara1.y = canvas.height - groundHeight - chara1.height;
    chara1.isJumping = false;
    chara1.velocityY = 0;
  }

  // 左右の壁
  if (chara1.x < 0) chara1.x = 0;
  if (chara1.x + chara1.width > canvas.width) chara1.x = canvas.width - chara1.width;

  // 敵更新
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    if (enemy.type === 'paratroopa') {
      // パタパタの上下移動
      enemy.y += enemy.direction * 3;
      if (enemy.y < canvas.height - groundHeight - 120 || enemy.y > canvas.height - groundHeight - 80) {
        enemy.direction *= -1;
      }
    }

    enemy.x -= enemy.speed; // 通常の左移動

    // 敵が画面外に出た場合
    if ((enemy.x + enemy.width < 0 && enemy.type !== 'ambush') || (enemy.x > canvas.width && enemy.type === 'ambush')) {
      enemies.splice(i, 1);
      score++;
      if (score >= maxScore) {
        alert('クリア！');
        return;
      }
    }

    // 衝突判定
    if (checkCollision(chara1, enemy) && !chara1.isInvincible) {
      lives--;
      chara1.isInvincible = true;
      chara1.invincibleStart = Date.now();
      enemies.splice(i, 1);
      if (lives <= 0) {
        alert('ゲームオーバー！');
        return;
      }
    }
  }

  // アイテム更新
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.x -= item.speed;

    if (item.x + item.width < 0) {
      items.splice(i, 1);
    } else if (checkCollision(chara1, item)) {
      if (item.type === 'heart' && lives < 5) {
        lives++;
      } else if (item.type === 'star') {
        specialActive = true;
        specialButton.style.display = 'flex';
      }
      items.splice(i, 1);
    }
  }

  handleInvincibility();
  draw();
  requestAnimationFrame(update);
}

// 描画
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 地面
  ctx.fillStyle = 'green';
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // キャラクター
  ctx.globalAlpha = chara1.opacity;
  ctx.fillStyle = 'red';
  ctx.fillRect(chara1.x, chara1.y, chara1.width, chara1.height);
  ctx.globalAlpha = 1;

  // 敵
  for (const enemy of enemies) {
    ctx.fillStyle = enemy.type === 'goomba' ? 'brown' : enemy.type === 'paratroopa' ? 'blue' : enemy.type === 'fast' ? 'orange' : 'purple';
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  }

  // アイテム
  for (const item of items) {
    ctx.fillStyle = item.type === 'heart' ? 'pink' : 'gold';
    ctx.fillRect(item.x, item.y, item.width, item.height);
  }

  // スコアと残機
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`スコア: ${score}`, 10, 30);
  ctx.fillText(`残機: ${lives}`, 10, 60);
}

update();
