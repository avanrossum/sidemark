# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.6] - 2026-03-27

### Added

- File browser date columns: toggle "Show dates" in Settings > File Browser to see relative timestamps (e.g. "2m ago", "3d ago") on files and folders
- Clickable column headers cycle through Modified ↓/↑ and Created ↓/↑ sort — newest files float to top, making agent-created files easy to spot
- Age-based color gradient on dates: accent color for recent, fading to muted grey at 30+ days

## [1.0.5] - 2026-03-22

### Added

- Tab drag-and-drop reordering
- Window drag spacer in title bar (always draggable even when tabs overflow)
- Beta release channel for testing auto-updates before shipping to stable users

### Fixed

- Session persistence on auto-update restart — open tabs and folder are now reliably restored after "Restart & Install"
- Editor scroll jumping when editing near the bottom of a document (scrollPastEnd)

## [1.0.4] - 2026-03-21

### Added

- Text Transforms submenu (Edit > Text Transforms): Unicode Italic, Unicode Bold, Unicode Bold Italic, Small Caps, Unicode Monospace, Strikethrough (combining characters), Upside Down, UPPERCASE, lowercase, Title Case — for platforms like LinkedIn that don't support markdown formatting
- Keyboard shortcuts for Unicode Italic (⌘⌥I) and Unicode Bold (⌘⌥B)
- Scroll past end in editor — cursor no longer jumps to the bottom edge when editing near the end of a document

## [1.0.3] - 2026-03-19

### Added

- Tab key now inserts indentation in the editor (instead of cycling focus)
- CodeMirror's built-in Find and Replace with regex, match case, and by-word support

### Changed

- Replaced custom search/replace UI with CodeMirror's native search panel
- Removed Find and Find and Replace menu items (Cmd+F handled natively by editor)

## [1.0.2] - 2026-03-19

### Added

- New Markdown File and New Folder in right-click context menu for files (creates in parent directory)
- Move to Trash confirmation dialog for both files and folders
- New files auto-open in editor after rename
- Folder trash closes all open tabs under that folder with toast notification ("Closed N tabs")
- Confirm dialog IPC handler (reusable `dialog:confirm` bridge)

## [1.0.1] - 2026-03-19

### Added

- Find in Folder keyboard shortcut (⌘⇧G) — accessible from Edit menu
- Power User Features section in README

### Changed

- App icon updated from "MD" to "SM" to match SideMark rebrand

## [1.0.0] - 2026-03-19

### Changed

- Renamed from "Simple Markdown Editor" to **SideMark**
- New tagline: "A markdown editor built for working alongside AI"
- Updated app ID, product name, about dialog, settings, menus, and all references
- Version bump to 1.0.0 to mark the rebrand and feature maturity

## [0.5.0] - 2026-03-18

### Added

- Git gutter markers: green (added), blue (modified), red (deleted) indicators in the editor gutter showing changes since last git commit. Updates on content change (debounced), save, tab switch, and external merge.
- Toast notifications: non-blocking slide-in notifications at bottom-right. Used for merge success alerts, copy confirmations, and other transient feedback. Auto-dismiss with configurable duration.
- Copy with Context: one-click copy of file contents with file path and line numbers (⌘⌥C). Selection copies `// path:L14-L27` header + text. No selection copies full file with path. Available via toolbar button, Edit menu, and right-click context menu.
- Editor context menu: right-click in editor shows Cut, Copy, Paste, Select All, Copy File Contents, and Copy with Path.

## [0.4.5] - 2026-03-18

### Fixed

- Session persistence on quit: added synchronous flush to prevent session loss when app quits or restarts for update before debounced saves complete
- Session persistence on update: `quitAndInstall()` now flushes store to disk before restarting
- Renderer session flush: `beforeunload` listener ensures pending session data is sent to main process immediately on window close

## [0.4.4] - 2026-03-18

### Added

- Enhanced markdown syntax highlighting: theme-aware colors for headings (golden), bold, italic, code (green), links, quotes, and dimmed syntax markers. Dark and light variants.
- Task list checkboxes in preview: custom styled spans (accent-colored checked state) replacing browser-default inputs that DOMPurify stripped

