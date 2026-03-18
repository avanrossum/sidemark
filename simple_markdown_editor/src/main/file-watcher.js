const chokidar = require('chokidar');
const path = require('path');
const { TIMING } = require('./constants');

class FileWatcher {
  constructor() {
    this._watchers = new Map(); // filePath -> watcher
    this._dirWatcher = null;
    this._dirPath = null;
    this._onFileChange = null;
    this._onDirChange = null;
    this._debounceTimers = new Map();
  }

  // ── File Watching (open files) ──

  watchFile(filePath, onChange, onDelete) {
    if (this._watchers.has(filePath)) return;

    const watcher = chokidar.watch(filePath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    watcher.on('change', () => {
      this._debounce(filePath, () => onChange(filePath), TIMING.FILE_WATCH_DEBOUNCE_MS);
    });

    if (onDelete) {
      watcher.on('unlink', () => {
        this._debounce(`${filePath}:unlink`, () => onDelete(filePath), TIMING.FILE_WATCH_DEBOUNCE_MS);
      });
    }

    watcher.on('error', (err) => {
      console.error('File watcher error:', err.message);
    });

    this._watchers.set(filePath, watcher);
  }

  unwatchFile(filePath) {
    const watcher = this._watchers.get(filePath);
    if (watcher) {
      watcher.close();
      this._watchers.delete(filePath);
    }
    if (this._debounceTimers.has(filePath)) {
      clearTimeout(this._debounceTimers.get(filePath));
      this._debounceTimers.delete(filePath);
    }
  }

  // ── Directory Watching (file browser) ──

  watchDirectory(dirPath, callback) {
    this.unwatchDirectory();
    this._dirPath = dirPath;
    this._onDirChange = callback;

    this._dirWatcher = chokidar.watch(dirPath, {
      persistent: true,
      ignoreInitial: true,
      depth: 2,
      ignored: [
        /(^|[/\\])\../, // dotfiles
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/dist-renderer/**',
        '**/build/**',
        // System directories (avoid permission errors on macOS)
        /^\/dev(\/|$)/,
        /^\/System(\/|$)/,
        /^\/Volumes(\/|$)/,
        /^\/private\/(var|tmp)(\/|$)/,
        /^\/proc(\/|$)/,
        /^\/sys(\/|$)/,
      ],
      usePolling: false,
      ignorePermissionErrors: true,
    });

    const debouncedCallback = () => {
      this._debounce('__dir__', () => callback(dirPath), TIMING.FILE_WATCH_DEBOUNCE_MS);
    };

    this._dirWatcher.on('add', debouncedCallback);
    this._dirWatcher.on('unlink', debouncedCallback);
    this._dirWatcher.on('addDir', debouncedCallback);
    this._dirWatcher.on('unlinkDir', debouncedCallback);
    this._dirWatcher.on('error', (err) => {
      // Silently ignore permission/access and resource limit errors
      if (err.code === 'EACCES' || err.code === 'EAGAIN' || err.code === 'EMFILE' || err.code === 'ENFILE') return;
      console.error('Directory watcher error:', err.message);
    });
  }

  unwatchDirectory() {
    if (this._dirWatcher) {
      this._dirWatcher.close();
      this._dirWatcher = null;
      this._dirPath = null;
    }
  }

  // ── Cleanup ──

  destroy() {
    for (const [, watcher] of this._watchers) {
      watcher.close();
    }
    this._watchers.clear();
    this.unwatchDirectory();
    for (const [, timer] of this._debounceTimers) {
      clearTimeout(timer);
    }
    this._debounceTimers.clear();
  }

  // ── Internal ──

  _debounce(key, fn, delay) {
    if (this._debounceTimers.has(key)) {
      clearTimeout(this._debounceTimers.get(key));
    }
    this._debounceTimers.set(key, setTimeout(() => {
      this._debounceTimers.delete(key);
      fn();
    }, delay));
  }
}

module.exports = FileWatcher;
