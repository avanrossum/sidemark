import React, { useState, useEffect } from 'react';

const { electronAPI } = window;

const ACCENT_COLORS = ['blue', 'purple', 'pink', 'red', 'orange', 'green', 'amber'];

const FONT_OPTIONS = [
  { value: 'default', label: 'Default (SF Mono)' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { value: "'Source Code Pro', monospace", label: 'Source Code Pro' },
  { value: "'Cascadia Code', monospace", label: 'Cascadia Code' },
  { value: "'IBM Plex Mono', monospace", label: 'IBM Plex Mono' },
];

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
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
            >
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="settings-row">
            <label>Accent Color</label>
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
            <label>Font Size</label>
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
            <label>Font Family</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSetting('fontFamily', e.target.value)}
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="settings-row">
            <label>Word Wrap</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.editorWordWrap}
                onChange={(e) => updateSetting('editorWordWrap', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <label>Line Numbers</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.showLineNumbers}
                onChange={(e) => updateSetting('showLineNumbers', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <label>Spell Check</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.spellCheck}
                onChange={(e) => updateSetting('spellCheck', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* ── About ── */}
        <div className="settings-section">
          <div className="settings-section-title">About</div>

          <div className="settings-row">
            <div>
              <label>Simple Markdown Editor</label>
              <div className="hint">v{version || '0.1.0'}</div>
            </div>
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
              onClick={() => electronAPI.openExternal('https://github.com/avanrossum/simple-markdown-editor')}
            >
              GitHub
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
