# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- Settings panel: theme (dark/light/system), accent color (7 options), font size, font family, word wrap, line numbers, spell check
- About section with links to mipyip.com and GitHub
- Dark and light themes following design standards
- CSS custom properties theming system with 7 accent color options
- macOS window integration: hidden title bar with traffic light positioning
- Application menu: File (new, open, save, duplicate, recent), Edit (undo, redo, find, replace), View, Window, Help
- Window bounds persistence (saves position/size between sessions)
- App icon SVG source and generation script
- electron-builder configuration for macOS with code signing and notarization
- Release script for automated build + sign + GitHub release