### Fixed

- Task list checkbox line break in loose list items (checkbox now injected inside paragraph tag)

## [0.4.3] - 2026-03-18

### Added

- External file deletion detection: when an open file is deleted from disk, a dialog prompts to close the tab or re-save the file

## [0.4.2] - 2026-03-18

### Added

- Interactive diff view: per-hunk accept/reject when resolving conflicts. Click change blocks to toggle between "mine" and "theirs". Bulk "Keep all mine" / "Accept all theirs" buttons. Mixed selections merged via "Apply Selection".

### Fixed

- Diff hunk grouping: heading + body changes separated by blank lines are now merged into a single clickable hunk (prevents partial section selection)

## [0.4.1] - 2026-03-18

### Added

- Three-way merge for external changes: when both you and an external tool (e.g., Claude) edit different parts of the same file, changes merge seamlessly without interruption. Only same-line conflicts trigger the diff dialog.

### Fixed

- External change detection no longer accepts empty/truncated file reads (mid-write protection)
- Focus mode ignores file watcher events (auto-save owns the file, prevents race conditions)

## [0.4.0] - 2026-03-17

### Added

- Focus Mode: distraction-free fullscreen editing with centered content. Right-click tab > "Open in Focus Mode" or ⌘⇧F. Auto-saves in background. ESC to exit. Parent tab shows placeholder with "Switch to Focus Window" button.

## [0.3.3] - 2026-03-17

### Added

- Auto-save: toggle in Settings with configurable delay (1s, 2s, 5s, 10s). Saves dirty files automatically after the chosen delay. Off by default.

## [0.3.2] - 2026-03-17

### Added

- Export As: File > Export As > PDF — export current document as a styled PDF
- Export As: File > Export As > HTML — export current document as a standalone HTML file with inline styles

## [0.3.1] - 2026-03-11

### Added

- Tab context menu: right-click any tab for Show in Finder, Copy Path, Close Tab, Close Other Tabs, Close Tabs to the Right
- README updated with features from v0.2.0–v0.3.1 (favorites, keyboard shortcuts, resizable panes, clickable links, Find in Folder, tab context menu)

## [0.3.0] - 2026-03-11

### Added

- Find in Folder: right-click any folder in the file browser → "Find in Folder" to search filenames and file content within that folder
- Find in Folder: results show filename matches and content matches grouped by file with relative paths
- Find in Folder: depth-limited recursive search (10 levels, 5000 file cap, 1000 result cap) with match highlighting

### Fixed

- Tab bar: newly opened tabs that are off-screen now auto-scroll into view

## [0.2.3] - 2026-03-05

### Fixed

- Per-document undo history: Cmd+Z no longer crosses tab boundaries — each tab now has its own independent undo/redo stack via per-tab EditorState isolation

## [0.2.2] - 2026-03-05

### Added

- Clickable links in preview: local `.md` file links open in a new editor tab, external links open in default browser
- Link resolution: handles relative paths (`./`), directory traversal (`../`), and absolute paths
- Visual distinction for external links (↗ indicator)

### Fixed

- App hangs on launch: directory watcher with depth 5 exhausted file descriptors (EMFILE) on large folder trees — reduced depth to 2 and added resource limit error handling

## [0.2.1] - 2026-03-05

### Added

- Keyboard shortcuts for all formatting actions: Bold (⌘B), Italic (⌘I), Strikethrough (⌘⇧X), Inline Code (⌘E), Code Block (⌘⇧C), Heading Cycle (⌘⇧H), Bullet List (⌘⇧L), Numbered List (⌘⇧O), Link (⌘K), Horizontal Rule (⌘⇧-), Blockquote (⌘⇧.)
- Heading cycle shortcut: ⌘⇧H cycles none → H1 → H2 → H3 → none
- File browser: refresh tree on window focus to catch filesystem changes missed by watcher

### Fixed

