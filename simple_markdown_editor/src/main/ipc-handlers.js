const { ipcMain, dialog, shell, app, nativeTheme, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

function registerIpcHandlers({ store, fileWatcher, getFocusedWindow }) {

  // Helper: get the window that sent an IPC event
  function getWindowFromEvent(event) {
    return BrowserWindow.fromWebContents(event.sender);
  }

  // Helper: broadcast to all open windows
  function broadcast(channel, ...args) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, ...args);
      }
    }
  }

  // ── File Operations ──

  ipcMain.handle('file:read', async (_, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:write', async (_, filePath, content) => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:read-directory', async (_, dirPath) => {
    try {
      const entries = [];
      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        if (item.name.startsWith('.')) continue;
        if (item.name === 'node_modules') continue;

        entries.push({
          name: item.name,
          path: path.join(dirPath, item.name),
          isDirectory: item.isDirectory(),
        });
      }

      entries.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });

      return { success: true, entries };
    } catch (err) {
      return { success: false, error: err.message, entries: [] };
    }
  });

  ipcMain.handle('file:save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(getWindowFromEvent(event), {
      defaultPath: options?.defaultPath,
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result;
  });

  ipcMain.handle('file:open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(getWindowFromEvent(event), {
      properties: options?.directory ? ['openDirectory'] : ['openFile'],
      filters: options?.directory ? undefined : [
        { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result;
  });

  ipcMain.handle('dialog:message-box', async (event, options) => {
    const result = await dialog.showMessageBox(getWindowFromEvent(event), options);
    return result;
  });

  ipcMain.handle('file:stat', async (_, filePath) => {
    try {
      const stat = fs.statSync(filePath);
      return { success: true, mtime: stat.mtimeMs, size: stat.size };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:exists', async (_, filePath) => {
    return fs.existsSync(filePath);
  });

  ipcMain.handle('file:resolve-path', async (_, ...segments) => {
    return path.resolve(...segments);
  });

  ipcMain.handle('file:basename', async (_, filePath) => {
    return path.basename(filePath);
  });

  ipcMain.handle('file:dirname', async (_, filePath) => {
    return path.dirname(filePath);
  });

  // ── File Management ──

  ipcMain.handle('file:rename', async (_, oldPath, newPath) => {
    try {
      fs.renameSync(oldPath, newPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:mkdir', async (_, dirPath) => {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:create', async (_, filePath, content = '') => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── File Watching ──

  ipcMain.handle('watch:file', async (_, filePath) => {
    fileWatcher.watchFile(filePath, (changedPath) => {
      broadcast('watch:file-changed', changedPath);
    });
    return { success: true };
  });

  ipcMain.handle('watch:unwatch-file', async (_, filePath) => {
    fileWatcher.unwatchFile(filePath);
    return { success: true };
  });

  ipcMain.handle('watch:directory', async (_, dirPath) => {
    fileWatcher.watchDirectory(dirPath, (changedDir) => {
      broadcast('watch:directory-changed', changedDir);
    });
    return { success: true };
  });

  // ── Settings ──

  ipcMain.handle('settings:get', async () => {
    return store.getSettings();
  });

  ipcMain.handle('settings:set', async (_, key, value) => {
    store.setSetting(key, value);
    broadcast('settings:changed', store.getSettings());
    return { success: true };
  });

  ipcMain.handle('settings:set-multiple', async (_, updates) => {
    store.setSettings(updates);
    broadcast('settings:changed', store.getSettings());
    return { success: true };
  });

  ipcMain.handle('settings:close', async () => {
    // no-op for now; settings is inline, not a separate window
    return { success: true };
  });

  // ── Recent Files ──

  ipcMain.handle('recent:get-files', async () => {
    return store.getRecentFiles();
  });

  ipcMain.handle('recent:add-file', async (_, filePath) => {
    store.addRecentFile(filePath);
    return { success: true };
  });

  // ── Session ──

  ipcMain.handle('session:get', async () => {
    return store.getSession();
  });

  ipcMain.handle('session:set', async (_, sessionData) => {
    store.setSession(sessionData);
    return { success: true };
  });

  // ── App Info ──

  ipcMain.handle('app:version', async () => {
    return app.getVersion();
  });

  ipcMain.handle('app:open-external', async (_, url) => {
    await shell.openExternal(url);
    return { success: true };
  });

  ipcMain.handle('app:system-theme', async () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.handle('app:home-dir', async () => {
    return app.getPath('home');
  });

  ipcMain.handle('app:parent-dir', async (_, dirPath) => {
    return path.dirname(dirPath);
  });
}

module.exports = { registerIpcHandlers };
