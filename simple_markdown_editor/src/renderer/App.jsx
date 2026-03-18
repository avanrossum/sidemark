import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPatch, applyPatch } from 'diff';
import TabBar from './components/TabBar';
import FileBrowser from './components/FileBrowser';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Toolbar from './components/Toolbar';
import SearchReplace from './components/SearchReplace';
import DiffView from './components/DiffView';
import PreviewHeader from './components/PreviewHeader';
import FindInFolder from './components/FindInFolder';
import Settings from '../settings/Settings';

const { electronAPI } = window;

// ── Window Identity (from URL query params) ──
const urlParams = new URLSearchParams(window.location.search);
const WINDOW_ID = urlParams.get('windowId') || '0';
const IS_FRESH_WINDOW = urlParams.get('fresh') === 'true';
const IS_FOCUS_MODE = urlParams.get('mode') === 'focus';
const FOCUS_FILE_PATH = IS_FOCUS_MODE ? decodeURIComponent(urlParams.get('filePath') || '') : null;
const FOCUS_TAB_ID = IS_FOCUS_MODE ? urlParams.get('tabId') : null;

// ── Tab Helpers ──

let tabIdCounter = 1;

function createTab(filePath = null, content = '') {
  return {
    id: tabIdCounter++,
    filePath,
    name: filePath ? null : 'Untitled', // null = derive from filePath
    content,
    savedContent: content,
    lastKnownMtime: null,
  };
}

