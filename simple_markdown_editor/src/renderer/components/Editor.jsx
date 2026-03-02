import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// ── Editor Theme Factory ──
// Built dynamically so CodeMirror re-measures font metrics when settings change

const DEFAULT_MONO_FONT = "'SF Mono', 'Menlo', 'Monaco', Consolas, monospace";

function buildEditorTheme(isDark, fontSize, fontFamily) {
  const resolvedFont = fontFamily && fontFamily !== 'default' ? fontFamily : DEFAULT_MONO_FONT;
  const resolvedSize = `${fontSize || 14}px`;

  return EditorView.theme({
    '&': {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontSize: resolvedSize,
      fontFamily: resolvedFont,
      height: '100%',
    },
    '.cm-content': {
      padding: '12px 16px',
      caretColor: 'var(--accent)',
      lineHeight: '1.6',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--accent)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: 'var(--accent-selection) !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'color-mix(in srgb, var(--bg-elevated) 60%, transparent)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-surface)',
      color: 'var(--text-muted)',
      border: 'none',
      borderRight: '1px solid var(--border-color)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--bg-elevated)',
      color: 'var(--text-secondary)',
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
    '&.cm-focused': {
      outline: 'none',
    },
  }, { dark: isDark });
}

// ── Markdown Highlight Style ──

const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: 'bold', fontSize: '1.4em' },
  { tag: tags.heading2, fontWeight: 'bold', fontSize: '1.25em' },
  { tag: tags.heading3, fontWeight: 'bold', fontSize: '1.1em' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: 'var(--accent)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--accent)' },
  { tag: tags.monospace, fontFamily: 'var(--font-mono)', backgroundColor: 'var(--bg-elevated)', borderRadius: '3px', padding: '0 3px' },
  { tag: tags.quote, color: 'var(--text-secondary)', fontStyle: 'italic' },
  { tag: tags.meta, color: 'var(--text-muted)' },
]);

// ── Formatting Actions ──

const FORMATTING = {
  bold: { wrap: '**', placeholder: 'bold text' },
  italic: { wrap: '_', placeholder: 'italic text' },
  strikethrough: { wrap: '~~', placeholder: 'strikethrough text' },
  code: { wrap: '`', placeholder: 'code' },
  h1: { prefix: '# ', placeholder: 'Heading 1' },
  h2: { prefix: '## ', placeholder: 'Heading 2' },
  h3: { prefix: '### ', placeholder: 'Heading 3' },
  quote: { prefix: '> ', placeholder: 'quote' },
  ul: { prefix: '- ', placeholder: 'list item' },
  ol: { prefix: '1. ', placeholder: 'list item' },
  link: { template: '[${text}](url)', placeholder: 'link text' },
  image: { template: '![${text}](url)', placeholder: 'alt text' },
  codeblock: { blockWrap: '```\n', blockWrapEnd: '\n```', placeholder: 'code' },
  hr: { insert: '\n---\n' },
};

