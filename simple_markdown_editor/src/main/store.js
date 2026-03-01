const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { DEFAULT_SETTINGS, TIMING } = require('./constants');

class Store {
  constructor() {
    this._filePath = path.join(app.getPath('userData'), 'settings.json');
    this._data = { settings: { ...DEFAULT_SETTINGS } };
    this._saveTimer = null;
    this._load();
  }

  // ── Settings ──

  getSettings() {
    return { ...this._data.settings };
  }

  getSetting(key) {
    return this._data.settings[key];
  }

  setSetting(key, value) {
    this._data.settings[key] = value;
    this._debouncedSave();
  }

  setSettings(updates) {
    Object.assign(this._data.settings, updates);
    this._debouncedSave();
  }

  // ── Recent Files ──

  addRecentFile(filePath) {
    const recents = this._data.settings.recentFiles || [];
    const filtered = recents.filter((f) => f !== filePath);
    filtered.unshift(filePath);
    this._data.settings.recentFiles = filtered.slice(0, 15);
    this._debouncedSave();
  }

  getRecentFiles() {
    return [...(this._data.settings.recentFiles || [])];
  }

  clearRecentFiles() {
    this._data.settings.recentFiles = [];
    this._debouncedSave();
  }

  // ── Recent Directories ──

  addRecentDirectory(dirPath) {
    const recents = this._data.settings.recentDirectories || [];
    const filtered = recents.filter((d) => d !== dirPath);
    filtered.unshift(dirPath);
    this._data.settings.recentDirectories = filtered.slice(0, 10);
    this._debouncedSave();
  }

  getRecentDirectories() {
    return [...(this._data.settings.recentDirectories || [])];
  }

  // ── Session ──

  getSession() {
    return this._data.session || null;
  }

  setSession(sessionData) {
    this._data.session = sessionData;
    this._debouncedSave();
  }

  // ── Window Bounds ──

  getWindowBounds() {
    return this._data.settings.windowBounds;
  }

  setWindowBounds(bounds) {
    this._data.settings.windowBounds = bounds;
    this._debouncedSave();
  }

  // ── Persistence ──

  _load() {
    try {
      if (fs.existsSync(this._filePath)) {
        const raw = fs.readFileSync(this._filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this._data.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        this._data.session = parsed.session || null;
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      this._data.settings = { ...DEFAULT_SETTINGS };
    }
  }

  _save() {
    try {
      const dir = path.dirname(this._filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this._filePath, JSON.stringify(this._data, null, 2));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  _debouncedSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._save(), TIMING.SAVE_DEBOUNCE_MS);
  }
}

module.exports = Store;
