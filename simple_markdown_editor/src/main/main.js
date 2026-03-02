const { app, BrowserWindow, ipcMain, nativeTheme, protocol, net } = require('electron');
const path = require('path');
const Store = require('./store');
const FileWatcher = require('./file-watcher');
const { registerIpcHandlers } = require('./ipc-handlers');
const { buildAndSetMenu } = require('./menu');
const { THEME_BG_COLORS, WINDOW_DEFAULTS, TIMING } = require('./constants');

// ── Register custom protocol for local file access (must be before ready) ──
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-resource', privileges: { secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// ── State ──
const windows = new Set();
const store = new Store();
const fileWatcher = new FileWatcher();
const isDev = process.argv.includes('--dev');
let windowIdCounter = 0;
let isQuitting = false;

// ── Window Creation ──

function getBackgroundColor() {
  const theme = store.getSetting('theme');
  if (theme === 'system') {
    return nativeTheme.shouldUseDarkColors ? THEME_BG_COLORS.dark : THEME_BG_COLORS.light;
  }
  return THEME_BG_COLORS[theme] || THEME_BG_COLORS.dark;
}

function createWindow(options = {}) {
  const { fresh = false, windowId } = options;
  const id = windowId || String(windowIdCounter++);
  const savedBounds = store.getWindowBounds();

  // Offset new windows so they don't stack exactly on top
  const offset = windows.size * 22;

  const win = new BrowserWindow({
    width: savedBounds?.width || WINDOW_DEFAULTS.DEFAULT_WIDTH,
    height: savedBounds?.height || WINDOW_DEFAULTS.DEFAULT_HEIGHT,
    x: savedBounds?.x != null ? savedBounds.x + offset : undefined,
    y: savedBounds?.y != null ? savedBounds.y + offset : undefined,
    minWidth: WINDOW_DEFAULTS.MIN_WIDTH,
    minHeight: WINDOW_DEFAULTS.MIN_HEIGHT,
    backgroundColor: getBackgroundColor(),
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for chokidar in preload
    },
  });

  // Tag window with its session ID and close state
  win._windowId = id;
  win._forceClose = false;
  windows.add(win);

  // Build URL with window ID and fresh flag
  const query = `windowId=${id}${fresh ? '&fresh=true' : ''}`;

  if (isDev) {
    win.loadURL(`http://localhost:5173?${query}`);
  } else {
    win.loadFile(path.join(__dirname, '../../dist-renderer/main/index.html'), {
      query: fresh ? { windowId: id, fresh: 'true' } : { windowId: id },
    });
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  // Save window bounds on resize/move (debounced)
  let boundsTimer = null;
  const saveBounds = () => {
    if (boundsTimer) clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      if (win && !win.isDestroyed()) {
        store.setWindowBounds(win.getBounds());
      }
    }, TIMING.BOUNDS_SAVE_DEBOUNCE_MS);
  };

  win.on('resize', saveBounds);
  win.on('move', saveBounds);

  // Intercept close to check for unsaved tabs
  win.on('close', (e) => {
    if (win._forceClose) return; // Already confirmed — allow close
    e.preventDefault();
    win.webContents.send('close-window');
  });

  win.on('closed', () => {
    windows.delete(win);
    // Remove session for this window unless the app is quitting
    // (on quit we preserve all sessions for next launch)
    if (!isQuitting) {
      store.removeWindowSession(id);
    }
  });

  // Security: prevent navigation and new windows
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  return win;
}

// ── Menu Actions ──

function getFocusedWindow() {
  return BrowserWindow.getFocusedWindow() || [...windows][0] || null;
}

function sendToFocused(channel, ...args) {
  const win = getFocusedWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}

function handleMenuOpen(filePath) {
  sendToFocused('open-file', filePath);
  store.addRecentFile(filePath);
}

function handleMenuSave() {
  sendToFocused('menu-save');
}

function handleMenuSaveAs() {
  sendToFocused('menu-save-as');
}

function handleMenuNewFile() {
  sendToFocused('menu-new-file');
}

function handleMenuNewWindow() {
  createWindow({ fresh: true });
}

function handleMenuOpenFolder(dirPath) {
  sendToFocused('open-folder', dirPath);
  store.addRecentDirectory(dirPath);
}

// ── Theme ──

function broadcastTheme() {
  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('app:theme-changed', theme);
    }
  }
}

// ── App Lifecycle ──

app.whenReady().then(() => {
  // Handle local-resource:// protocol for preview images
  protocol.handle('local-resource', (request) => {
    const url = new URL(request.url);
    const filePath = decodeURIComponent(url.pathname);
    return net.fetch(`file://${filePath}`);
  });

  // Restore windows from saved sessions, or create a fresh default window
  const sessions = store.getAllWindowSessions();
  const sessionEntries = Object.entries(sessions);

  if (sessionEntries.length > 0) {
    for (const [id] of sessionEntries) {
      createWindow({ windowId: id });
    }
    // Set counter past existing IDs to avoid collisions
    windowIdCounter = Math.max(windowIdCounter, ...sessionEntries.map(([id]) => (parseInt(id, 10) || 0) + 1));
  } else {
    createWindow();
  }

  // ── Window Close Confirmation IPC ──
  // (registered here because they need access to isQuitting)

  ipcMain.handle('window:confirm-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win._forceClose = true;
      win.close();
    }
  });

  ipcMain.handle('window:cancel-close', () => {
    // If the quit sequence was in progress and user canceled, reset the flag
    isQuitting = false;
  });

  registerIpcHandlers({
    store,
    fileWatcher,
    getFocusedWindow,
  });

  buildAndSetMenu({
    getFocusedWindow,
    store,
    onOpen: handleMenuOpen,
    onSave: handleMenuSave,
    onSaveAs: handleMenuSaveAs,
    onNewFile: handleMenuNewFile,
    onNewWindow: handleMenuNewWindow,
    onOpenFolder: handleMenuOpenFolder,
  });

  nativeTheme.on('updated', broadcastTheme);

  // Open files dropped on dock icon (macOS)
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    if (windows.size > 0) {
      handleMenuOpen(filePath);
    } else {
      // No windows open — create one then open the file
      const win = createWindow({ fresh: true });
      win.webContents.once('did-finish-load', () => {
        win.webContents.send('open-file', filePath);
        store.addRecentFile(filePath);
      });
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  fileWatcher.destroy();
});
