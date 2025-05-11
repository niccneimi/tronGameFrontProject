const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score');
const aboutEl = document.getElementById('about');
const gameContainer = document.getElementById('game-container');
const scoresContainer = document.getElementById('scores-container');
const scoresTableBody = document.querySelector('#scores-table tbody');
const rowsCountSelect = document.getElementById('rows-count');
const menuAboutBtn = document.getElementById('menu-about');
const menuPlayBtn = document.getElementById('menu-play');
const menuScoresBtn = document.getElementById('menu-scores');

let animationId;
let gameRunning = false;
let speed = 200;
let speedIncreaseInterval = 5000;
let lastSpeedIncrease = 0;
let score = 0;
let width = canvas.width = 800;
let height = canvas.height = 600;
let lineWidth = 8;
let minDist = 2;

const directions = {
  ArrowUp:    {x: 0, y: -1},
  ArrowDown:  {x: 0, y: 1},
  ArrowLeft:  {x: -1, y: 0},
  ArrowRight: {x: 1, y: 0},
};

let direction = directions.ArrowRight;
let nextDirection = direction;

let trail = [];
let head;
let collisionPoints = [];

const maxTailLength = 50;

let bot = {
  head: {x: width / 4, y: height / 4},
  trail: [],
  collisionPoints: [],
  direction: directions.ArrowRight,
  nextDirection: directions.ArrowRight,
  score: 0,
};
const maxTailLengthBot = 50;

function resetGame() {
  speed = 200;
  lastSpeedIncrease = performance.now();
  score = 0;
  direction = directions.ArrowRight;
  nextDirection = direction;
  let startX = width / 2, startY = height / 2;
  head = {x: startX, y: startY};
  trail = [{x: startX, y: startY}];
  collisionPoints = [{x: startX, y: startY}];
  scoreEl.textContent = 'Очки: 0';
  gameOverEl.classList.add('hidden');
  playerNameInput.value = '';
  respawnBot();
}

function respawnBot() {
  let x, y;
  do {
    x = Math.random() * (width - 100) + 50;
    y = Math.random() * (height - 100) + 50;
  } while (dist({x, y}, head) < 150);

  bot.head = {x, y};
  bot.trail = [{...bot.head}];
  bot.collisionPoints = [{...bot.head}];
  bot.direction = directions.ArrowRight;
  bot.nextDirection = directions.ArrowRight;
  bot.score = 0;
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = '#0ff';
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 10;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for (let i = 1; i < trail.length; i++) {
    ctx.lineTo(trail[i].x, trail[i].y);
  }
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#f80';
  ctx.shadowColor = '#f80';
  ctx.shadowBlur = 10;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bot.trail[0].x, bot.trail[0].y);
  for (let i = 1; i < bot.trail.length; i++) {
    ctx.lineTo(bot.trail[i].x, bot.trail[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function update(delta) {
  if (!gameRunning) return;
  if (performance.now() - lastSpeedIncrease > speedIncreaseInterval) {
    speed += 30;
    lastSpeedIncrease = performance.now();
  }
  direction = nextDirection;
  let moveDist = speed * (delta / 1000);
  let newX = head.x + direction.x * moveDist;
  let newY = head.y + direction.y * moveDist;

  if (newX < 0 || newX > width || newY < 0 || newY > height) {
    endGame();
    return;
  }

  let newPoint = {x: newX, y: newY};
  if (trail.length > 10) {
    for (let i = 0; i < collisionPoints.length - 10; i++) {
      if (dist(newPoint, collisionPoints[i]) < lineWidth * 0.8) {
        endGame();
        return;
      }
    }
  }

  for (let i = 0; i < bot.collisionPoints.length; i++) {
    if (dist(newPoint, bot.collisionPoints[i]) < lineWidth * 0.8) {
      endGame();
      return;
    }
  }

  head = newPoint;
  if (dist(trail[trail.length - 1], head) > minDist) {
    trail.push({...head});
    collisionPoints.push({...head});
    if (trail.length > maxTailLength) {
      trail.shift();
      collisionPoints.shift();
    }
    score++;
    scoreEl.textContent = 'Очки: ' + score;
  } else {
    trail[trail.length - 1] = {...head};
    collisionPoints[collisionPoints.length - 1] = {...head};
  }
}

function updateBot(delta) {
    if (!gameRunning) return;
    const dx = head.x - bot.head.x;
    const dy = head.y - bot.head.y;
  
    if (Math.abs(dx) > Math.abs(dy)) {
      bot.nextDirection = dx > 0 ? directions.ArrowRight : directions.ArrowLeft;
    } else {
      bot.nextDirection = dy > 0 ? directions.ArrowDown : directions.ArrowUp;
    }
  
    if (bot.nextDirection.x === -bot.direction.x && bot.nextDirection.y === -bot.direction.y) {
      bot.nextDirection = bot.direction;
    }
  
    bot.direction = bot.nextDirection;
  
    let moveDist = speed * (delta / 1000);
    let newX = bot.head.x + bot.direction.x * moveDist;
    let newY = bot.head.y + bot.direction.y * moveDist;
  
    if (newX < 0 || newX > width || newY < 0 || newY > height) {
      respawnBot();
      score += 10;
      scoreEl.textContent = 'Очки: ' + score;
      return;
    }
  
    let newPoint = {x: newX, y: newY};
  
    if (bot.trail.length > 10) {
      for (let i = 0; i < bot.collisionPoints.length - 10; i++) {
        if (dist(newPoint, bot.collisionPoints[i]) < lineWidth * 0.8) {
          bot.direction = {x: -bot.direction.x, y: -bot.direction.y};
          return;
        }
      }
    }
  
    for (let i = 0; i < collisionPoints.length; i++) {
      if (dist(newPoint, collisionPoints[i]) < lineWidth * 0.8) {
        respawnBot();
        score += 1000;
        scoreEl.textContent = 'Очки: ' + score;
        return;
      }
    }
  
    bot.head = newPoint;
    if (dist(bot.trail[bot.trail.length - 1], bot.head) > minDist) {
      bot.trail.push({...bot.head});
      bot.collisionPoints.push({...bot.head});
      if (bot.trail.length > maxTailLengthBot) {
        bot.trail.shift();
        bot.collisionPoints.shift();
      }
      bot.score++;
    } else {
      bot.trail[bot.trail.length - 1] = {...bot.head};
      bot.collisionPoints[bot.collisionPoints.length - 1] = {...bot.head};
    }
  }  

let lastFrameTime = 0;
function gameLoop(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const delta = timestamp - lastFrameTime;
  update(delta);
  updateBot(delta);
  draw();
  lastFrameTime = timestamp;
  if (gameRunning) animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  gameOverEl.classList.remove('hidden');
  playerNameInput.focus();
}

function startGame() {
  resetGame();
  gameRunning = true;
  lastFrameTime = 0;
  animationId = requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', e => {
  if (!directions[e.key]) return;
  const newDir = directions[e.key];
  if (newDir.x === -direction.x && newDir.y === -direction.y) return;
  nextDirection = newDir;
});

saveScoreBtn.addEventListener('click', () => {
  const name = playerNameInput.value.trim();
  if (!name) return alert('Введите имя');
  saveScoreBtn.disabled = true;
  fetch('http://localhost:8000/api/scores', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name, score}),
  })
  .then(res => {
    if (!res.ok) throw new Error('Ошибка сохранения');
    return res.json();
  })
  .then(() => {
    saveScoreBtn.disabled = false;
    showScores();
  })
  .catch(() => {
    saveScoreBtn.disabled = false;
    alert('Ошибка сохранения результата');
  });
});

