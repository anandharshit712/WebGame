// Snake game (grid based)
// Exports: init(canvas, setHud) -> { restart, destroy }

export function init(canvas, setHud) {
  const ctx = canvas.getContext('2d');
  const gridSize = 24; // pixels per cell
  const cols = Math.floor(canvas.width / gridSize);
  const rows = Math.floor(canvas.height / gridSize);

  let snake = [];
  let direction = { x: 1, y: 0 };
  let pendingDirection = { x: 1, y: 0 };
  let food = null;
  let score = 0;
  let highScore = 0;
  let tickMs = 140;
  let rafId = null;
  let lastTick = 0;
  let running = true;

  function reset() {
    score = 0;
    direction = { x: 1, y: 0 };
    pendingDirection = { x: 1, y: 0 };
    snake = [
      { x: Math.floor(cols / 2), y: Math.floor(rows / 2) },
      { x: Math.floor(cols / 2) - 1, y: Math.floor(rows / 2) },
    ];
    spawnFood();
    running = true;
  }

  function spawnFood() {
    while (true) {
      const fx = Math.floor(Math.random() * cols);
      const fy = Math.floor(Math.random() * rows);
      if (!snake.some(s => s.x === fx && s.y === fy)) {
        food = { x: fx, y: fy };
        break;
      }
    }
  }

  function updateHud() {
    setHud(`
      <h2>Snake</h2>
      <p><strong>Score</strong>: ${score} &nbsp; <strong>High</strong>: ${highScore}</p>
      <p><strong>Controls</strong>: Arrow keys / WASD. R to restart.</p>
      <p><strong>Tip</strong>: Don\'t run into yourself or the walls!</p>
    `);
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
  }

  function gameOver() {
    running = false;
    highScore = Math.max(highScore, score);
    updateHud();
  }

  function tick() {
    const now = performance.now();
    if (now - lastTick >= tickMs) {
      lastTick = now;

      // Apply pending direction if not reversing
      if (Math.abs(pendingDirection.x) !== Math.abs(direction.x) || Math.abs(pendingDirection.y) !== Math.abs(direction.y)) {
        direction = pendingDirection;
      }

      if (running) {
        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

        // wall collision
        if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows) {
          gameOver();
        } else {
          // self collision
          if (snake.some((s, idx) => idx > 0 && s.x === head.x && s.y === head.y)) {
            gameOver();
          } else {
            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
              score += 10;
              if (tickMs > 70) tickMs -= 2; // speed up a bit
              spawnFood();
            } else {
              snake.pop();
            }
          }
        }
      }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid backdrop
      ctx.fillStyle = '#0c152b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Food
      drawCell(food.x, food.y, '#f59e0b');

      // Snake
      snake.forEach((seg, i) => drawCell(seg.x, seg.y, i === 0 ? '#60a5fa' : '#3b82f6'));

      if (!running) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e5e7eb';
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over - Press R to Restart', canvas.width / 2, canvas.height / 2);
      }

      updateHud();
    }
    rafId = requestAnimationFrame(tick);
  }

  function onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') pendingDirection = { x: 0, y: -1 };
    else if (key === 'arrowdown' || key === 's') pendingDirection = { x: 0, y: 1 };
    else if (key === 'arrowleft' || key === 'a') pendingDirection = { x: -1, y: 0 };
    else if (key === 'arrowright' || key === 'd') pendingDirection = { x: 1, y: 0 };
    else if (key === 'r') restart();
  }

  function restart() {
    reset();
  }

  function destroy() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('keydown', onKeyDown);
  }

  window.addEventListener('keydown', onKeyDown);
  reset();
  tick();
  updateHud();

  return { restart, destroy };
} 
