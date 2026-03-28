# SideMark Roadmap

## v0.1.0 — Functional Application

> Status: **Complete**

### Core

- [x] Electron app scaffold (main process, renderer, preload, IPC)
- [x] Vite build setup for renderer
- [x] electron-builder config with macOS signing
- [x] Application menu (File, Edit, View, Window, Help)
- [x] Settings persistence (JSON store)
- [x] Window bounds save/restore
- [x] Multi-window support (Cmd+Shift+N)
- [x] Cmd+W closes tab (not window)
- [x] New window (Cmd+Shift+N) opens fresh (empty Untitled tab, no restored state)
- [x] Multi-window session restore (all open windows preserved and restored on quit/relaunch)
- [x] Dirty check on window close (prompt to save unsaved tabs before closing window)
- [x] Close Window shortcut (Cmd+Shift+W)

### Editor

- [x] CodeMirror 6 markdown editor
- [x] Markdown syntax highlighting
- [x] Formatting toolbar (bold, italic, strikethrough, headings, lists, code, links, images, hr)
- [x] Toolbar works with selection (wrap) and without (insert markers)
- [x] Formatting toggle: wrap buttons (bold, italic, etc.) remove formatting if already applied
- [x] Heading buttons cycle: recognize existing heading, shift level, toggle off if same
- [x] List buttons: multi-line support (apply to all selected lines, toggle off on re-click)
- [x] Numbered lists: continue numbering from preceding list items
- [x] List buttons: swap type (e.g. bullet → numbered) when re-clicking with different type
- [x] Line numbers (toggleable)
- [x] Search and replace (Cmd+F, Cmd+H)

### File Management

- [x] File browser pane (left sidebar)
- [x] File browser: expand/collapse directories, double-click to set root
- [x] File browser: path navigation with back button, defaults to home directory
- [x] File browser: only markdown files are openable
- [x] Open file from file browser
- [x] Open file from menu / dialog
- [x] Open folder for file browser
- [x] Save / Save As
- [x] Duplicate file
- [x] Recent files in menu
- [x] Tab bar with open files
- [x] Tab close, new tab, switch tabs
- [x] Dirty indicator on tabs (unsaved changes dot)
- [x] Save-before-close confirmation for dirty files
- [x] File watching (detect external changes)
- [x] External change diff view with resolve options
- [x] File browser auto-refresh on file system changes (including subdirectories)
- [x] File browser: reveal and highlight active file when switching tabs
- [x] File browser: right-click context menu (new markdown file, new folder, rename)
- [x] File browser: inline rename for files and folders
- [x] Session restore (persist open tabs, active tab, folder path across restarts)
- [x] File browser: delete file (move to trash) via context menu
- [x] File browser: "Show in Finder" context menu option

### Preview