- Tab switching no longer inherits scroll position from the previous tab — each tab saves and restores its own scroll offset and cursor position
- File browser now detects changes in nested subdirectories (watcher depth increased from 1 to 5)

## [0.2.0] - 2026-03-03

### Added

- Favorites panel above file browser: pin frequently-used files and folders for quick access
- Favorites: click folder to open in browser, click file to open in editor
- Favorites: drag-and-drop reordering
- Favorites: stale path detection (muted/italic for missing paths, e.g. unmounted drives)
- File browser context menu: "Copy Path" option for files and folders
- File browser context menu: "Add to Favorites" / "Remove from Favorites" toggle
- Resizable file browser pane: drag the 6px handle between file browser and editor (120–360px range)
- Resizable editor/preview split: drag handle between editor and preview with center snap (4px buffer)
- Both resize positions persist across app restarts and sync across windows

## [0.1.32] - 2026-03-02

### Changed

- Repository renamed from `a_simple_markdown_editor` to `a-simple-markdown-editor`
- Updated auto-updater publish config and README links to match new repo name
- Replaced broken dynamic download badge with static badge

## [0.1.31] - 2026-03-02

### Fixed

- Local/relative images broken in preview — DOMPurify was stripping `local-resource://` URLs as an unrecognized protocol

## [0.1.30] - 2026-03-02

### Fixed

- Cmd+Q requires two presses to fully quit — app windows closed but process stayed alive in dock

## [0.1.29] - 2026-03-02

### Fixed

- Auto-update download broken: artifact filenames had spaces which GitHub converts to dots, mismatching `latest-mac.yml` — now uses hyphenated `artifactName` for consistent naming
- Download errors now shown in update dialog instead of failing silently

## [0.1.28] - 2026-03-02

### Added

- File associations: app registers as handler for `.md`, `.markdown`, `.mdown`, `.mkd`, `.mkdn`, `.mdwn`, `.mdx`, `.txt` — shows in Finder "Open With" menu

### Fixed

- README download/badge links pointing to wrong GitHub repo

## [0.1.27] - 2026-03-02

### Fixed

- Remote images not loading in preview (added `https:` to CSP img-src)

### Changed

- README: added download link, screenshot placeholder, project motivation, and feature overview

## [0.1.26] - 2026-03-02

### Fixed

- Button styles not loading in Settings/About and update dialog (CSS `@import` must be before all rules)
- Exposed "Check for Updates" in preload bridge for renderer access

### Added

- "Check for Updates" button in Settings About section

## [0.1.10] - 2026-03-01

### Added

- Auto-updates: electron-updater integration with GitHub Releases
- Check for Updates menu item (app menu → Check for Updates...)
- Update available dialog with release notes, download button, and progress bar
- Update downloaded dialog with Restart & Install option
- "What's New" dialog shown after update restart with release notes
- Generated .icns app icon from SVG source (automated script via qlmanage + sips + iconutil)
- Vite multi-entry build (renderer + update dialog)

### Fixed

- Relative/local images in preview now render correctly (added `local-resource:` to CSP img-src)

## [0.1.9] - 2026-03-01

### Fixed

- Editor font: explicitly set font-family on CodeMirror content and scroller elements (attempt to fix font not applying)

### Removed

- Spell check setting (was never wired to CodeMirror; removed toggle from settings)
- Word wrap setting (was never wired to CodeMirror; word wrap is now always on)

## [0.1.8] - 2026-03-01

### Added

- Dirty check on window close: prompts to save each unsaved tab before closing the window
- Close Window shortcut (Cmd+Shift+W) in File menu
- Formatting toggle: bold, italic, strikethrough, and code buttons now remove formatting if already applied to selection
- Heading buttons cycle: recognize existing heading level on the line — same level toggles off, different level swaps
- List buttons work on multi-line selections and toggle off when re-clicked
- Numbered lists continue numbering from preceding list items
- List buttons swap type (e.g. select bulleted lines → click numbered → swaps to numbered)

## [0.1.7] - 2026-03-01

### Added

