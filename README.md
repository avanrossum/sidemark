# SideMark

**A markdown editor for macOS built for working alongside AI.**

Most markdown editors assume one author. SideMark assumes two. When Claude Code, Cursor, Windsurf, or any AI agent edits your files while you're working in them, SideMark handles the merge automatically. Non-overlapping changes merge silently. Conflicting changes show an interactive per-hunk diff. No lost work, no broken flow.

Free and open source. No account, no subscription, no telemetry.

[![Download](https://img.shields.io/badge/download-latest-blue)](https://github.com/avanrossum/sidemark/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/avanrossum/sidemark/total)](https://github.com/avanrossum/sidemark/releases)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Website](https://img.shields.io/badge/website-mipyip.com-blue)](https://mipyip.com/products/sidemark)

[Product Page](https://mipyip.com/products/sidemark) · [Blog Post](https://mipyip.com/blog/simple-markdown-editor)

## Download

Grab the latest `.dmg` from [GitHub Releases](https://github.com/avanrossum/sidemark/releases/latest). Open it, drag to Applications, done.

Signed and notarized with Apple — no Gatekeeper warnings. macOS 12+ required. Apple Silicon supported.

## Screenshots

<table>
<tr>
<td width="50%">
<strong>Three-pane layout</strong><br>
<sub>File browser, editor with git gutter markers, and live preview</sub><br><br>
<img src="screenshot-gutter.png" alt="Three-pane layout with git gutter" width="100%">
</td>
<td width="50%">
<strong>Three-way merge + toast</strong><br>
<sub>External changes merged automatically with notification</sub><br><br>
<img src="screenshot-toast.png" alt="Merge toast notification" width="100%">
</td>
</tr>
<tr>
<td width="50%">
<strong>Interactive diff view</strong><br>
<sub>Per-hunk accept/reject when both authors edit the same lines</sub><br><br>
<img src="screenshot-diff-merge.png" alt="Interactive diff merge" width="100%">
</td>
<td width="50%">
<strong>Focus mode</strong><br>
<sub>Distraction-free fullscreen editing with centered content</sub><br><br>
<img src="screenshot-focus.jpg" alt="Focus mode" width="100%">
</td>
</tr>
<tr>
<td width="50%">
<strong>Settings</strong><br>
<sub>Theme, accent color, fonts, font size, auto-save, line numbers</sub><br><br>
<img src="screenshot-settings.png" alt="Settings panel" width="100%">
</td>
<td width="50%">
<strong>File deletion detection</strong><br>
<sub>Prompt to close or re-save when a file is deleted from disk</sub><br><br>
<img src="screenshot-resave.png" alt="File deleted dialog" width="100%">
</td>
</tr>
</table>

## Built for AI-Assisted Development

Most markdown editors assume a single author. SideMark assumes two.

If you work with AI coding tools — Claude Code, Copilot, Cursor, or anything that writes to files on your behalf — these features exist because of that workflow:

**Three-way merge.** When you're editing a file and an external tool writes to it at the same time, the editor compares both sets of changes against the last known version. If you edited different parts of the file, both changes merge automatically — no dialog, no interruption. If you collide on the same lines, an interactive diff view lets you accept or reject each change individually, hunk by hunk.

**Change notifications.** When an external merge succeeds silently, a toast notification tells you what happened — so you always know when your file was touched by something outside the editor.

**Git gutter markers.** Green, blue, and red indicators in the editor gutter show added, modified, and deleted lines compared to the last git commit. After an external tool edits your file, you see exactly which lines changed at a glance.

**Copy with context.** One-click copy of file contents with the file path and line numbers prepended — designed for pasting into AI chat windows. Select text and hit ⌘⌥C to get `// /path/to/file.md:L14-L27` followed by your selection. No selection copies the full file with path. Also available via right-click context menu, toolbar button, and Edit menu.

**Auto-save.** Keep your files continuously saved so external tools always read your latest version. Configurable delay (1-10 seconds), toggle on/off in Settings.

**File deletion detection.** If an external tool deletes a file you have open, you're prompted to close the tab or re-save the file to disk.

## Features

| | |
|---|---|
| **Editor** | CodeMirror 6 with markdown syntax highlighting, formatting toolbar with smart toggle detection, heading cycling, multi-line list handling, and full keyboard shortcuts (⌘B, ⌘I, ⌘K, etc.). Search and replace with case sensitivity and match navigation. Per-tab undo history. Git gutter markers for change tracking. Text Transforms (Edit menu) for Unicode italic, bold, small caps, and more — useful for LinkedIn and other platforms that don't support markdown. |
| **Live Preview** | GitHub Flavored Markdown in real time. Bidirectional scroll sync. Local and remote images inline. Task list checkboxes. Clickable links — `.md` files open in a new tab, external links open in your browser. |
| **Focus Mode** | Distraction-free fullscreen editing. Just the toolbar and editor, centered at a comfortable column width. Auto-saves in the background. ESC or ⌘W to return. Via right-click tab menu or ⌘⇧F. |
| **File Browser** | Expandable directory tree with auto-refresh. Context menu: new file, new folder, rename, delete (trash), show in Finder, copy path, favorites, find in folder. |
| **Favorites** | Pin files and folders for quick access. Drag-and-drop reordering. Stale path detection for unmounted drives. |
| **Tabs** | Dirty indicators, per-tab scroll/cursor restore, context menu (show in Finder, copy path, close, close others, close to right, focus mode). Auto-scrolls to keep active tab visible. |
| **Auto-Save** | Optional, with configurable delay (1-10s). Toggle in Settings. Keeps files synced for external tool collaboration. |
| **Export** | File > Export As > PDF or HTML. Clean light-theme styling with inline CSS, no dependencies. |
| **Session Restore** | Tabs, active tab, folder, and window bounds persist across restarts. Multi-window support (⌘⇧N). Flush-on-quit ensures no session loss during updates. |
| **Customization** | Dark, light, or system themes. 7 accent colors. Editor font (SF Mono, Menlo, Monaco, Courier New, Andale Mono), preview font (Helvetica Neue, Georgia, Palatino, Avenir Next, Charter), font size, line numbers, resizable panes. |
| **File Associations** | Registers for `.md`, `.markdown`, `.mdown`, `.mkd`, `.mkdn`, `.mdwn`, `.mdx`, `.txt`. Shows in Finder's "Open With". |
| **Auto-Updates** | Checks every 4 hours. Background download. One-click "Restart & Install" with release notes. |

## Power User Features

These are already built and shipping — the details that turn "clever idea" into "this person thought through every edge case":

**Save Mine as New File.** During merge conflicts, you can fork your version to a new file while accepting the AI's changes in the original. A power-user escape hatch for the worst case.

**Smart hunk grouping.** When the AI changes a heading and its body text, the diff resolver groups them into one logical decision instead of making you accept/reject each line individually.

**Copy full file with path (⌘⌥C).** With a selection, copies your text prefixed with file path and line numbers. With no selection, copies the *entire file* with the path header — the "paste this whole file into Claude" shortcut.

**Configurable auto-save delay.** Not just on/off — a knob from 1 to 10 seconds. 1-second save means the AI always reads your latest. 10-second save gives you a buffer to change your mind.

**Multi-window with independent sessions.** Each window remembers its own open files, tabs, and state. Open one window for docs and another for code notes.

**Find in Folder (⌘⇧G).** Project-wide search with case sensitivity. Results grouped by file with context lines.

## What It Doesn't Do

No cloud sync. No real-time collaboration. No plugin system. No Vim mode. No WYSIWYG. No proprietary format. No account creation. No subscription. No telemetry.

Your files are plain markdown on disk. Open them with anything, anywhere, forever.

## Security

This app underwent an adversarial security review with comprehensive hardening:

- **XSS prevention** — DOMPurify sanitizes all markdown before rendering in the preview pane
- **Sandbox enabled** — Chromium sandbox and context isolation enforced on all windows
- **Filesystem access control** — Path validation limits access to home directory and /Volumes; sensitive directories (.ssh, .gnupg, .aws) blocked
- **Path traversal protection** — `local-resource://` protocol restricted to image file extensions
- **URL scheme allowlisting** — `shell.openExternal` limited to https://, http://, mailto:
- **Content Security Policy** — Tightened CSP on settings and update dialogs
- **No network calls** — except auto-update checks to GitHub Releases

## Getting Started

### From release

Download the `.dmg` from [Releases](https://github.com/avanrossum/sidemark/releases/latest), open it, drag to Applications.

### From source

```bash
cd simple_markdown_editor
npm install
npm run dev
```

| Command | Description |
|---------|-------------|
| `npm run dev` | Development mode with hot reload |
| `npm run build` | Production build |
| `npm run release` | Signed build + GitHub release |

Release builds require Apple Developer ID credentials (APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID) for code signing and notarization.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron 33 |
| UI | React 18 |
| Editor | CodeMirror 6 |
| Markdown | marked (GitHub Flavored Markdown) |
| Build | Vite 6 + electron-builder |
| Security | DOMPurify, sandbox, CSP |
| File Watching | chokidar |
| Diffing | diff (three-way merge, git gutter) |
| Updates | electron-updater (GitHub Releases) |
| Language | JavaScript (TypeScript migration planned) |

## Repository Structure

The application source lives in `simple_markdown_editor/`. The outer repository holds project-level files (README, license, changelog, roadmap).

```
.
├── README.md
├── LICENSE
├── CHANGELOG.md
├── ROADMAP.md
├── Architecture.md
└── simple_markdown_editor/
    ├── package.json
    ├── vite.config.js
    ├── electron-builder.config.js
    ├── build/              # App icon and entitlements
    ├── scripts/            # Icon generation and release scripts
    └── src/
        ├── main/           # Electron main process (window lifecycle, IPC, file I/O)
        ├── renderer/       # React UI (editor, preview, file browser, tabs, toolbar)
        ├── settings/       # Settings overlay
        └── update-dialog/  # Auto-update UI
```

## Contributing

SideMark is free and open source under the MIT license. Contributions are welcome — open an issue first if you're planning something big.

## License

[MIT](LICENSE) — made by [MipYip](https://mipyip.com)
