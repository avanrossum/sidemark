import React, { useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function Preview({ content, theme, editorRef }) {
  const previewRef = useRef(null);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef(null);

  // Parse markdown
  const html = useMemo(() => {
    try {
      return marked.parse(content || '');
    } catch {
      return '<p>Error rendering markdown</p>';
    }
  }, [content]);

  // ── Synchronized Scrolling ──

  useEffect(() => {
    if (!editorRef?.current) return;

    const unsubscribe = editorRef.current.onScroll(() => {
      if (isScrolling.current) return;

      const info = editorRef.current.getScrollInfo();
      const preview = previewRef.current;
      if (!preview) return;

      const editorScrollFraction =
        info.scrollHeight <= info.clientHeight
          ? 0
          : info.scrollTop / (info.scrollHeight - info.clientHeight);

      const previewMaxScroll = preview.scrollHeight - preview.clientHeight;
      if (previewMaxScroll > 0) {
        isScrolling.current = true;
        preview.scrollTop = editorScrollFraction * previewMaxScroll;

        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          isScrolling.current = false;
        }, 50);
      }
    });

    return unsubscribe;
  }, [editorRef]);

  return (
    <div
      ref={previewRef}
      className="preview-container"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
