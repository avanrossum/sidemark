# Simple Markdown Editor

A stupid simple markdown editor for macOS. Fast, focused, and free of bloat.

Built with Electron, React, and CodeMirror 6. A clean three-pane layout that gets out of your way.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

**Editor**
- CodeMirror 6 with markdown syntax highlighting
- Formatting toolbar — bold, italic, strikethrough, headings, lists, code blocks, links, images, horizontal rules
- Search and replace (Cmd+F / Cmd+H)
- Toggleable line numbers

**Preview**
- Live markdown preview with GitHub Flavored Markdown
- Bidirectional scroll sync between editor and preview
- Local image support

**File Management**
- File browser with expandable directory tree
- Tabs with dirty indicators
- Right-click context menu — new file, new folder, rename
- Session restore — open tabs and folder persist across restarts
- File watching with external change detection and diff resolution

**Customization**
- Dark and light themes (or follow system)
- 7 accent colors
- Editor and preview font family selectors
- Font size control

## Screenshot

*Coming soon*

## Getting Started

```bash
cd simple_markdown_editor
npm install
npm run dev
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development mode with hot reload |
| `npm run build` | Production build |
| `npm run release` | Signed build + GitHub release |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron 33 |
| UI | React 18 |
| Editor | CodeMirror 6 |
| Markdown | marked |
| Build | Vite 6 + electron-builder |
| Language | JavaScript |

## Repository Structure

The application source lives in the `simple_markdown_editor/` subdirectory. This is intentional — the outer repository holds project-level files (this README, license, changelog, roadmap) while the inner directory is the self-contained Electron app with its own `package.json`, build config, and source tree.

```
.
├── README.md
├── LICENSE
├── CHANGELOG.md
├── ROADMAP.md
└── simple_markdown_editor/
    ├── package.json
    ├── vite.config.js
    ├── electron-builder.config.js
    └── src/
        ├── main/          # Electron main process
        ├── renderer/      # React UI (editor, preview, file browser)
        └── settings/      # Settings overlay
```

## Status

v0.1.9 is feature-complete but currently untested and unreviewed. Incremental code review and testing will be completed before work on v0.2.0 begins. See [ROADMAP.md](ROADMAP.md) for what's planned.

## License

[MIT](LICENSE) — made by [mipyip](https://mipyip.com)
