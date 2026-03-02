import React, { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const { updateAPI } = window;

// Configure marked for safe output
marked.setOptions({ breaks: true, gfm: true });

// ── Title Map ──
const TITLES = {
  'update-available': 'Update Available',
  'update-downloaded': 'Update Ready to Install',
  'whats-new': "What's New",
};

// ── Component ──
export default function UpdateDialog() {
  const [data, setData] = useState(null);
  const [downloadPercent, setDownloadPercent] = useState(null);

  // Fetch init data from main process
  useEffect(() => {
    async function init() {
      const initData = await updateAPI.getInitData();
      if (initData) {
        setData(initData);
        if (initData.theme) {
          document.documentElement.dataset.theme = initData.theme;
        }
      }
    }
    init();
  }, []);

  // Listen for download progress
  useEffect(() => {
    const cleanup = updateAPI.onDownloadProgress((percent) => {
      setDownloadPercent(percent);
    });
    return cleanup;
  }, []);

  // Listen for theme changes
  useEffect(() => {
    const cleanup = updateAPI.onThemeChanged((theme) => {
      document.documentElement.dataset.theme = theme;
    });
    return cleanup;
  }, []);

  // Parse and sanitize release notes
  const safeHtml = useMemo(() => {
    if (!data?.releaseNotes) return '';
    const raw = data.releaseNotes.trim();
    const html = raw.startsWith('<') ? raw : marked.parse(raw);
    return DOMPurify.sanitize(html);
  }, [data?.releaseNotes]);

  if (!data) return null;

  const { mode, currentVersion, newVersion } = data;

  return (
    <div className="update-container">
      <div className="update-drag" />
      <div className="update-title">{TITLES[mode] || 'Update'}</div>
      <div className="update-version">
        {mode === 'whats-new'
          ? `v${currentVersion}`
          : `v${currentVersion} → v${newVersion}`}
      </div>

      {safeHtml && (
        <div
          className="update-notes"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      )}

      {mode === 'update-available' && downloadPercent !== null && (
        <div className="update-progress">
          <div className="update-progress-label">Downloading update...</div>
          <div className="update-progress-track">
            <div
              className="update-progress-fill"
              style={{ width: `${downloadPercent}%` }}
            />
          </div>
          <div className="update-progress-pct">{downloadPercent}%</div>
        </div>
      )}

      <div className="update-actions">
        {mode === 'update-available' && downloadPercent === null && (
          <>
            <button className="btn" onClick={() => updateAPI.close()}>
              Later
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setDownloadPercent(0);
                updateAPI.downloadUpdate();
              }}
            >
              Download Update
            </button>
          </>
        )}
        {mode === 'update-downloaded' && (
          <>
            <button className="btn" onClick={() => updateAPI.close()}>
              Later
            </button>
            <button
              className="btn btn-primary"
              onClick={() => updateAPI.restartForUpdate()}
            >
              Restart & Install
            </button>
          </>
        )}
        {mode === 'whats-new' && (
          <button className="btn btn-primary" onClick={() => updateAPI.close()}>
            Got it
          </button>
        )}
      </div>
    </div>
  );
}
