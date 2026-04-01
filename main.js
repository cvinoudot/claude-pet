const { app, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'pet-state.json');
const PORT = 27182;

let win = null;
let tray = null;
let httpServer = null;

// --- State management ---

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    xp: 0,
    stage: 'baby',
    type: 'cat',
    lastSeen: Date.now(),
    moodHistory: []
  };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {}
}

// --- HTTP server for Claude Code hooks ---

function startHttpServer() {
  httpServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/event') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const event = JSON.parse(body);
          if (win && !win.isDestroyed()) {
            win.webContents.send('claude-event', event);
          }
        } catch (e) {}
        res.writeHead(200);
        res.end('ok');
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  httpServer.listen(PORT, '127.0.0.1', () => {
    console.log(`Pet HTTP server listening on http://127.0.0.1:${PORT}`);
  });

  httpServer.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} already in use — another pet instance may be running`);
    }
  });
}

// --- Tray icon: orange paw 16x16 drawn via nativeImage ---

function createTrayIcon() {
  // Build a 16x16 RGBA buffer with an orange paw shape
  const size = 16;
  const buf  = Buffer.alloc(size * size * 4, 0); // all transparent

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a;
  }
  function fillRect(x, y, w, h, r, g, b) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        setPixel(x + dx, y + dy, r, g, b);
  }
  function fillCircle(cx, cy, radius, r, g, b) {
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++)
        if (dx*dx + dy*dy <= radius*radius)
          setPixel(cx + dx, cy + dy, r, g, b);
  }

  // orange paw: main pad + 4 small toe pads
  const OR = 240, OG = 120, OB = 20; // orange
  fillCircle(8, 11, 4, OR, OG, OB);   // main pad
  fillCircle(4,  5, 2, OR, OG, OB);   // toe 1
  fillCircle(7,  4, 2, OR, OG, OB);   // toe 2
  fillCircle(10, 4, 2, OR, OG, OB);   // toe 3
  fillCircle(13, 6, 2, OR, OG, OB);   // toe 4

  return nativeImage.createFromBuffer(buf, { width: size, height: size });
}

// --- Window ---

function createWindow() {
  const state = loadState();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 140,
    height: 140,
    x: width - 150,
    y: height - 150,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('renderer.html');
  win.setIgnoreMouseEvents(true, { forward: true });

  // Keep pet on top even when other windows take focus
  win.setAlwaysOnTop(true, 'screen-saver');

  // Re-assert on-top when focus changes anywhere in the system
  win.on('blur', () => {
    win.setAlwaysOnTop(true, 'screen-saver');
  });

  // Periodically re-assert always-on-top (catches minimize/restore edge cases on Windows)
  setInterval(() => {
    if (win && !win.isDestroyed() && !win.isAlwaysOnTop()) {
      win.setAlwaysOnTop(true, 'screen-saver');
    }
  }, 2000);

  // Enable mouse interaction on hover
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('init-state', state);
  });

  // IPC: renderer tells main when mouse is over pet
  ipcMain.on('mouse-enter', () => {
    win.setIgnoreMouseEvents(false);
  });
  ipcMain.on('mouse-leave', () => {
    win.setIgnoreMouseEvents(true, { forward: true });
  });

  // IPC: save state from renderer
  ipcMain.on('save-state', (event, state) => {
    saveState(state);
  });

  // IPC: get current state
  ipcMain.handle('get-state', () => {
    return loadState();
  });

  // Allow dragging the pet
  ipcMain.on('start-drag', () => {
    win.setIgnoreMouseEvents(false);
  });
  ipcMain.on('end-drag', () => {
    win.setIgnoreMouseEvents(true, { forward: true });
  });
}

// --- Tray ---

function createTray() {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('Claude Pet 🐾');

  function updateMenu() {
    const state = loadState();
    const menu = Menu.buildFromTemplate([
      {
        label: `🐾 Claude Pet — ${state.type === 'cat' ? '🐱 Кот' : '🐰 Заяц'} (XP: ${state.xp})`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: '🐱 Orange tabby cat',
        type: 'radio',
        checked: state.type === 'cat' && state.colorVariant !== 'bw',
        click: () => switchPet('cat', 'orange')
      },
      {
        label: '🐱 Black & white cat',
        type: 'radio',
        checked: state.type === 'cat' && state.colorVariant === 'bw',
        click: () => switchPet('cat', 'bw')
      },
      {
        label: '🐰 White rabbit',
        type: 'radio',
        checked: state.type === 'rabbit' && state.colorVariant !== 'grey',
        click: () => switchPet('rabbit', 'white')
      },
      {
        label: '🐰 Grey rabbit',
        type: 'radio',
        checked: state.type === 'rabbit' && state.colorVariant === 'grey',
        click: () => switchPet('rabbit', 'grey')
      },
      { type: 'separator' },
      {
        label: '🍖 Feed',
        click: () => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('claude-event', { type: 'feed' });
          }
        }
      },
      {
        label: '🤚 Pet',
        click: () => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('claude-event', { type: 'pet' });
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Show/Hide',
        click: () => {
          if (win) {
            win.isVisible() ? win.hide() : win.show();
          }
        }
      },
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ]);
    tray.setContextMenu(menu);
  }

  updateMenu();
  tray.on('click', updateMenu);
}

function switchPet(type, variant) {
  const state = loadState();
  state.type = type;
  state.colorVariant = variant;
  saveState(state);
  if (win && !win.isDestroyed()) {
    win.webContents.send('init-state', state);
  }
}

// --- Auto-install Claude Code hooks ---

function installHooks() {
  const os = require('os');
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');

  let settings = {};
  try {
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (e) {
    console.log('Could not read settings.json:', e.message);
    return;
  }

  // Check if our hooks are already there
  const hooks = settings.hooks || {};
  const postToolUse = hooks.PostToolUse || [];
  const alreadyInstalled = postToolUse.some(h =>
    JSON.stringify(h).includes('27182')
  );
  if (alreadyInstalled) return;

  // Add hooks
  settings.hooks = {
    ...hooks,
    PostToolUse: [
      ...(hooks.PostToolUse || []),
      {
        matcher: '.*',
        hooks: [{
          type: 'command',
          command: 'curl -s -X POST http://localhost:27182/event -H "Content-Type: application/json" -d "{\\"type\\":\\"tool_use\\",\\"tool_name\\":\\"$CLAUDE_TOOL_NAME\\"}" || true'
        }]
      }
    ],
    Stop: [
      ...(hooks.Stop || []),
      {
        hooks: [{
          type: 'command',
          command: 'curl -s -X POST http://localhost:27182/event -H "Content-Type: application/json" -d "{\\"type\\":\\"stop\\"}" || true'
        }]
      }
    ]
  };

  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('Claude Code hooks installed successfully!');
  } catch (e) {
    console.log('Could not write settings.json:', e.message);
  }
}

// --- App lifecycle ---

app.whenReady().then(() => {
  // Auto-install hooks into Claude Code settings
  installHooks();

  // Check if a session was long ago — pet "missed" you
  const state = loadState();
  const now = Date.now();
  const hoursSince = (now - (state.lastSeen || now)) / 1000 / 60 / 60;
  state.missedYou = hoursSince > 2;
  state.lastSeen = now;
  saveState(state);

  createWindow();
  createTray();
  startHttpServer();
});

app.on('window-all-closed', () => {
  // Keep running (tray app)
});

app.on('before-quit', () => {
  if (httpServer) httpServer.close();
});
