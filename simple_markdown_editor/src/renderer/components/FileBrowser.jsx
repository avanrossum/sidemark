import React, { useState, useEffect, useCallback } from 'react';

const { electronAPI } = window;

const MD_EXTENSIONS = /\.(md|markdown|mdown|mkd|txt)$/i;

function FileTreeItem({ entry, depth, onOpenFile, onSetRoot, refreshKey }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState([]);

  // Re-fetch children when refreshKey changes and directory is expanded
  useEffect(() => {
    if (expanded && entry.isDirectory) {
      electronAPI.readDirectory(entry.path).then((result) => {
        if (result.success) setChildren(result.entries);
      });
    }
  }, [refreshKey, expanded, entry.path, entry.isDirectory]);

  const handleClick = useCallback(async () => {
    if (!entry.isDirectory) {
      // Only open markdown files
      if (MD_EXTENSIONS.test(entry.name)) {
        onOpenFile(entry.path);
      }
      return;
    }
    // Single click: toggle expand
    if (!expanded) {
      const result = await electronAPI.readDirectory(entry.path);
      if (result.success) setChildren(result.entries);
    }
    setExpanded((v) => !v);
  }, [entry, expanded, onOpenFile]);

  const handleDoubleClick = useCallback((e) => {
    if (entry.isDirectory) {
      e.stopPropagation();
      onSetRoot(entry.path);
    }
  }, [entry, onSetRoot]);

  const isMarkdown = !entry.isDirectory && MD_EXTENSIONS.test(entry.name);
  const isNonMarkdownFile = !entry.isDirectory && !isMarkdown;

  return (
    <div className="file-tree-item">
      <div
        className={`file-tree-row ${entry.isDirectory ? 'is-directory' : ''} ${isMarkdown ? 'is-markdown' : ''} ${isNonMarkdownFile ? 'is-non-markdown' : ''}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
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
              onSetRoot={onSetRoot}
              refreshKey={refreshKey}
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

function truncatePath(fullPath, homeDir) {
  if (homeDir && fullPath.startsWith(homeDir)) {
    return '~' + fullPath.slice(homeDir.length);
  }
  return fullPath;
}

export default function FileBrowser({ folderPath, onOpenFile, onSetFolder, onOpenSettings, width }) {
  const [entries, setEntries] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [homeDir, setHomeDir] = useState(null);

  // Get home directory on mount and default to it if no folder is set
  useEffect(() => {
    electronAPI.getHomeDir().then((dir) => {
      setHomeDir(dir);
      if (!folderPath) {
        onSetFolder(dir);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (folderPath) {
        loadDirectory(folderPath);
        setRefreshKey((k) => k + 1);
      }
    });
    return unsub;
  }, [folderPath, loadDirectory]);

  const handleOpenFolder = useCallback(async () => {
    const result = await electronAPI.showOpenDialog({ directory: true });
    if (!result.canceled && result.filePaths[0]) {
      onSetFolder(result.filePaths[0]);
    }
  }, [onSetFolder]);

  const handleGoUp = useCallback(async () => {
    if (!folderPath) return;
    const parent = await electronAPI.getParentDir(folderPath);
    if (parent && parent !== folderPath) {
      onSetFolder(parent);
    }
  }, [folderPath, onSetFolder]);

  const displayPath = folderPath ? truncatePath(folderPath, homeDir) : '';

  return (
    <div className="file-browser" style={{ width: `${width}px` }}>
      {/* Path navigation header */}
      {folderPath && (
        <div className="file-browser-header">
          <button
            className="file-browser-back-btn"
            onClick={handleGoUp}
            title="Go to parent directory"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <span className="file-browser-path" title={folderPath}>
            {displayPath}
          </span>
          <button
            className="file-browser-open-btn"
            onClick={handleOpenFolder}
            title="Open folder"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>
          </button>
        </div>
      )}

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
                onSetRoot={onSetFolder}
                refreshKey={refreshKey}
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
