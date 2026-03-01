const { app, BrowserWindow, nativeTheme } = require('electron');
const path = require('path');
const Store = require('./store');
const FileWatcher = require('./file-watcher');
const { registerIpcHandlers } = require('./ipc-handlers');
const { buildAndSetMenu } = require('./menu');
const { THEME_BG_COLORS, WINDOW_DEFAULTS, TIMING } = require('./constants');

// ── State ──
let mainWindow = null;
const store = new Store();
const fileWatcher = new FileWatcher();
const isDev = process.argv.includes('--dev');

// ── Window Creation ──

function getBackgroundColor() {
  const theme = store.getSetting('theme');
  if (theme === 'system') {
    return nativeTheme.shouldUseDarkColors ? THEME_BG_COLORS.dark : THEME_BG_COLORS.light;
  }
  return THEME_BG_COLORS[theme] || THEME_BG_COLORS.dark;
}

function createMainWindow() {
  const savedBounds = store.getWindowBounds();

  mainWindow = new BrowserWindow({
    width: savedBounds?.width || WINDOW_DEFAULTS.DEFAULT_WIDTH,
    height: savedBounds?.height || WINDOW_DEFAULTS.DEFAULT_HEIGHT,
    x: savedBounds?.x,
    y: savedBounds?.y,
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

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/main/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save window bounds on resize/move (debounced)
  let boundsTimer = null;
  const saveBounds = () => {
    if (boundsTimer) clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        store.setWindowBounds(mainWindow.getBounds());
      }
    }, TIMING.BOUNDS_SAVE_DEBOUNCE_MS);
  };

  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Security: prevent navigation and new windows
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

// ── Menu Actions ──

function getMainWindow() {
  return mainWindow;
}

function handleMenuOpen(filePath) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('open-file', filePath);
    store.addRecentFile(filePath);
  }
}

function handleMenuSave() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('menu-save');
  }
}

function handleMenuSaveAs() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('menu-save-as');
  }
}

function handleMenuNewFile() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('menu-new-file');
  }
}

function handleMenuNewWindow() {
  // For v0.1.0, just create a new untitled tab
  handleMenuNewFile();
}

function handleMenuOpenFolder(dirPath) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('open-folder', dirPath);
    store.addRecentDirectory(dirPath);
  }
}

// ── Theme ──

function broadcastTheme() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mainWindow.webContents.send('app:theme-changed', theme);
  }
}

// ── App Lifecycle ──

app.whenReady().then(() => {
  createMainWindow();

  registerIpcHandlers({
    store,
    fileWatcher,
    getMainWindow,
  });

  buildAndSetMenu({
    getMainWindow,
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
    if (mainWindow) {
      handleMenuOpen(filePath);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  fileWatcher.destroy();
});
