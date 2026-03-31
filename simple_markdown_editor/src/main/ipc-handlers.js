const { ipcMain, dialog, shell, app, nativeTheme, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// ── Path Validation ──
// Defense-in-depth: restrict file operations to safe directories.
// Prevents a compromised renderer from accessing sensitive files.

const homeDir = os.homedir();

const BLOCKED_HOME_SUBDIRS = [
  '.ssh', '.gnupg', '.gpg', '.aws', '.docker', '.kube',
  '.config/gcloud', '.config/gh',
].map((p) => path.join(homeDir, p));

function isPathAllowed(targetPath) {
  if (typeof targetPath !== 'string' || !targetPath) return false;
  const resolved = path.resolve(targetPath);

  // Must be under home directory or /Volumes (external drives)
  const underHome = resolved === homeDir || resolved.startsWith(homeDir + '/');
  const underVolumes = resolved.startsWith('/Volumes/');
  if (!underHome && !underVolumes) return false;

  // Block sensitive subdirectories under home
  if (underHome) {
    for (const blocked of BLOCKED_HOME_SUBDIRS) {
      if (resolved === blocked || resolved.startsWith(blocked + '/')) return false;
    }
  }

  return true;
}

function requireValidPath(filePath) {
  if (!isPathAllowed(filePath)) {
    throw new Error(`Access denied: ${filePath}`);
  }
}

function registerIpcHandlers({ store, fileWatcher, getFocusedWindow, globalShortcuts, autoUpdater }) {

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
      requireValidPath(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:write', async (_, filePath, content) => {
    try {
      requireValidPath(filePath);
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
      requireValidPath(dirPath);
      const entries = [];
      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        if (item.name.startsWith('.')) continue;
        if (item.name === 'node_modules') continue;

        const fullPath = path.join(dirPath, item.name);
        let mtime = null;
        let birthtime = null;
        try {
          const stat = fs.statSync(fullPath);
          mtime = stat.mtimeMs;
          birthtime = stat.birthtimeMs;
        } catch (_) { /* skip stat errors */ }

        entries.push({
          name: item.name,
          path: fullPath,
          isDirectory: item.isDirectory(),
          mtime,
          birthtime,
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
      requireValidPath(filePath);
      const stat = fs.statSync(filePath);
      return { success: true, mtime: stat.mtimeMs, size: stat.size };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:exists', async (_, filePath) => {
    if (!isPathAllowed(filePath)) return false;
    return fs.existsSync(filePath);
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
      requireValidPath(oldPath);
      requireValidPath(newPath);
      fs.renameSync(oldPath, newPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:mkdir', async (_, dirPath) => {
    try {
      requireValidPath(dirPath);
      fs.mkdirSync(dirPath, { recursive: true });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:create', async (_, filePath, content = '') => {
    try {
      requireValidPath(filePath);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:trash', async (_, filePath) => {
    try {
      requireValidPath(filePath);
      await shell.trashItem(filePath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:show-in-folder', async (_, filePath) => {
    requireValidPath(filePath);
    shell.showItemInFolder(filePath);
    return { success: true };
  });

  ipcMain.handle('dialog:confirm', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showMessageBox(win, {
      type: 'question',
      message: options.message || 'Are you sure?',
      detail: options.detail || '',
      buttons: options.buttons || ['OK', 'Cancel'],
      defaultId: options.defaultId ?? 0,
      cancelId: options.cancelId ?? 1,
    });
    return result.response;
  });

  // ── Path Resolution ──

  ipcMain.handle('file:resolve-path', async (_, inputPath, cwd) => {
    try {
      if (!inputPath || typeof inputPath !== 'string') {
        return { success: false, error: 'No path provided' };
      }

      // Expand ~ to home directory
      let resolved = inputPath.trim();
      if (resolved.startsWith('~/') || resolved === '~') {
        resolved = path.join(homeDir, resolved.slice(1));
      }

      // Resolve relative paths against cwd (or home)
      if (!path.isAbsolute(resolved)) {
        resolved = path.resolve(cwd || homeDir, resolved);
      }

      requireValidPath(resolved);

      if (!fs.existsSync(resolved)) {
        return { success: false, error: 'Path does not exist' };
      }

      const stat = fs.statSync(resolved);
      return {
        success: true,
        resolvedPath: resolved,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Search in Folder ──

  const SEARCH_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.mkd', '.mkdn', '.mdwn', '.mdx', '.txt']);
  const SEARCH_IGNORED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'dist-renderer', '.DS_Store']);

  ipcMain.handle('file:search-in-folder', async (_, folderPath, searchTerm, options = {}) => {
    try {
      requireValidPath(folderPath);
      if (!searchTerm || typeof searchTerm !== 'string') {
        return { success: true, results: [], fileMatches: [], stats: { filesScanned: 0, matchCount: 0, capped: false } };
      }

      const maxDepth = options.maxDepth || 10;
      const maxFiles = options.maxFiles || 5000;
      const maxResults = options.maxResults || 1000;
      const caseSensitive = options.caseSensitive || false;

      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(escaped, flags);
      const nameRegex = new RegExp(escaped, caseSensitive ? '' : 'i');

      const results = [];
      const fileMatches = [];
      let filesScanned = 0;
      let capped = false;

      function walk(dir, depth) {
        if (depth > maxDepth || filesScanned >= maxFiles || results.length >= maxResults) {
          capped = true;
          return;
        }

        let items;
        try {
          items = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return; // Permission error or similar
        }

        for (const item of items) {
          if (filesScanned >= maxFiles || results.length >= maxResults) {
            capped = true;
            return;
          }

          if (item.name.startsWith('.') || SEARCH_IGNORED_DIRS.has(item.name)) continue;

          const fullPath = path.join(dir, item.name);

          if (item.isDirectory()) {
            walk(fullPath, depth + 1);
            continue;
          }

          const ext = path.extname(item.name).toLowerCase();
          if (!SEARCH_EXTENSIONS.has(ext)) continue;

          filesScanned++;

          // Check filename match
          if (nameRegex.test(item.name)) {
            fileMatches.push({ filePath: fullPath, fileName: item.name });
          }

          // Search file content
          let content;
          try {
            content = fs.readFileSync(fullPath, 'utf-8');
          } catch {
            continue;
          }

          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (results.length >= maxResults) {
              capped = true;
              break;
            }
            regex.lastIndex = 0;
            if (regex.test(lines[i])) {
              results.push({
                filePath: fullPath,
                fileName: item.name,
                lineNumber: i + 1,
                lineText: lines[i].slice(0, 300), // Truncate long lines
              });
            }
          }
        }
      }

      walk(folderPath, 0);

      return {
        success: true,
        results,
        fileMatches,
        stats: { filesScanned, matchCount: results.length, capped },
      };
    } catch (err) {
      return { success: false, error: err.message, results: [], fileMatches: [], stats: { filesScanned: 0, matchCount: 0, capped: false } };
    }
  });

  // ── File Watching ──

  ipcMain.handle('watch:file', async (_, filePath) => {
    requireValidPath(filePath);
    fileWatcher.watchFile(
      filePath,
      (changedPath) => broadcast('watch:file-changed', changedPath),
      (deletedPath) => broadcast('watch:file-deleted', deletedPath),
    );
    return { success: true };
  });

  ipcMain.handle('watch:unwatch-file', async (_, filePath) => {
    requireValidPath(filePath);
    fileWatcher.unwatchFile(filePath);
    return { success: true };
  });

  ipcMain.handle('watch:directory', async (_, dirPath) => {
    requireValidPath(dirPath);
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
    // Refresh global shortcuts if a hotkey-related setting changed
    if (key === 'globalHotkeysEnabled' || key === 'globalHotkeyOpenPath') {
      globalShortcuts.refresh();
    }
    if (key === 'betaUpdates') {
      autoUpdater.allowPrerelease = value || app.getVersion().includes('-');
    }
    return { success: true };
  });

  ipcMain.handle('settings:set-multiple', async (_, updates) => {
    store.setSettings(updates);
    broadcast('settings:changed', store.getSettings());
    if ('globalHotkeysEnabled' in updates || 'globalHotkeyOpenPath' in updates) {
      globalShortcuts.refresh();
    }
    if ('betaUpdates' in updates) {
      autoUpdater.allowPrerelease = updates.betaUpdates || app.getVersion().includes('-');
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

  // ── Session (per-window) ──

  ipcMain.handle('session:get', async (_, windowId) => {
    return store.getWindowSession(windowId);
  });

  ipcMain.handle('session:set', async (_, windowId, sessionData) => {
    store.setWindowSession(windowId, sessionData);
    return { success: true };
  });

  // ── Export ──

  // Shared: build a standalone HTML document from rendered markdown HTML
  function buildExportHtml(htmlBody, title) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #1a1d23;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 24px;
  }
  h1 { font-size: 1.8em; font-weight: 700; margin: 0 0 0.6em; padding-bottom: 0.3em; border-bottom: 1px solid #e0e0e0; }
  h2 { font-size: 1.4em; font-weight: 600; margin: 1.2em 0 0.4em; padding-bottom: 0.2em; border-bottom: 1px solid #e0e0e0; }
  h3 { font-size: 1.15em; font-weight: 600; margin: 1em 0 0.4em; }
  h4, h5, h6 { font-size: 1em; font-weight: 600; margin: 0.8em 0 0.3em; }
  p { margin: 0 0 0.8em; }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }
  strong { font-weight: 600; }
  em { font-style: italic; }
  code { font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace; font-size: 0.9em; background: #f0f0f2; padding: 2px 5px; border-radius: 3px; }
  pre { background: #f5f5f7; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; overflow-x: auto; margin: 0 0 1em; }
  pre code { background: none; padding: 0; font-size: 13px; line-height: 1.5; }
  blockquote { border-left: 3px solid #2563eb; padding-left: 12px; margin: 0 0 1em; color: #6b7280; font-style: italic; }
  ul, ol { margin: 0 0 1em; padding-left: 1.5em; }
  li { margin-bottom: 0.3em; }
  hr { border: none; border-top: 1px solid #e0e0e0; margin: 1.5em 0; }
  img { max-width: 100%; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 1em; }
  th, td { border: 1px solid #e0e0e0; padding: 6px 8px; text-align: left; }
  th { background: #f5f5f7; font-weight: 600; }
  input[type="checkbox"] { margin-right: 6px; }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;
  }

  ipcMain.handle('file:export-html', async (event, htmlBody, defaultName) => {
    try {
      const result = await dialog.showSaveDialog(getWindowFromEvent(event), {
        defaultPath: defaultName ? defaultName.replace(/\.[^.]+$/, '.html') : 'export.html',
        filters: [{ name: 'HTML', extensions: ['html'] }],
      });
      if (result.canceled || !result.filePath) return { success: false, canceled: true };

      requireValidPath(result.filePath);
      const title = path.basename(result.filePath, '.html');
      const fullHtml = buildExportHtml(htmlBody, title);
      fs.writeFileSync(result.filePath, fullHtml, 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:export-pdf', async (event, htmlBody, defaultName) => {
    try {
      const result = await dialog.showSaveDialog(getWindowFromEvent(event), {
        defaultPath: defaultName ? defaultName.replace(/\.[^.]+$/, '.pdf') : 'export.pdf',
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (result.canceled || !result.filePath) return { success: false, canceled: true };

      requireValidPath(result.filePath);
      const title = path.basename(result.filePath, '.pdf');
      const fullHtml = buildExportHtml(htmlBody, title);

      // Create hidden window to render HTML for PDF
      const pdfWin = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: { offscreen: true },
      });

      await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

      const pdfBuffer = await pdfWin.webContents.printToPDF({
        printBackground: true,
        margins: { marginType: 'default' },
      });

      pdfWin.destroy();
      fs.writeFileSync(result.filePath, pdfBuffer);
      return { success: true, filePath: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── App Info ──

  ipcMain.handle('app:version', async () => {
    return app.getVersion();
  });

  ipcMain.handle('app:open-external', async (_, url) => {
    // Only allow safe URL schemes
    try {
      const parsed = new URL(url);
      const allowed = ['https:', 'http:', 'mailto:'];
      if (!allowed.includes(parsed.protocol)) {
        return { success: false, error: `Blocked URL scheme: ${parsed.protocol}` };
      }
    } catch {
      return { success: false, error: 'Invalid URL' };
    }
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

  // ── Git ──

  ipcMain.handle('git:get-baseline', async (_, filePath) => {
    try {
      requireValidPath(filePath);
      const dir = path.dirname(filePath);

      const { stdout: repoRoot } = await execFileAsync(
        'git', ['rev-parse', '--show-toplevel'],
        { cwd: dir, timeout: 5000 }
      );
      const root = repoRoot.trim();
      const relativePath = path.relative(root, filePath);

      const { stdout: baseline } = await execFileAsync(
        'git', ['show', `HEAD:${relativePath}`],
        { cwd: root, timeout: 5000, maxBuffer: 10 * 1024 * 1024 }
      );

      return { success: true, content: baseline, repoRoot: root };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { registerIpcHandlers };
