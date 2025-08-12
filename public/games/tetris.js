// Tetris game
// Exports: init(canvas, setHud) -> { restart, destroy }

export function init(canvas, setHud) {
  const ctx = canvas.getContext('2d');
  const cols = 10;
  const rows = 20;
  const blockSize = Math.floor(Math.min(canvas.width / cols, canvas.height / rows));
  canvas.width = blockSize * cols;
  canvas.height = blockSize * rows;

  const emptyRow = () => Array(cols).fill(0);
  let board = Array.from({ length: rows }, emptyRow);

  const shapes = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
  };
  const colors = {
    0: '#0a0f1f',
    I: '#06b6d4',
    O: '#f59e0b',
    T: '#a78bfa',
    S: '#22c55e',
    Z: '#ef4444',
    J: '#60a5fa',
    L: '#f97316',
  };

  function randomPiece() {
    const keys = Object.keys(shapes);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { shape: shapes[key].map(row => [...row]), key, x: Math.floor(cols / 2) - 1, y: 0 };
  }

  let piece = randomPiece();
  let dropCounter = 0;
  let dropInterval = 700; // ms
  let lastTime = 0;
  let score = 0;
  let linesCleared = 0;
  let highScore = 0;
  let rafId = null;
  let running = true;

  function rotate(matrix) {
    const N = matrix.length;
    const M = matrix[0].length;
    const res = Array.from({ length: M }, () => Array(N).fill(0));
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < M; x++) {
        res[x][N - 1 - y] = matrix[y][x];
      }
    }
    return res;
  }

  function collide(board, piece) {
    const { shape, x: px, y: py } = piece;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const bx = px + x;
          const by = py + y;
          if (bx < 0 || bx >= cols || by >= rows) return true;
          if (by >= 0 && board[by][bx]) return true;
        }
      }
    }
    return false;
  }

  function merge(board, piece) {
    const { shape, x: px, y: py, key } = piece;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          if (py + y >= 0) board[py + y][px + x] = key;
        }
      }
    }
  }

  function sweep() {
    let lines = 0;
    for (let y = rows - 1; y >= 0; y--) {
      if (board[y].every(cell => cell)) {
        board.splice(y, 1);
        board.unshift(emptyRow());
        lines++;
        y++;
      }
    }
    if (lines > 0) {
      linesCleared += lines;
      score += [0, 100, 300, 500, 800][lines];
      dropInterval = Math.max(120, dropInterval - lines * 20);
    }
  }

  function drawBlock(x, y, key) {
    ctx.fillStyle = colors[key] || '#94a3b8';
    ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
  }

  function drawBoard() {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (board[y][x]) drawBlock(x, y, board[y][x]);
      }
    }
  }

  function drawPiece() {
    const { shape, x: px, y: py, key } = piece;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] && py + y >= 0) drawBlock(px + x, py + y, key);
      }
    }
  }

  function updateHud() {
    setHud(`
      <h2>Tetris</h2>
      <p><strong>Score</strong>: ${score} &nbsp; <strong>Lines</strong>: ${linesCleared} &nbsp; <strong>High</strong>: ${highScore}</p>
      <p><strong>Controls</strong>: Left/Right to move, Up to rotate, Down to soft drop, Space for hard drop, R to restart.</p>
    `);
  }

  function hardDrop() {
    while (!collide(board, { ...piece, y: piece.y + 1 })) {
      piece.y++;
      score += 2;
    }
    lockPiece();
  }

  function lockPiece() {
    merge(board, piece);
    sweep();
    piece = randomPiece();
    piece.y = -1; // start slightly above
    piece.x = Math.floor(cols / 2) - 1;
    if (collide(board, piece)) {
      running = false;
      highScore = Math.max(highScore, score);
    }
  }

  function drop() {
    piece.y++;
    if (collide(board, piece)) {
      piece.y--;
      lockPiece();
    }
    dropCounter = 0;
  }

  function move(offset) {
    piece.x += offset;
    if (collide(board, piece)) piece.x -= offset;
  }

  function rotatePiece() {
    const rotated = rotate(piece.shape);
    const prev = piece.shape;
    piece.shape = rotated;
    // simple wall kick
    if (collide(board, piece)) {
      piece.x++;
      if (collide(board, piece)) {
        piece.x -= 2;
        if (collide(board, piece)) {
          piece.x++;
          piece.shape = prev;
        }
      }
    }
  }

  function draw(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (running && dropCounter > dropInterval) {
      drop();
    }

    drawBoard();
    drawPiece();

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over - Press R to Restart', canvas.width / 2, canvas.height / 2);
    }

    updateHud();
    rafId = requestAnimationFrame(draw);
  }

  function onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (!running && key !== 'r') return;
    if (key === 'arrowleft' || key === 'a') move(-1);
    else if (key === 'arrowright' || key === 'd') move(1);
    else if (key === 'arrowup' || key === 'w') rotatePiece();
    else if (key === 'arrowdown' || key === 's') { piece.y++; if (collide(board, piece)) piece.y--; score++; }
    else if (key === ' ') hardDrop();
    else if (key === 'r') restart();
  }

  function restart() {
    board = Array.from({ length: rows }, emptyRow);
    piece = randomPiece();
    dropCounter = 0;
    dropInterval = 700;
    lastTime = 0;
    score = 0;
    linesCleared = 0;
    running = true;
  }

  function destroy() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('keydown', onKeyDown);
  }

  window.addEventListener('keydown', onKeyDown);
  restart();
  draw();
  updateHud();

  return { restart, destroy };
} 