export default function App() {
  const [tabs, setTabs] = useState(null); // null = loading session
  const [activeTabId, setActiveTabId] = useState(null);
  const [folderPath, setFolderPath] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState(null);
  const [findInFolderPath, setFindInFolderPath] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [diffData, setDiffData] = useState(null);
  const [focusTabIds, setFocusTabIds] = useState(new Set());
  const [theme, setTheme] = useState('dark');
  const [fileBrowserWidth, setFileBrowserWidth] = useState(180);
  const [editorSplit, setEditorSplit] = useState(0.5);
  const editorRef = useRef(null);
  const sessionRestoredRef = useRef(false);
  const mainContentRef = useRef(null);
  const dragTypeRef = useRef(null);
  const fileBrowserWidthRef = useRef(fileBrowserWidth);
  const editorSplitRef = useRef(editorSplit);
  const tabViewStatesRef = useRef(new Map()); // Map<tabId, {scrollTop}>

  const activeTab = tabs?.find((t) => t.id === activeTabId) || tabs?.[0];

  // ── Tab View State (scroll + cursor) ──

  const saveCurrentTabViewState = useCallback(() => {
    if (activeTabId && editorRef.current) {
      const scrollInfo = editorRef.current.getScrollInfo();
      tabViewStatesRef.current.set(activeTabId, {
        scrollTop: scrollInfo.scrollTop,
      });
    }
  }, [activeTabId]);

  const switchTab = useCallback((newTabId) => {
    if (newTabId === activeTabId) return;
    saveCurrentTabViewState();
    setActiveTabId(newTabId);
  }, [activeTabId, saveCurrentTabViewState]);

  // ── Load Settings ──

  useEffect(() => {
    electronAPI.getSettings().then((s) => {
      setSettings(s);
      applyTheme(s.theme);
      if (s.fileBrowserWidth) setFileBrowserWidth(s.fileBrowserWidth);
      if (s.editorSplit != null) setEditorSplit(s.editorSplit);
    });

    const unsub = electronAPI.onSettingsChanged((s) => {
      setSettings(s);
      applyTheme(s.theme);
      // Sync resize state from other windows (only when not actively dragging)
      if (!dragTypeRef.current) {
        if (s.fileBrowserWidth) setFileBrowserWidth(s.fileBrowserWidth);
        if (s.editorSplit != null) setEditorSplit(s.editorSplit);
      }
    });
    return unsub;
  }, []);

  // ── Session Restore ──

  useEffect(() => {
    // Focus mode — load single file, no session
    if (IS_FOCUS_MODE && FOCUS_FILE_PATH) {
      (async () => {
        const result = await electronAPI.readFile(FOCUS_FILE_PATH);
        const content = result.success ? result.content : '';
        const tab = createTab(FOCUS_FILE_PATH, content);
        tab.savedContent = content;
        setTabs([tab]);
        setActiveTabId(tab.id);
        electronAPI.watchFile(FOCUS_FILE_PATH);
        sessionRestoredRef.current = true;
      })();
      return;
    }

    // Fresh windows (Cmd+Shift+N) skip session restore
    if (IS_FRESH_WINDOW) {
      setTabs([createTab()]);
      setActiveTabId(1);
      sessionRestoredRef.current = true;
      return;
    }

    let cancelled = false;

    (async () => {
      const session = await electronAPI.getSession(WINDOW_ID);
      if (cancelled) return;

      let restoredTabs = [];

      if (session?.openFiles?.length > 0) {
        for (const filePath of session.openFiles) {
          const exists = await electronAPI.fileExists(filePath);
          if (!exists) continue;
          const result = await electronAPI.readFile(filePath);
          if (!result.success) continue;
          const stat = await electronAPI.getFileStat(filePath);
          const tab = createTab(filePath, result.content);
          tab.savedContent = result.content;
          tab.lastKnownMtime = stat.success ? stat.mtime : null;
          restoredTabs.push(tab);
          electronAPI.watchFile(filePath);
        }
      }

      if (restoredTabs.length === 0) {
        restoredTabs = [createTab()];
      }

      if (cancelled) return;

      setTabs(restoredTabs);

      const activeFile = session?.activeFile;
      const activeRestoredTab = restoredTabs.find((t) => t.filePath === activeFile);
      setActiveTabId(activeRestoredTab ? activeRestoredTab.id : restoredTabs[0].id);

      if (session?.folderPath) {
        setFolderPath(session.folderPath);
      }

      sessionRestoredRef.current = true;
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Session Save ──

  useEffect(() => {
    if (IS_FOCUS_MODE) return; // Focus windows don't persist sessions
    if (!sessionRestoredRef.current || !tabs) return;

    const timer = setTimeout(() => {
      const openFiles = tabs.filter((t) => t.filePath).map((t) => t.filePath);
      const activeFile = tabs.find((t) => t.id === activeTabId)?.filePath || null;
      electronAPI.setSession(WINDOW_ID, {
        openFiles,
        activeFile,
        folderPath: folderPath || null,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [tabs, activeTabId, folderPath]);

  // ── Restore Tab View State ──

  useEffect(() => {
    if (!activeTabId || !editorRef.current) return;

    const frame = requestAnimationFrame(() => {
      const saved = tabViewStatesRef.current.get(activeTabId);
      if (saved && editorRef.current) {
        editorRef.current.scrollToPixel(saved.scrollTop);
      } else {
        // No saved state (new tab) — scroll to top
        editorRef.current?.scrollToPixel(0);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [activeTabId]);

  // ── Theme ──

  const applyTheme = useCallback(async (themeSetting) => {
    let resolved = themeSetting;
    if (themeSetting === 'system') {
      resolved = await electronAPI.getSystemTheme();
    }
    setTheme(resolved);
    document.documentElement.dataset.theme = resolved;
  }, []);

  useEffect(() => {
    const unsub = electronAPI.onThemeChanged((systemTheme) => {
      if (settings?.theme === 'system') {
        setTheme(systemTheme);
        document.documentElement.dataset.theme = systemTheme;
      }
    });
    return unsub;
  }, [settings?.theme]);

  // Apply accent color
  useEffect(() => {
    if (settings?.accentColor) {
      document.documentElement.dataset.accent = settings.accentColor;
    }
  }, [settings?.accentColor]);

  // Apply editor font settings
  useEffect(() => {
    const root = document.documentElement.style;
    if (settings?.fontSize) {
      root.setProperty('--editor-font-size', `${settings.fontSize}px`);
    }
    if (settings?.fontFamily && settings.fontFamily !== 'default') {
      root.setProperty('--editor-font-family', settings.fontFamily);
    } else {
      root.setProperty('--editor-font-family', "var(--font-mono)");
    }
    if (settings?.previewFontFamily && settings.previewFontFamily !== 'default') {
      root.setProperty('--preview-font-family', settings.previewFontFamily);
    } else {
      root.setProperty('--preview-font-family', "var(--font-system)");
    }
  }, [settings?.fontSize, settings?.fontFamily, settings?.previewFontFamily]);

  // ── File Operations ──

  const openFile = useCallback(async (filePath) => {
    // Check if already open
    const existing = tabs?.find((t) => t.filePath === filePath);
    if (existing) {
      switchTab(existing.id);
      return;
    }

    const result = await electronAPI.readFile(filePath);
    if (!result.success) return;

    const stat = await electronAPI.getFileStat(filePath);
    const tab = createTab(filePath, result.content);
    tab.savedContent = result.content;
    tab.lastKnownMtime = stat.success ? stat.mtime : null;

    saveCurrentTabViewState();
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
    electronAPI.addRecentFile(filePath);
    electronAPI.watchFile(filePath);
  }, [tabs, saveCurrentTabViewState]);

  const saveTab = useCallback(async (tabId) => {
    const tab = tabs?.find((t) => t.id === (tabId || activeTabId));
    if (!tab) return false;

    if (!tab.filePath) {
      return saveTabAs(tab.id);
    }

    // Temporarily unwatch to avoid self-trigger
    await electronAPI.unwatchFile(tab.filePath);
    const result = await electronAPI.writeFile(tab.filePath, tab.content);
    if (result.success) {
      const stat = await electronAPI.getFileStat(tab.filePath);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tab.id
            ? { ...t, savedContent: t.content, lastKnownMtime: stat.success ? stat.mtime : null }
            : t
        )
      );
      await electronAPI.watchFile(tab.filePath);
      return true;
    }
    await electronAPI.watchFile(tab.filePath);
    return false;
  }, [tabs, activeTabId]);

  const saveTabAs = useCallback(async (tabId) => {
    const tab = tabs?.find((t) => t.id === (tabId || activeTabId));
    if (!tab) return false;

    const result = await electronAPI.showSaveDialog({
      defaultPath: tab.filePath || 'Untitled.md',
    });

    if (result.canceled || !result.filePath) return false;

    const writeResult = await electronAPI.writeFile(result.filePath, tab.content);
    if (writeResult.success) {
      const stat = await electronAPI.getFileStat(result.filePath);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tab.id
            ? {
                ...t,
                filePath: result.filePath,
                name: null,
                savedContent: t.content,
                lastKnownMtime: stat.success ? stat.mtime : null,
              }
            : t
        )
      );
      electronAPI.addRecentFile(result.filePath);
      electronAPI.watchFile(result.filePath);
      return true;
    }
    return false;
  }, [tabs, activeTabId]);

  const newFile = useCallback(() => {
    saveCurrentTabViewState();
    const tab = createTab();
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }, [saveCurrentTabViewState]);

  const closeTab = useCallback(async (tabId) => {
    const tab = tabs?.find((t) => t.id === tabId);
    if (!tab) return;

    // Prompt to save if dirty
    if (tab.content !== tab.savedContent) {
      const result = await electronAPI.showMessageBox({
        type: 'warning',
        buttons: ['Save', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        message: `Do you want to save changes to "${getTabName(tab)}"?`,
        detail: 'Your changes will be lost if you close without saving.',
      });

      if (result.response === 0) {
        // Save — abort close if save was canceled
        const saved = await saveTab(tabId);
        if (!saved) return;
      } else if (result.response === 2) {
        // Cancel
        return;
      }
      // response === 1 means Don't Save — continue closing
    }

    if (tab.filePath) {
      electronAPI.unwatchFile(tab.filePath);
    }

    // Clean up view state and editor state for closed tab
    tabViewStatesRef.current.delete(tabId);
    editorRef.current?.deleteState(tabId);

    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId);
      if (next.length === 0) {
        const fresh = createTab();
        setActiveTabId(fresh.id);
        return [fresh];
      }
      if (activeTabId === tabId) {
        const idx = prev.findIndex((t) => t.id === tabId);
        const newIdx = Math.min(idx, next.length - 1);
        setActiveTabId(next[newIdx].id);
      }
      return next;
    });
  }, [tabs, activeTabId, saveTab]);

  const closeOtherTabs = useCallback(async (keepTabId) => {
    const toClose = tabs?.filter((t) => t.id !== keepTabId) || [];
    for (const tab of toClose) {
      await closeTab(tab.id);
    }
  }, [tabs, closeTab]);

  const closeTabsToRight = useCallback(async (tabId) => {
    const idx = tabs?.findIndex((t) => t.id === tabId) ?? -1;
    if (idx < 0) return;
    const toClose = tabs.slice(idx + 1);
    for (const tab of toClose) {
      await closeTab(tab.id);
    }
  }, [tabs, closeTab]);

  const duplicateFile = useCallback(async () => {
    if (!activeTab) return;
    saveCurrentTabViewState();
    const tab = createTab(null, activeTab.content);
    tab.name = `${getTabName(activeTab)} copy`;
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }, [activeTab, saveCurrentTabViewState]);

  // ── Export ──

  const exportAs = useCallback(async (format) => {
    if (!activeTab) return;
    const previewEl = document.querySelector('.preview-container');
    const htmlBody = previewEl ? previewEl.innerHTML : '';
    const defaultName = getTabName(activeTab);
    if (format === 'html') {
      await electronAPI.exportHtml(htmlBody, defaultName);
    } else if (format === 'pdf') {
      await electronAPI.exportPdf(htmlBody, defaultName);
    }
  }, [activeTab]);

  // ── Close Window (with dirty checks) ──

  const closeWindow = useCallback(async () => {
    if (!tabs) {
      electronAPI.confirmCloseWindow();
      return;
    }

    const dirtyTabs = tabs.filter((t) => t.content !== t.savedContent);

    for (const tab of dirtyTabs) {
      const result = await electronAPI.showMessageBox({
        type: 'warning',
        buttons: ['Save', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        message: `Do you want to save changes to "${getTabName(tab)}"?`,
        detail: 'Your changes will be lost if you close without saving.',
      });

      if (result.response === 0) {
        // Save — abort close if save was canceled
        const saved = await saveTab(tab.id);
        if (!saved) {
          electronAPI.cancelCloseWindow();
          return;
        }
      } else if (result.response === 2) {
        // Cancel — abort close
        electronAPI.cancelCloseWindow();
        return;
      }
      // response === 1 means Don't Save — continue to next dirty tab
    }

    // All dirty tabs resolved — confirm close
    electronAPI.confirmCloseWindow();
  }, [tabs, saveTab]);

  // ── File Rename Handler ──

  const handleFileRenamed = useCallback((oldPath, newPath) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.filePath === oldPath) {
          electronAPI.unwatchFile(oldPath);
          electronAPI.watchFile(newPath);
          return { ...t, filePath: newPath, name: null };
        }
        return t;
      })
    );
  }, []);

  // ── File Deleted Handler ──

  const handleFileDeleted = useCallback((filePath) => {
    electronAPI.unwatchFile(filePath);
    setTabs((prev) => {
      const next = prev.filter((t) => t.filePath !== filePath);
      if (next.length === 0) {
        const fresh = createTab();
        setActiveTabId(fresh.id);
        return [fresh];
      }
      // If active tab was the deleted file, switch to adjacent
      const wasActive = prev.find((t) => t.id === activeTabId);
      if (wasActive?.filePath === filePath) {
        const idx = prev.findIndex((t) => t.filePath === filePath);
        const newIdx = Math.min(idx, next.length - 1);
        setActiveTabId(next[newIdx].id);
      }
      return next;
    });
  }, [activeTabId]);

  // ── Content Updates ──

  const updateContent = useCallback((tabId, content) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, content } : t))
    );
  }, []);

  // ── File Watching (external changes) ──

  useEffect(() => {
    // Focus mode owns the file — ignore external changes, auto-save takes precedence
    if (IS_FOCUS_MODE) return;

    const unsub = electronAPI.onFileChanged(async (filePath) => {
      if (!tabs) return;
      const tab = tabs.find((t) => t.filePath === filePath);
      if (!tab) return;

      const result = await electronAPI.readFile(filePath);
      if (!result.success) return;

      const externalContent = result.content;

      // Guard: never accept empty content (file may be mid-write/truncated)
      if (!externalContent && tab.content) return;

      // If content on disk matches what we have, nothing to do
      if (externalContent === tab.content) return;

      const hasLocalChanges = tab.content !== tab.savedContent;

      if (!hasLocalChanges) {
        // No local edits — silently accept external content
        setTabs((prev) =>
          prev.map((t) =>
            t.filePath === filePath
              ? { ...t, content: externalContent, savedContent: externalContent }
              : t
          )
        );
      } else {
        // Three-way merge: try to combine user's edits with external changes
        // savedContent = common ancestor, tab.content = user's version, externalContent = external version
        const patch = createPatch('file', tab.savedContent, externalContent);
        const merged = applyPatch(tab.content, patch, { fuzzFactor: 3 });

        if (merged !== false) {
          // Clean merge — both edits applied without conflict
          setTabs((prev) =>
            prev.map((t) =>
              t.filePath === filePath
                ? { ...t, content: merged, savedContent: externalContent }
                : t
            )
          );
        } else {
          // Conflicting edits on the same lines — show diff dialog
          setDiffData({
            tabId: tab.id,
            filePath,
            currentContent: tab.content,
            externalContent,
          });
        }
      }
    });
    return unsub;
  }, [tabs]);

  // ── File Deletion Detection ──

  useEffect(() => {
    if (IS_FOCUS_MODE) return;

    const unsub = electronAPI.onFileDeleted(async (filePath) => {
      if (!tabs) return;
      const tab = tabs.find((t) => t.filePath === filePath);
      if (!tab) return;

      const result = await electronAPI.showMessageBox({
        type: 'warning',
        title: 'File Deleted',
        message: `${filePath.split('/').pop()} has been deleted from disk.`,
        detail: 'Would you like to close the tab or re-save the file?',
        buttons: ['Close Tab', 'Re-save File'],
        defaultId: 1,
        cancelId: 0,
      });

      if (result.response === 0) {
        // Close tab
        closeTab(tab.id);
      } else {
        // Re-save — write content back to disk and re-watch
        await electronAPI.writeFile(filePath, tab.content);
        const stat = await electronAPI.getFileStat(filePath);
        setTabs((prev) =>
          prev.map((t) =>
            t.id === tab.id
              ? { ...t, savedContent: t.content, lastKnownMtime: stat.success ? stat.mtime : null }
              : t
          )
        );
        await electronAPI.watchFile(filePath);
      }
    });
    return unsub;
  }, [tabs, closeTab]);

  // ── Diff Resolution ──

  const handleDiffResolve = useCallback(async (action, mergedContent) => {
    if (!diffData) return;

    if (action === 'overwrite') {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === diffData.tabId
            ? { ...t, content: diffData.externalContent, savedContent: diffData.externalContent }
            : t
        )
      );
    } else if (action === 'merge') {
      // Per-hunk merge — apply the user's selections
      setTabs((prev) =>
        prev.map((t) =>
          t.id === diffData.tabId
            ? { ...t, content: mergedContent, savedContent: diffData.externalContent }
            : t
        )
      );
    } else if (action === 'save-as-new') {
      const result = await electronAPI.showSaveDialog({
        defaultPath: diffData.filePath,
      });
      if (!result.canceled && result.filePath) {
        await electronAPI.writeFile(result.filePath, diffData.currentContent);
        setTabs((prev) =>
          prev.map((t) =>
            t.id === diffData.tabId
              ? { ...t, content: diffData.externalContent, savedContent: diffData.externalContent }
              : t
          )
        );
      }
    }
    // 'cancel' — do nothing, keep current state
    setDiffData(null);
  }, [diffData]);

  // ── Auto-Save ──

  useEffect(() => {
    // Focus mode: always auto-save with short delay
    const shouldAutoSave = IS_FOCUS_MODE || settings?.autoSave;
    const delay = IS_FOCUS_MODE ? 500 : (settings?.autoSaveDelay || 5000);

    if (!shouldAutoSave || !activeTab?.filePath) return;
    if (activeTab.content === activeTab.savedContent) return;

    const timer = setTimeout(() => {
      saveTab(activeTab.id);
    }, delay);

    return () => clearTimeout(timer);
  }, [settings?.autoSave, settings?.autoSaveDelay, activeTab?.id, activeTab?.content, activeTab?.savedContent, activeTab?.filePath, saveTab]);

  // ── Focus Mode ──

  const enterFocusMode = useCallback(async (tabId) => {
    const tab = tabs?.find((t) => t.id === (tabId || activeTabId));
    if (!tab?.filePath) return;
    // Save before opening focus window so file is up to date
    if (tab.content !== tab.savedContent) {
      await saveTab(tab.id);
    }
    await electronAPI.openFocusWindow(tab.filePath, String(tab.id));
    setFocusTabIds((prev) => new Set(prev).add(tab.id));
  }, [tabs, activeTabId, saveTab]);

  useEffect(() => {
    if (IS_FOCUS_MODE) return; // Focus windows don't listen for these
    const unsubs = [
      electronAPI.onFocusWindowClosed((tabId) => {
        setFocusTabIds((prev) => {
          const next = new Set(prev);
          // tabId comes as string from IPC, tab.id is a number
          for (const id of next) {
            if (String(id) === String(tabId)) next.delete(id);
          }
          return next;
        });
      }),
      electronAPI.onEnterFocusMode(() => enterFocusMode()),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [enterFocusMode]);

  // ── Menu Events ──

  useEffect(() => {
    const unsubs = [
      electronAPI.onMenuSave(() => saveTab()),
      electronAPI.onMenuSaveAs(() => saveTabAs()),
      electronAPI.onMenuNewFile(() => newFile()),
      electronAPI.onOpenFile((filePath) => openFile(filePath)),
      electronAPI.onOpenFolder((dirPath) => setFolderPath(dirPath)),
      electronAPI.onToggleSearch(() => {
        setShowSearch((v) => !v);
        setShowReplace(false);
      }),
      electronAPI.onToggleSearchReplace(() => {
        setShowSearch(true);
        setShowReplace((v) => !v);
      }),
      electronAPI.onExportHtml(() => exportAs('html')),
      electronAPI.onExportPdf(() => exportAs('pdf')),
      electronAPI.onDuplicateFile(() => duplicateFile()),
      electronAPI.onShowSettings(() => setShowSettings(true)),
      electronAPI.onShowAbout(() => setShowAbout(true)),
      electronAPI.onCloseTab(() => closeTab(activeTabId)),
      electronAPI.onCloseWindow(() => closeWindow()),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [saveTab, saveTabAs, newFile, openFile, duplicateFile, exportAs, closeTab, closeWindow, activeTabId]);

  // ── Toolbar Actions ──

  const handleToolbarAction = useCallback((action) => {
    if (editorRef.current) {
      editorRef.current.applyFormatting(action);
    }
  }, []);

  // ── Helpers ──

  function getTabName(tab) {
    if (tab.name) return tab.name;
    if (tab.filePath) {
      const parts = tab.filePath.split('/');
      return parts[parts.length - 1];
    }
    return 'Untitled';
  }

  function isTabDirty(tab) {
    return tab.content !== tab.savedContent;
  }

  // ── Pane Resize ──

  const SIDEBAR_MIN = 120;
  const SIDEBAR_MAX = 360;
  const SPLIT_MIN = 0.2;
  const SPLIT_MAX = 0.8;
  const SNAP_BUFFER_PX = 4;
  const HANDLE_WIDTH = 6;

  const handleResizeStart = useCallback((type) => (e) => {
    e.preventDefault();
    dragTypeRef.current = type;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('is-resizing');

    const onMouseMove = (moveEvent) => {
      const container = mainContentRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mouseX = moveEvent.clientX - rect.left;

      if (dragTypeRef.current === 'sidebar') {
        const clamped = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, mouseX));
        setFileBrowserWidth(clamped);
        fileBrowserWidthRef.current = clamped;
      } else if (dragTypeRef.current === 'editor') {
        // Available space for editor+preview = total - sidebar - two handles
        const editorAreaStart = fileBrowserWidthRef.current + HANDLE_WIDTH;
        const editorAreaWidth = rect.width - editorAreaStart - HANDLE_WIDTH;
        const posInArea = mouseX - editorAreaStart;
        let ratio = posInArea / editorAreaWidth;

        // Snap to center
        const centerPx = editorAreaWidth / 2;
        if (Math.abs(posInArea - centerPx) <= SNAP_BUFFER_PX) {
          ratio = 0.5;
        }

        ratio = Math.max(SPLIT_MIN, Math.min(SPLIT_MAX, ratio));
        setEditorSplit(ratio);
        editorSplitRef.current = ratio;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.classList.remove('is-resizing');

      // Persist on drag end (read from refs for latest values)
      if (dragTypeRef.current === 'sidebar') {
        electronAPI.setSetting('fileBrowserWidth', fileBrowserWidthRef.current);
      } else if (dragTypeRef.current === 'editor') {
        electronAPI.setSetting('editorSplit', editorSplitRef.current);
      }
      dragTypeRef.current = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  // ── Focus Mode: ESC to close ──
  useEffect(() => {
    if (!IS_FOCUS_MODE) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') window.close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!settings || !tabs) return null; // Loading

  const isActiveTabInFocus = activeTab && focusTabIds.has(activeTab.id);

  // ── Focus Mode Layout ──
  if (IS_FOCUS_MODE && activeTab) {
    return (
      <div className="app focus-mode">
        <div className="title-bar">
          <div className="drag-region" style={{ flex: 1 }} />
        </div>
        <div className="focus-mode-content">
          <div className="focus-mode-editor">
            <Toolbar onAction={handleToolbarAction} />
            <Editor
              ref={editorRef}
              content={activeTab.content}
              onChange={(val) => updateContent(activeTab.id, val)}
              settings={settings}
              theme={theme}
              tabId={activeTab.id}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ── Drag Region + Tabs ── */}
      <div className="title-bar">
        <div className="drag-region" />
        <TabBar
          tabs={tabs.map((t) => ({
            id: t.id,
            name: getTabName(t),
            dirty: isTabDirty(t),
            filePath: t.filePath,
          }))}
          activeTabId={activeTabId}
          onSelectTab={switchTab}
          onCloseTab={closeTab}
          onCloseOtherTabs={closeOtherTabs}
          onCloseTabsToRight={closeTabsToRight}
          onNewTab={newFile}
          onFocusMode={enterFocusMode}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="main-content" ref={mainContentRef}>
        {/* File Browser */}
        <FileBrowser
          folderPath={folderPath}
          onOpenFile={openFile}
          onSetFolder={setFolderPath}
          onOpenSettings={() => setShowSettings(true)}
          width={fileBrowserWidth}
          activeFilePath={activeTab?.filePath}
          onFileRenamed={handleFileRenamed}
          onFileDeleted={handleFileDeleted}
          favorites={settings.favorites || []}
          onUpdateFavorites={(f) => electronAPI.setSetting('favorites', f)}
          onFindInFolder={setFindInFolderPath}
        />

        {/* Sidebar Resize Handle */}
        <div className="resize-handle" onMouseDown={handleResizeStart('sidebar')} />

        {/* Editor Column */}
        <div className="editor-column" style={{ flex: editorSplit }}>
          {isActiveTabInFocus ? (
            <div className="focus-placeholder">
              <div className="focus-placeholder-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" opacity="0.3">
                  <path d="M5 15H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4z" />
                </svg>
              </div>
              <div className="focus-placeholder-text">This document is open in Focus Mode</div>
              <button
                className="focus-placeholder-button"
                onClick={() => electronAPI.focusFocusWindow(String(activeTab.id))}
              >
                Switch to Focus Window
              </button>
            </div>
          ) : (
            <>
              <Toolbar onAction={handleToolbarAction} />
              {showSearch && (
                <SearchReplace
                  editorRef={editorRef}
                  showReplace={showReplace}
                  onClose={() => {
                    setShowSearch(false);
                    setShowReplace(false);
                  }}
                  onSearchChange={setSearchHighlight}
                />
              )}
              <Editor
                ref={editorRef}
                content={activeTab.content}
                onChange={(val) => updateContent(activeTab.id, val)}
                settings={settings}
                theme={theme}
                tabId={activeTab.id}
              />
            </>
          )}
        </div>

        {/* Editor/Preview Resize Handle */}
        <div className="resize-handle" onMouseDown={handleResizeStart('editor')} />

        {/* Preview Column */}
        <div className="preview-column" style={{ flex: 1 - editorSplit }}>
          <PreviewHeader filePath={activeTab.filePath} />
          <Preview
            content={activeTab.content}
            theme={theme}
            editorRef={editorRef}
            filePath={activeTab.filePath}
            onOpenFile={openFile}
            searchHighlight={searchHighlight}
          />
        </div>
      </div>

      {/* ── Modals ── */}
      {diffData && (
        <DiffView
          filePath={diffData.filePath}
          currentContent={diffData.currentContent}
          externalContent={diffData.externalContent}
          onResolve={handleDiffResolve}
        />
      )}

      {findInFolderPath && (
        <FindInFolder
          folderPath={findInFolderPath}
          onOpenFile={openFile}
          onClose={() => setFindInFolderPath(null)}
        />
      )}

      {showSettings && (
        <Settings
          settings={settings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAbout && (
        <div className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="modal about-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Simple Markdown Editor</h2>
            <p className="about-version">v{settings._version || '0.1.0'}</p>
            <p className="about-description">A stupid simple markdown editor.</p>
            <div className="about-links">
              <button
                className="link-button"
                onClick={() => electronAPI.openExternal('https://mipyip.com')}
              >
                mipyip.com
              </button>
              <button
                className="link-button"
                onClick={() => electronAPI.openExternal('https://github.com/avanrossum/simple-markdown-editor')}
              >
                GitHub
              </button>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAbout(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