const Editor = forwardRef(function Editor({ content, onChange, settings, theme }, ref) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const isExternalUpdate = useRef(false);

  onChangeRef.current = onChange;

  // ── Create Editor ──

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isExternalUpdate.current) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const extensions = [
      history(),
      drawSelection(),
      highlightActiveLine(),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      syntaxHighlighting(markdownHighlightStyle),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      updateListener,
      EditorView.lineWrapping,
      buildEditorTheme(theme === 'dark', settings?.fontSize, settings?.fontFamily),
    ];

    if (settings?.showLineNumbers) {
      extensions.push(lineNumbers());
    }

    const state = EditorState.create({
      doc: content || '',
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Recreate on theme, font, or settings changes that require full rebuild
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, settings?.showLineNumbers, settings?.fontFamily, settings?.fontSize]);

  // ── Sync Content from External Changes ──

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (content !== currentDoc) {
      isExternalUpdate.current = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content || '' },
      });
      isExternalUpdate.current = false;
    }
  }, [content]);

  // ── Expose Formatting API ──

  useImperativeHandle(ref, () => ({
    applyFormatting(action) {
      const view = viewRef.current;
      if (!view) return;

      const fmt = FORMATTING[action];
      if (!fmt) return;

      const { from, to } = view.state.selection.main;
      const hasSelection = from !== to;
      const selected = hasSelection ? view.state.sliceDoc(from, to) : '';

      // ── Insert (hr) ──
      if (fmt.insert) {
        view.dispatch({
          changes: { from, to, insert: fmt.insert },
          selection: { anchor: from + fmt.insert.length },
        });
        view.focus();
        return;
      }

      // ── Wrap formatting (bold, italic, strikethrough, code) — toggleable ──
      if (fmt.wrap) {
        const marker = fmt.wrap;
        if (hasSelection) {
          // Check if markers exist around the selection
          const beforeStart = Math.max(0, from - marker.length);
          const afterEnd = Math.min(view.state.doc.length, to + marker.length);
          const before = view.state.sliceDoc(beforeStart, from);
          const after = view.state.sliceDoc(to, afterEnd);

          if (before === marker && after === marker) {
            // Remove wrapping markers around selection
            view.dispatch({
              changes: [
                { from: beforeStart, to: from, insert: '' },
                { from: to, to: afterEnd, insert: '' },
              ],
              selection: { anchor: beforeStart, head: to - marker.length },
            });
          } else if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= marker.length * 2) {
            // Selection includes the markers — strip them
            const inner = selected.slice(marker.length, -marker.length);
            view.dispatch({
              changes: { from, to, insert: inner },
              selection: { anchor: from, head: from + inner.length },
            });
          } else {
            // Add wrapping
            const insert = `${marker}${selected}${marker}`;
            view.dispatch({
              changes: { from, to, insert },
              selection: { anchor: from, head: from + insert.length },
            });
          }
        } else {
          // No selection — insert empty markers and position cursor between
          view.dispatch({
            changes: { from, to, insert: `${marker}${marker}` },
            selection: { anchor: from + marker.length },
          });
        }
        view.focus();
        return;
      }

      // ── Prefix formatting (headings, quotes, lists) — smart toggle ──
      if (fmt.prefix) {
        const startLine = view.state.doc.lineAt(from);
        const endLine = hasSelection ? view.state.doc.lineAt(Math.max(from, to - 1)) : startLine;

        const lines = [];
        for (let i = startLine.number; i <= endLine.number; i++) {
          lines.push(view.state.doc.line(i));
        }

        const isHeading = ['h1', 'h2', 'h3'].includes(action);
        const isList = ['ul', 'ol'].includes(action);

        if (isHeading) {
          // ── Headings: cycle levels, toggle off ──
          const targetLevel = action === 'h1' ? 1 : action === 'h2' ? 2 : 3;
          const headingMatch = startLine.text.match(/^(#{1,6})\s/);
          const currentLevel = headingMatch ? headingMatch[1].length : 0;

          if (currentLevel === targetLevel) {
            // Same level → remove heading from all selected lines
            const changes = [];
            for (const line of lines) {
              const match = line.text.match(/^#{1,6}\s/);
              if (match) {
                changes.push({ from: line.from, to: line.from + match[0].length, insert: '' });
              }
            }
            if (changes.length > 0) view.dispatch({ changes });
          } else {
            // Different level or no heading → set to target level
            const newPrefix = '#'.repeat(targetLevel) + ' ';
            const changes = lines.map((line) => {
              const match = line.text.match(/^#{1,6}\s/);
              if (match) {
                return { from: line.from, to: line.from + match[0].length, insert: newPrefix };
              }
              return { from: line.from, to: line.from, insert: newPrefix };
            });
            view.dispatch({ changes });
          }
        } else if (isList) {
          // ── Lists: multi-line, toggle, swap, continue numbering ──
          const isUl = action === 'ul';

          // Check what each line currently has
          const lineStates = lines.map((line) => {
            const ulMatch = line.text.match(/^- /);
            const olMatch = line.text.match(/^(\d+)\.\s/);
            return {
              line,
              isUl: !!ulMatch,
              isOl: !!olMatch,
              olNum: olMatch ? parseInt(olMatch[1], 10) : 0,
              prefixLen: ulMatch ? 2 : (olMatch ? olMatch[0].length : 0),
            };
          });

          const allMatchType = isUl
            ? lineStates.every((s) => s.isUl)
            : lineStates.every((s) => s.isOl);

          if (allMatchType) {
            // All lines already have this list type → toggle off (remove)
            const changes = lineStates.map((s) => ({
              from: s.line.from,
              to: s.line.from + s.prefixLen,
              insert: '',
            }));
            view.dispatch({ changes });
          } else {
            // Apply list (add or swap type)
            let startNum = 1;
            if (!isUl) {
              // Continue numbering from preceding list items
              if (startLine.number > 1) {
                const prevLine = view.state.doc.line(startLine.number - 1);
                const prevMatch = prevLine.text.match(/^(\d+)\.\s/);
                if (prevMatch) {
                  startNum = parseInt(prevMatch[1], 10) + 1;
                }
              }
            }

            const changes = lineStates.map((s, idx) => {
              const newPrefix = isUl ? '- ' : `${startNum + idx}. `;
              return {
                from: s.line.from,
                to: s.line.from + s.prefixLen,
                insert: newPrefix,
              };
            });
            view.dispatch({ changes });
          }
        } else {
          // ── Quote or other prefix — toggle ──
          const allHavePrefix = lines.every((line) => line.text.startsWith(fmt.prefix));

          if (allHavePrefix) {
            const changes = lines.map((line) => ({
              from: line.from,
              to: line.from + fmt.prefix.length,
              insert: '',
            }));
            view.dispatch({ changes });
          } else {
            const changes = lines.map((line) => ({
              from: line.from,
              to: line.from,
              insert: fmt.prefix,
            }));
            view.dispatch({ changes });
          }
        }

        view.focus();
        return;
      }

      // ── Block wrap (code block) — toggleable ──
      if (fmt.blockWrap) {
        if (hasSelection) {
          const trimmed = selected.trim();
          if (trimmed.startsWith(fmt.blockWrap.trim()) && trimmed.endsWith(fmt.blockWrapEnd.trim())) {
            // Remove code block wrapping
            const inner = trimmed.slice(fmt.blockWrap.trim().length, trimmed.length - fmt.blockWrapEnd.trim().length).trim();
            view.dispatch({
              changes: { from, to, insert: inner },
              selection: { anchor: from + inner.length },
            });
          } else {
            const insert = `${fmt.blockWrap}${selected}${fmt.blockWrapEnd}`;
            view.dispatch({
              changes: { from, to, insert },
              selection: { anchor: from + insert.length },
            });
          }
        } else {
          const insert = `${fmt.blockWrap}${fmt.blockWrapEnd}`;
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor: from + fmt.blockWrap.length },
          });
        }
        view.focus();
        return;
      }

      // ── Template (link, image) ──
      if (fmt.template) {
        const text = hasSelection ? selected : fmt.placeholder;
        const insert = fmt.template.replace('${text}', text);
        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor: from + insert.length },
        });
        view.focus();
        return;
      }
    },

    getView() {
      return viewRef.current;
    },

    getScrollInfo() {
      const view = viewRef.current;
      if (!view) return { scrollTop: 0, scrollHeight: 1, clientHeight: 1 };
      const scroller = view.scrollDOM;
      return {
        scrollTop: scroller.scrollTop,
        scrollHeight: scroller.scrollHeight,
        clientHeight: scroller.clientHeight,
      };
    },

    getTopVisibleLine() {
      const view = viewRef.current;
      if (!view) return 0;
      const top = view.scrollDOM.scrollTop;
      const block = view.lineBlockAtHeight(top);
      return view.state.doc.lineAt(block.from).number;
    },

    getLineTop(lineNum) {
      const view = viewRef.current;
      if (!view) return 0;
      const lineCount = view.state.doc.lines;
      const clampedLine = Math.max(1, Math.min(lineNum, lineCount));
      const pos = view.state.doc.line(clampedLine).from;
      const block = view.lineBlockAt(pos);
      return block.top;
    },

    scrollToPixel(px) {
      const view = viewRef.current;
      if (!view) return;
      view.scrollDOM.scrollTop = px;
    },

    getScrollDOM() {
      const view = viewRef.current;
      return view ? view.scrollDOM : null;
    },

    onScroll(callback) {
      const view = viewRef.current;
      if (!view) return () => {};
      const handler = () => callback();
      view.scrollDOM.addEventListener('scroll', handler, { passive: true });
      return () => view.scrollDOM.removeEventListener('scroll', handler);
    },
  }), []);

  return <div ref={containerRef} className="editor-container" />;
});

export default Editor;