function clearActiveMenu() {
  menuAboutBtn.classList.remove('active');
  menuPlayBtn.classList.remove('active');
  menuScoresBtn.classList.remove('active');
}

menuAboutBtn.addEventListener('click', () => {
  clearActiveMenu();
  menuAboutBtn.classList.add('active');
  aboutEl.classList.remove('hidden');
  gameContainer.classList.add('hidden');
  scoresContainer.classList.add('hidden');
  if (gameRunning) {
    gameRunning = false;
    cancelAnimationFrame(animationId);
  }
});

menuPlayBtn.addEventListener('click', () => {
  clearActiveMenu();
  menuPlayBtn.classList.add('active');
  aboutEl.classList.add('hidden');
  scoresContainer.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  startGame();
});

menuScoresBtn.addEventListener('click', () => {
  showScores();
});

function showScores() {
  clearActiveMenu();
  menuScoresBtn.classList.add('active');
  aboutEl.classList.add('hidden');
  gameContainer.classList.add('hidden');
  scoresContainer.classList.remove('hidden');
  if (gameRunning) {
    gameRunning = false;
    cancelAnimationFrame(animationId);
  }
  loadScores();
}

let currentSort = {field: 'score', asc: false};

rowsCountSelect.addEventListener('change', () => {
  loadScores();
});

document.querySelectorAll('#scores-table th').forEach(th => {
  th.addEventListener('click', () => {
    const field = th.dataset.sort;
    if (currentSort.field === field) {
      currentSort.asc = !currentSort.asc;
    } else {
      currentSort.field = field;
      currentSort.asc = true;
    }
    loadScores();
  });
});

function loadScores() {
  const limit = parseInt(rowsCountSelect.value, 10);
  fetch(`http://localhost:8000/api/scores?limit=${limit}&sort_field=${currentSort.field}&sort_asc=${currentSort.asc}`)
    .then(res => res.json())
    .then(data => {
      scoresTableBody.innerHTML = '';
      data.forEach((item, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${escapeHtml(item.name)}</td>
          <td>${item.score}</td>
          <td>${new Date(item.date).toLocaleString()}</td>
        `;
        scoresTableBody.appendChild(tr);
      });
    });
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

menuAboutBtn.click();
