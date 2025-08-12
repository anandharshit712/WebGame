const gameSelect = document.getElementById('gameSelect');
const restartBtn = document.getElementById('restartBtn');
const gameContainer = document.getElementById('gameContainer');
const hud = document.getElementById('hud');

let currentGame = null;
let currentDestroy = null;

function setHud(contentHtml) {
  hud.innerHTML = contentHtml;
}

function setRestartEnabled(enabled) {
  restartBtn.disabled = !enabled;
}

async function loadGame(gameId) {
  if (currentDestroy) {
    currentDestroy();
    currentDestroy = null;
  }
  currentGame = null;
  gameContainer.innerHTML = '';
  setHud('<p>Select a game to see stats and controls.</p>');
  setRestartEnabled(false);

  if (gameId === 'none') return;

  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 640;
  gameContainer.appendChild(canvas);

  try {
    if (gameId === 'snake') {
      const mod = await import('./games/snake.js');
      const api = mod.init(canvas, setHud);
      currentGame = api;
      currentDestroy = api.destroy;
    } else if (gameId === 'tetris') {
      const mod = await import('./games/tetris.js');
      const api = mod.init(canvas, setHud);
      currentGame = api;
      currentDestroy = api.destroy;
    }

    setRestartEnabled(true);
  } catch (err) {
    console.error(err);
    setHud('<p style="color:#ef4444">Failed to load the game. Check console for details.</p>');
  }
}

restartBtn.addEventListener('click', () => {
  if (!currentGame) return;
  currentGame.restart();
});

document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r') {
    if (currentGame) currentGame.restart();
  }
});

gameSelect.addEventListener('change', (e) => {
  loadGame(e.target.value);
});

// Initial HUD
setHud('<p>Select a game to start playing.</p>'); 