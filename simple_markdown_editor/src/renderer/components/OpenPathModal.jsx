import React, { useState, useRef, useEffect } from 'react';

const { electronAPI } = window;

export default function OpenPathModal({ folderPath, onOpenFile, onOpenFolder, onClose }) {
  const [inputPath, setInputPath] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Resolve and Open ──

  const resolve = async (openInNewWindow = false) => {
    const trimmed = inputPath.trim();
    if (!trimmed) return;

    setError(null);
    setLoading(true);

    const result = await electronAPI.resolvePath(trimmed, folderPath);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.isDirectory) {
      onOpenFolder(result.resolvedPath);
      onClose();
    } else if (result.isFile) {
      onOpenFile(result.resolvedPath);
      onClose();
    } else {
      setError('Path is neither a file nor a directory');
    }
  };

  // ── Keyboard ──

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      resolve();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal open-path-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Open from Path</h2>

        <input
          ref={inputRef}
          className="open-path-input"
          type="text"
          placeholder="~/Documents/notes.md or relative/path.md"
          value={inputPath}
          onChange={(e) => { setInputPath(e.target.value); setError(null); }}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />

        {error && <div className="open-path-error">{error}</div>}

        <div className="open-path-buttons">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => resolve()}
            disabled={!inputPath.trim() || loading}
          >
            {loading ? 'Opening...' : 'Open'}
          </button>
        </div>
      </div>
    </div>
  );
}
