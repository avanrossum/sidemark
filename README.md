# Simple Markdown Editor

A stupid simple markdown editor for macOS. Fast, focused, and free of bloat.

I live in markdown daily. Every app I tried was either bloated, expensive, or buggy — so I built the editor I actually wanted to use. No account required, no subscription, no electron-sized feature creep. Just a clean editor, a live preview, and a file browser that stays out of your way.

[![Download](https://img.shields.io/github/v/release/avanrossum/a_simple_markdown_editor?label=Download&color=blue)](https://github.com/avanrossum/a_simple_markdown_editor/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Download

Grab the latest `.dmg` from [GitHub Releases](https://github.com/avanrossum/a_simple_markdown_editor/releases/latest). Open it, drag to Applications, done.

macOS only. Requires macOS 12+.

## Screenshots

![Simple Markdown Editor — editor and live preview](screenshot.png)

![Settings](screenshot-settings.png)

## What it does

**Editor** — CodeMirror 6 with markdown syntax highlighting, a formatting toolbar, search and replace, and toggleable line numbers. Everything you need, nothing you don't.

**Live Preview** — GitHub Flavored Markdown rendered in real time. Bidirectional scroll sync keeps the editor and preview aligned. Local and remote images just work.

**File Browser** — Expandable directory tree, tabs with dirty indicators, right-click context menu for new files, folders, and rename. Session restore remembers your open tabs and folder across restarts.

**Customization** — Dark and light themes (or follow system), 7 accent colors, configurable editor and preview fonts, font size control.

**Auto-Updates** — The app checks for updates automatically and lets you install with one click.

## What it doesn't do

No cloud sync. No collaboration. No plugin system. No Vim mode. No proprietary format lock-in.

Your files are markdown on disk. Open them with anything, anywhere, forever.

## Getting Started

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

The application source lives in `simple_markdown_editor/`. The outer repository holds project-level files (README, license, changelog, roadmap).

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
        ├── settings/      # Settings overlay
        └── update-dialog/ # Auto-update UI
```

## Contributing

This is a personal project built for my own use, but contributions are welcome. Open an issue first if you're planning something big.

## License

[MIT](LICENSE) — made by [mipyip](https://mipyip.com)