- [x] Live markdown preview (right pane)
- [x] Section-based bidirectional synchronized scrolling (editor ↔ preview)
- [x] GitHub Flavored Markdown rendering
- [x] Relative image path resolution in preview (local-resource:// protocol)

### Settings

- [x] Theme: dark / light / system
- [x] Accent color picker (7 colors)
- [x] Font size selector (applies to editor)
- [x] Editor font family selector (system monospace fonts)
- [x] Fix: editor font family setting not applying to CodeMirror
- [x] Preview font family selector (system fonts)
- [x] Theme selector: segmented control (Dark / Light / System)
- [x] Toggle: line numbers
- [x] About section with links to mipyip.com and GitHub
- [x] Settings gear in file browser footer

### Build

- [x] App icon (SVG source, icns generation script)
- [x] macOS entitlements plist
- [x] Release script (build + sign + GitHub release)
- [x] Generate .icns from icon SVG
- [x] First successful build (unsigned)
- [x] First successful signed build
- [ ] Test on clean macOS install

### Auto-Updates

- [x] electron-updater integration
- [x] Check for updates on launch and periodically (every 4 hours)
- [x] Check for Updates menu item
- [x] Update available dialog with release notes and download button
- [x] Download progress bar
- [x] Update downloaded dialog (Restart & Install)
- [x] "What's New" dialog shown after update restart

---

## v0.1.11–0.1.22 — Security Hardening

> Status: **Complete** (Critical, High, Medium all resolved)
> Source: Adversarial code review (`The_Adversary/reviews/markdown_editor/REPORT.md`)

### Critical (Attack Chain: malicious .md → full filesystem compromise)

- [x] **C1.** XSS via unsanitized markdown preview — added DOMPurify before `dangerouslySetInnerHTML`
- [x] **C2.** Unrestricted filesystem access via IPC — added `isPathAllowed()` validation (home + /Volumes, blocks .ssh/.gnupg/.aws etc.)
- [x] **C3.** Path traversal in `local-resource://` protocol — restricted to image extensions under home/Volumes
- [x] **C5.** `shell.openExternal` arbitrary schemes — allowlisted `https:`, `http:`, `mailto:` only

### High

- [x] **H1.** Bypassable regex sanitizer in `UpdateDialog.jsx` — replaced with DOMPurify
- [x] **H2.** `sandbox: false` on main BrowserWindow — enabled `sandbox: true` (chokidar runs in main, not preload)
- [x] **H3.** Missing CSP on settings window — removed dead standalone entry; tightened update dialog CSP
- [x] **H4.** `file:resolve-path` exposed `path.resolve()` — removed (was never called from renderer)
- [x] **H5.** Entitlements: verified all 3 (allow-jit, unsigned-executable-memory, disable-library-validation) are required for Electron
- [x] **H6.** No debounce on preview rendering — added 150ms debounce

### Medium (Code Quality)

- [x] **M1.** Duplicate CSS button styles — extracted to shared `buttons.css`
- [x] **M2.** Test artifact `Architecture_test_second_save.md` — deleted
- [x] **M3.** Unused settings standalone entry point — removed `index.html` + `index.jsx`
- [x] **M4.** `release.sh` `git add -A` — replaced with explicit `package.json package-lock.json` staging
- [x] **M5.** `buildAnchorMap()` rebuilt on every scroll — cached in ref, rebuilt only on content change

### Low / Deferred

- [ ] **L1.** No test framework — add Vitest
- [ ] **L2.** No linting — add ESLint + Prettier
- [ ] **M8/M9.** Decompose `App.jsx` (643 lines) and `FileBrowser.jsx` (505 lines) into custom hooks

---

## v0.1.23–0.1.24 — Preview Header & Scroll Fix

> Status: **Complete**

- [x] Preview pane header bar: show full file path in the empty space above the preview (mirrors toolbar height), with "Show in Finder" and "Copy Path" buttons
- [x] Scroll sync fix: when scrolling editor to the very top, preview should also scroll to top — snaps to 0 when sourceScroll ≤ 0

---

## v0.2.0 — Favorites, Keyboard Shortcuts & Clickable Links

> Status: **In Progress**

### Favorites

- [x] Favorites panel above file browser (pin files and folders for quick access)
- [x] Click favorite folder → opens in file browser; click file → opens in editor
- [x] Drag-and-drop reordering within favorites
- [x] Stale path detection (muted/italic for missing paths)
- [x] Right-click context menu: "Add to Favorites" / "Remove from Favorites" in file tree
- [x] Right-click context menu: "Remove from Favorites" in favorites panel
- [x] "Copy Path" context menu option for files and folders in file tree

### Resizable Panes

- [x] Draggable resize handle between file browser and editor (6px visible bar, col-resize cursor)
- [x] Draggable resize handle between editor and preview panes
- [x] Editor/preview handle snaps to center with 4px buffer zone
- [x] File browser width constrained to 120–360px range
- [x] Both resize positions persist to settings and sync across windows

### Keyboard Shortcuts

- [x] Bold (Cmd+B)
- [x] Italic (Cmd+I)
- [x] Strikethrough (Cmd+Shift+X)
- [x] Inline code (Cmd+E)
- [x] Code block (Cmd+Shift+C)
- [x] Heading cycle (Cmd+Shift+H) — cycles none → H1 → H2 → H3 → none
- [x] Bullet list (Cmd+Shift+L)
- [x] Numbered list (Cmd+Shift+O)
- [x] Link (Cmd+K)
- [x] Horizontal rule (Cmd+Shift+-)
- [x] Blockquote (Cmd+Shift+.)

### Bug Fixes

- [x] Tab scroll/cursor position: save and restore per-tab scroll offset and cursor when switching tabs
- [x] File browser refresh: increase watcher depth from 1 to 5 for nested subdirectories
- [x] File browser refresh: reload tree on window focus to catch changes missed by FS events
- [x] Per-document undo history: Cmd+Z currently shares undo state across all tabs — each tab should have its own independent undo/redo stack

### Clickable Links

- [ ] File browser: delete folder (move to trash) via context menu
- [x] Preview pane: clickable links to local .md files open in new tab
- [x] Link resolution: handle relative paths
- [x] Link resolution: handle directory traversal (`../`, `./`)
- [x] Link resolution: handle paths relative to open folder root
- [x] Visual distinction for local vs external links in preview

---

## v0.3.0 — Toolbar Dialogs & Polish

> Status: **Planned**

- [ ] Link button: dialog to enter URL
- [ ] Image button: dialog with "Insert from file" and "Insert URL" options
- [ ] Editor: bracket/quote auto-pairing
- [x] Auto-save option (with configurable delay)
- [ ] File browser: drag to resize width
- [x] Export to HTML / PDF
- [ ] Performance: large markdown files crash or freeze the app (editor + preview rendering)

### Bug Fixes

- [x] Tab bar: auto-scroll to newly opened/active tab when it's off-screen

### Search Enhancements

- [ ] Search: highlight matches in preview pane (read-only, mirrors editor matches) — _in progress: code in place but highlights not visually appearing_
- [x] Search: "Find in Folder" via right-click context menu — search file names and content within selected folder (depth-limited, ignore patterns, relative path display)

---

## v0.4.0 — Focus Mode, Export & Auto-Save

> Status: **Complete**

### Focus Mode

- [x] Distraction-free fullscreen editing window (toolbar + editor only, centered at comfortable column width)
- [x] Enter via right-click tab > "Open in Focus Mode" or ⌘⇧F (View menu)
- [x] Auto-saves content in background (500ms debounce) — parent window stays in sync via file watcher
- [x] ESC to exit focus mode
- [x] Parent tab shows "in focus mode" placeholder with "Switch to Focus Window" button

### Export

- [x] Export to PDF (File > Export As > PDF) — uses Electron's printToPDF via hidden offscreen window
- [x] Export to HTML (File > Export As > HTML) — standalone document with inline light-theme styles

### Auto-Save

- [x] Auto-save toggle in Settings (off by default) with configurable delay (1s, 2s, 5s, 10s)

### Collaborative Editing (v0.4.1–v0.4.3)

- [x] Three-way merge: non-overlapping external edits merge seamlessly via `createPatch`/`applyPatch` with fuzz factor
- [x] Interactive per-hunk diff view: click change blocks to toggle mine/theirs, bulk select, mixed merge via "Apply Selection"
- [x] Hunk grouping: short context gaps (1-2 lines) absorbed so heading+body toggle as one block
- [x] Empty content guard: never accept empty/truncated file reads (mid-write protection)
- [x] Focus mode skips file watcher (auto-save owns the file)
- [x] External file deletion detection: dialog prompts close tab or re-save

---

## v1.0.0 — SideMark Rebrand

> Status: **Complete**

- [x] Rename from "Simple Markdown Editor" to "SideMark"
- [x] Git gutter markers (added/modified/deleted vs last commit)
- [x] Toast notifications for silent merge success
- [x] Copy with context (⌘⌥C) — file path + line numbers for AI chat windows
- [x] Editor right-click context menu (cut, copy, paste, copy with path)
- [x] Enhanced markdown syntax highlighting (theme-aware colors)
- [x] Task list checkboxes in preview (custom styled, DOMPurify-safe)
- [x] Session persistence flush-on-quit (no session loss during updates)
- [x] Find in Folder keyboard shortcut (⌘⇧G)

---

## v1.0.4 — Text Transforms & Editor Polish

> Status: **Complete**

- [x] Text Transforms submenu (Edit > Text Transforms): Unicode Italic, Bold, Bold Italic, Small Caps, Monospace, Strikethrough, Upside Down, UPPERCASE, lowercase, Title Case
- [x] Keyboard shortcuts for Unicode Italic (⌘⌥I) and Unicode Bold (⌘⌥B)
- [x] Scroll past end in editor (no more jarring jumps when editing at the bottom)

---

## v1.0.5 — Tab Reorder & Session Fix

> Status: **Complete**

- [x] Tab drag-and-drop reordering
- [x] Window drag spacer in title bar (60px, always draggable even with many tabs)
- [x] Session persistence fix: remove renderer debounce, simplify update-restart quit path
- [x] Beta release channel (`npm run release:beta`, prerelease versions, `allowPrerelease` auto-detection)

---

## v1.0.6 — File Browser Dates

> Status: **Complete**

- [x] "Show dates" setting in Settings > File Browser
- [x] Column headers (Name / Date) with clickable sort cycling (Modified ↓/↑, Created ↓/↑)
- [x] Relative timestamps on files and folders (just now, 2m ago, 3d ago, Mar 23)
- [x] Age-based color gradient: accent → muted grey over 30 days

---

See [Issues](https://github.com/avanrossum/sidemark/issues) for what's next.
