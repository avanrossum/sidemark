const { ipcMain, dialog, shell, app, nativeTheme } = require('electron');
const fs = require('fs');
const path = require('path');

function registerIpcHandlers({ store, fileWatcher, getMainWindow }) {

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

  ipcMain.handle('file:save-dialog', async (_, options) => {
    const result = await dialog.showSaveDialog(getMainWindow(), {
      defaultPath: options?.defaultPath,
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result;
  });

  ipcMain.handle('file:open-dialog', async (_, options) => {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      properties: options?.directory ? ['openDirectory'] : ['openFile'],
      filters: options?.directory ? undefined : [
        { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result;
  });

  ipcMain.handle('dialog:message-box', async (_, options) => {
    const result = await dialog.showMessageBox(getMainWindow(), options);
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

  // ── File Watching ──

  ipcMain.handle('watch:file', async (_, filePath) => {
    fileWatcher.watchFile(filePath, (changedPath) => {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send('watch:file-changed', changedPath);
      }
    });
    return { success: true };
  });

  ipcMain.handle('watch:unwatch-file', async (_, filePath) => {
    fileWatcher.unwatchFile(filePath);
    return { success: true };
  });

  ipcMain.handle('watch:directory', async (_, dirPath) => {
    fileWatcher.watchDirectory(dirPath, (changedDir) => {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send('watch:directory-changed', changedDir);
      }
    });
    return { success: true };
  });

  // ── Settings ──

  ipcMain.handle('settings:get', async () => {
    return store.getSettings();
  });

  ipcMain.handle('settings:set', async (_, key, value) => {
    store.setSetting(key, value);
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('settings:changed', store.getSettings());
    }
    return { success: true };
  });

  ipcMain.handle('settings:set-multiple', async (_, updates) => {
    store.setSettings(updates);
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('settings:changed', store.getSettings());
    }
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
