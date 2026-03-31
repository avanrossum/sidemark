import React, { useState, useEffect, useCallback } from 'react';

const { electronAPI } = window;

// ── Hotkey Recorder ──
// Captures a keyboard shortcut when focused, displays it as an Electron accelerator string.

const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Alt', 'Shift']);
const KEY_DISPLAY = { Meta: '\u2318', Control: 'Ctrl', Alt: '\u2325', Shift: '\u21E7' };

function keyEventToAccelerator(e) {
  const parts = [];
  if (e.metaKey) parts.push('CmdOrCtrl');
  else if (e.ctrlKey) parts.push('CmdOrCtrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  if (MODIFIER_KEYS.has(e.key)) return null; // Modifier only — wait for a real key

  let key = e.key;
  if (key === ' ') key = 'Space';
  else if (key.length === 1) key = key.toUpperCase();
  else if (key === 'ArrowUp') key = 'Up';
  else if (key === 'ArrowDown') key = 'Down';
  else if (key === 'ArrowLeft') key = 'Left';
  else if (key === 'ArrowRight') key = 'Right';

  if (parts.length === 0) return null; // Require at least one modifier
  parts.push(key);
  return parts.join('+');
}

// Detect macOS via navigator (process not available in sandboxed renderer)
const isMac = navigator.platform?.startsWith('Mac') || navigator.userAgent?.includes('Mac');

function formatAccelerator(accel) {
  if (!accel) return '';
  return accel
    .replace('CmdOrCtrl', isMac ? '\u2318' : 'Ctrl')
    .replace(/\+/g, ' + ');
}

function HotkeyRecorder({ value, onChange }) {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const accel = keyEventToAccelerator(e);
    if (accel) {
      onChange(accel);
      setRecording(false);
    }
  }, [onChange]);

  const handleBlur = useCallback(() => setRecording(false), []);

  return (
    <button
      className={`hotkey-recorder ${recording ? 'recording' : ''}`}
      onClick={() => setRecording(true)}
      onKeyDown={recording ? handleKeyDown : undefined}
      onBlur={handleBlur}
    >
      {recording ? 'Press shortcut...' : (formatAccelerator(value) || 'Click to set')}
    </button>
  );
}

const ACCENT_COLORS = ['blue', 'purple', 'pink', 'red', 'orange', 'amber', 'green'];

const EDITOR_FONT_OPTIONS = [
  { value: 'default', label: 'SF Mono (Default)' },
  { value: "'Menlo', monospace", label: 'Menlo' },
  { value: "'Monaco', monospace", label: 'Monaco' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: "'Andale Mono', monospace", label: 'Andale Mono' },
];

const PREVIEW_FONT_OPTIONS = [
  { value: 'default', label: 'System (Default)' },
  { value: "'Helvetica Neue', Helvetica, sans-serif", label: 'Helvetica Neue' },
  { value: "'Georgia', serif", label: 'Georgia' },
  { value: "'Palatino', 'Palatino Linotype', serif", label: 'Palatino' },
  { value: "'Avenir Next', 'Avenir', sans-serif", label: 'Avenir Next' },
  { value: "'Charter', serif", label: 'Charter' },
];

const THEME_OPTIONS = ['dark', 'light', 'system'];

export default function Settings({ settings: initialSettings, onClose }) {
  const [settings, setSettings] = useState(initialSettings);
  const [version, setVersion] = useState('');

  useEffect(() => {
    electronAPI.getVersion().then(setVersion);
  }, []);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    electronAPI.setSetting(key, value);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>

        {/* ── Appearance ── */}
        <div className="settings-section">
          <div className="settings-section-title">Appearance</div>

          <div className="settings-row">
            <label>Theme</label>
            <div className="segmented-control">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t}
                  className={`segmented-option ${settings.theme === t ? 'active' : ''}`}
                  onClick={() => updateSetting('theme', t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <label>Accent color</label>
            <div className="accent-picker">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color}
                  className={`accent-swatch ${settings.accentColor === color ? 'active' : ''}`}
                  data-color={color}
                  onClick={() => updateSetting('accentColor', color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Editor ── */}
        <div className="settings-section">
          <div className="settings-section-title">Editor</div>

          <div className="settings-row">
            <label>Font size</label>
            <select
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
            >
              {[11, 12, 13, 14, 15, 16, 18, 20].map((size) => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </div>

          <div className="settings-row">
            <label>Editor font</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSetting('fontFamily', e.target.value)}
            >
              {EDITOR_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="settings-row">
            <label>Preview font</label>
            <select
              value={settings.previewFontFamily || 'default'}
              onChange={(e) => updateSetting('previewFontFamily', e.target.value)}
            >
              {PREVIEW_FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="settings-row">
            <label>Line numbers</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.showLineNumbers}
                onChange={(e) => updateSetting('showLineNumbers', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

        </div>

        {/* ── File Browser ── */}
        <div className="settings-section">
          <div className="settings-section-title">File Browser</div>

          <div className="settings-row">
            <label>Show dates</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.showFileDates || false}
                onChange={(e) => updateSetting('showFileDates', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* ── Saving ── */}
        <div className="settings-section">
          <div className="settings-section-title">Saving</div>

          <div className="settings-row">
            <label>Auto-save</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.autoSave || false}
                onChange={(e) => updateSetting('autoSave', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {settings.autoSave && (
            <div className="settings-row">
              <label>Save delay</label>
              <select
                value={settings.autoSaveDelay || 5000}
                onChange={(e) => updateSetting('autoSaveDelay', Number(e.target.value))}
              >
                <option value={1000}>1 second</option>
                <option value={2000}>2 seconds</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
              </select>
            </div>
          )}
        </div>

        {/* ── Global Hotkeys ── */}
        <div className="settings-section">
          <div className="settings-section-title">Global Hotkeys</div>

          <div className="settings-row">
            <div>
              <label>Enable system-wide hotkeys</label>
              <div className="hint">Work even when SideMark is not focused</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.globalHotkeysEnabled || false}
                onChange={(e) => updateSetting('globalHotkeysEnabled', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {settings.globalHotkeysEnabled && (
            <div className="settings-row">
              <label>Open from Path</label>
              <HotkeyRecorder
                value={settings.globalHotkeyOpenPath || ''}
                onChange={(accel) => updateSetting('globalHotkeyOpenPath', accel)}
              />
            </div>
          )}
        </div>

        {/* ── About ── */}
        <div className="settings-section">
          <div className="settings-section-title">About</div>

          <div className="settings-row">
            <div>
              <label>SideMark</label>
              <div className="hint">v{version || '0.1.0'}</div>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <label>Beta updates</label>
              <div className="hint">Receive pre-release updates</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.betaUpdates || false}
                onChange={(e) => updateSetting('betaUpdates', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <button
              className="btn btn-ghost"
              onClick={() => electronAPI.openExternal('https://mipyip.com')}
            >
              mipyip.com
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => electronAPI.openExternal('https://github.com/avanrossum/sidemark')}
            >
              GitHub
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => electronAPI.checkForUpdates()}
            >
              Check for Updates
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
