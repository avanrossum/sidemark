import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// ── Dark Theme ──

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 'var(--editor-font-size)',
    fontFamily: 'var(--editor-font-family)',
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
    backgroundColor: 'var(--accent-selection)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--bg-elevated)',
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
}, { dark: true });

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 'var(--editor-font-size)',
    fontFamily: 'var(--editor-font-family)',
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
    backgroundColor: 'var(--accent-selection)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--bg-elevated)',
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
}, { dark: false });

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
      theme === 'dark' ? darkTheme : lightTheme,
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
    // Only recreate on theme or settings changes that require full rebuild
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, settings?.showLineNumbers]);

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

      let insert;
      let cursorPos;

      if (fmt.insert) {
        insert = fmt.insert;
        cursorPos = from + insert.length;
      } else if (fmt.wrap) {
        if (hasSelection) {
          insert = `${fmt.wrap}${selected}${fmt.wrap}`;
          cursorPos = from + insert.length;
        } else {
          insert = `${fmt.wrap}${fmt.wrap}`;
          cursorPos = from + fmt.wrap.length;
        }
      } else if (fmt.prefix) {
        const line = view.state.doc.lineAt(from);
        insert = `${fmt.prefix}${hasSelection ? selected : ''}`;
        view.dispatch({
          changes: { from: line.from, to: hasSelection ? to : line.from, insert },
          selection: { anchor: line.from + insert.length },
        });
        view.focus();
        return;
      } else if (fmt.blockWrap) {
        if (hasSelection) {
          insert = `${fmt.blockWrap}${selected}${fmt.blockWrapEnd}`;
          cursorPos = from + insert.length;
        } else {
          insert = `${fmt.blockWrap}${fmt.blockWrapEnd}`;
          cursorPos = from + fmt.blockWrap.length;
        }
      } else if (fmt.template) {
        const text = hasSelection ? selected : fmt.placeholder;
        insert = fmt.template.replace('${text}', text);
        cursorPos = from + insert.length;
      }

      if (insert !== undefined) {
        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor: cursorPos },
        });
        view.focus();
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