- File browser: "Move to Trash" context menu option for files
- File browser: "Show in Finder" context menu option for files and folders
- Multi-window session restore: each window's tabs and folder are preserved on quit and restored on relaunch

### Fixed

- Editor font family setting not applying (CodeMirror now rebuilds with literal font values instead of CSS variables)
- New window (Cmd+Shift+N) now opens fresh with an empty Untitled tab instead of cloning the current window's state

## [0.1.6] - 2026-03-01

### Fixed

- Directory watcher errors (EACCES/EAGAIN) when browsing near system directories like /dev
- New file context menu action not showing inline rename input
- Rename not refreshing file browser tree to reflect new name

## [0.1.5] - 2026-03-01

### Added

- File browser: active file is auto-revealed and highlighted when switching tabs
- Session restore: open tabs, active tab, and folder path persist across app restarts
- File browser: right-click context menu with New Markdown File, New Folder, and Rename
- File browser: inline rename editing for files and folders
- MIT LICENSE file

## [0.1.4] - 2026-03-01

### Fixed

- Closing dirty tab with "Save" then canceling save dialog no longer discards the tab

## [0.1.3] - 2026-03-01

### Added

- Multi-window support: Cmd+Shift+N opens a new independent window

## [0.1.2] - 2026-03-01

### Fixed

- Cmd+W closes the active tab instead of the whole window

## [0.1.1] - 2026-03-01

### Added

- Save-before-close confirmation dialog for dirty files
- Bidirectional synchronized scrolling between editor and preview using section-based anchor mapping
- File browser auto-refreshes expanded subdirectories when file system changes are detected
- File browser defaults to home directory (~) with path navigation and back button
- File browser: double-click directories to set as root
- Relative image path resolution in preview via `local-resource://` custom protocol
- Preview font family selector (system fonts: Helvetica Neue, Georgia, Palatino, Avenir Next, Charter)
- Theme selector: segmented control (Dark / Light / System) matching design standards
- Editor font family options switched to system monospace fonts (SF Mono, Menlo, Monaco, Courier New, Andale Mono)

### Changed

- Accent color swatches restyled from circles to rounded squares
- Non-markdown files in file browser are now dimmed and non-clickable

### Fixed

- EMFILE crash when opening folders with many files (reduced watch depth, added ignore patterns)
- Title bar drag region: empty space between tabs is now draggable to move the window
- Text selection visibility: increased selection highlight contrast and reduced active line highlight opacity
- File browser not updating after duplicating/saving new files
- Font size setting not applying to editor
- Font family setting not applying to editor
- Preview font family now respects settings

## [0.1.0] - 2026-03-01

### Added

- Initial application scaffold: Electron main process, React renderer, Vite build
- CodeMirror 6 markdown editor with syntax highlighting
- Live markdown preview pane with GitHub Flavored Markdown
- Synchronized scrolling between editor and preview
- Formatting toolbar: bold, italic, strikethrough, headings (H1-H3), bullet list, numbered list, blockquote, inline code, code block, link, image, horizontal rule
- Toolbar formatting works with text selection (wraps) and without (inserts markers at cursor)
- File browser pane with expandable directory tree
- Tab bar with multiple open files, close buttons, new tab button
- Dirty indicator (dot) on tabs with unsaved changes
- File operations: open file, open folder, save, save as, duplicate
- Recent files in application menu
- File watching via chokidar: detects external changes to open files
- External change resolution: diff view with options to keep current, save as new, or accept external
- Search and replace (Cmd+F / Cmd+H) with case sensitivity toggle, match count, navigation
- Settings panel: theme (dark/light/system), accent color (7 options), font size, font family, line numbers
- About section with links to mipyip.com and GitHub
- Dark and light themes following design standards
- CSS custom properties theming system with 7 accent color options
- macOS window integration: hidden title bar with traffic light positioning
- Application menu: File (new, open, save, duplicate, recent), Edit (undo, redo, find, replace), View, Window, Help
- Window bounds persistence (saves position/size between sessions)
- App icon SVG source and generation script
- electron-builder configuration for macOS with code signing and notarization
- Release script for automated build + sign + GitHub release
