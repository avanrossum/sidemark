import React, { useState, useEffect, useCallback } from 'react';

const { electronAPI } = window;

function FileTreeItem({ entry, depth, onOpenFile }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState([]);

  const toggleExpand = useCallback(async () => {
    if (!entry.isDirectory) {
      onOpenFile(entry.path);
      return;
    }

    if (!expanded) {
      const result = await electronAPI.readDirectory(entry.path);
      if (result.success) setChildren(result.entries);
    }
    setExpanded((v) => !v);
  }, [entry, expanded, onOpenFile]);

  const isMarkdown = !entry.isDirectory && /\.(md|markdown|mdown|mkd|txt)$/i.test(entry.name);

  return (
    <div className="file-tree-item">
      <div
        className={`file-tree-row ${entry.isDirectory ? 'is-directory' : ''} ${isMarkdown ? 'is-markdown' : ''}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={toggleExpand}
        title={entry.path}
      >
        {entry.isDirectory && (
          <svg
            className={`expand-icon ${expanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="currentColor"
          >
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
          </svg>
        )}
        {!entry.isDirectory && <span className="file-icon-spacer" />}
        <span className="file-name">{entry.name}</span>
      </div>
      {expanded && entry.isDirectory && (
        <div className="file-tree-children">
          {children.map((child) => (
            <FileTreeItem
              key={child.path}
              entry={child}
              depth={depth + 1}
              onOpenFile={onOpenFile}
            />
          ))}
          {children.length === 0 && (
            <div className="file-tree-empty" style={{ paddingLeft: `${8 + (depth + 1) * 14}px` }}>
              Empty
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FileBrowser({ folderPath, onOpenFile, onSetFolder, onOpenSettings, width }) {
  const [entries, setEntries] = useState([]);

  const loadDirectory = useCallback(async (dirPath) => {
    if (!dirPath) return;
    const result = await electronAPI.readDirectory(dirPath);
    if (result.success) setEntries(result.entries);
  }, []);

  useEffect(() => {
    if (folderPath) {
      loadDirectory(folderPath);
      electronAPI.watchDirectory(folderPath);
    }
  }, [folderPath, loadDirectory]);

  useEffect(() => {
    const unsub = electronAPI.onDirectoryChanged(() => {
      if (folderPath) loadDirectory(folderPath);
    });
    return unsub;
  }, [folderPath, loadDirectory]);

  const handleOpenFolder = useCallback(async () => {
    const result = await electronAPI.showOpenDialog({ directory: true });
    if (!result.canceled && result.filePaths[0]) {
      onSetFolder(result.filePaths[0]);
    }
  }, [onSetFolder]);

  return (
    <div className="file-browser" style={{ width: `${width}px` }}>
      <div className="file-browser-content">
        {!folderPath ? (
          <div className="file-browser-empty">
            <button className="btn btn-ghost" onClick={handleOpenFolder}>
              Open Folder
            </button>
          </div>
        ) : (
          <div className="file-tree">
            {entries.map((entry) => (
              <FileTreeItem
                key={entry.path}
                entry={entry}
                depth={0}
                onOpenFile={onOpenFile}
              />
            ))}
          </div>
        )}
      </div>
      <div className="file-browser-footer">
        <button
          className="settings-button"
          onClick={onOpenSettings}
          title="Settings"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
