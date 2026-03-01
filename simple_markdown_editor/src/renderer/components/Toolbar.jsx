import React from 'react';

const TOOLS = [
  { action: 'bold', label: 'Bold', shortcut: '⌘B', icon: 'B', className: 'tool-bold' },
  { action: 'italic', label: 'Italic', shortcut: '⌘I', icon: 'I', className: 'tool-italic' },
  { action: 'strikethrough', label: 'Strikethrough', icon: 'S', className: 'tool-strike' },
  { type: 'separator' },
  { action: 'h1', label: 'Heading 1', icon: 'H1' },
  { action: 'h2', label: 'Heading 2', icon: 'H2' },
  { action: 'h3', label: 'Heading 3', icon: 'H3' },
  { type: 'separator' },
  { action: 'ul', label: 'Bullet List', icon: 'list-ul' },
  { action: 'ol', label: 'Numbered List', icon: 'list-ol' },
  { action: 'quote', label: 'Quote', icon: 'quote' },
  { type: 'separator' },
  { action: 'code', label: 'Inline Code', icon: 'code' },
  { action: 'codeblock', label: 'Code Block', icon: 'codeblock' },
  { type: 'separator' },
  { action: 'link', label: 'Link', icon: 'link' },
  { action: 'image', label: 'Image', icon: 'image' },
  { action: 'hr', label: 'Horizontal Rule', icon: 'hr' },
];

function ToolIcon({ icon, className }) {
  switch (icon) {
    case 'B':
      return <span className={`tool-text ${className || ''}`}><strong>B</strong></span>;
    case 'I':
      return <span className={`tool-text ${className || ''}`}><em>I</em></span>;
    case 'S':
      return <span className={`tool-text ${className || ''}`}><s>S</s></span>;
    case 'H1':
      return <span className="tool-text tool-heading">H<sub>1</sub></span>;
    case 'H2':
      return <span className="tool-text tool-heading">H<sub>2</sub></span>;
    case 'H3':
      return <span className="tool-text tool-heading">H<sub>3</sub></span>;
    case 'list-ul':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
        </svg>
      );
    case 'list-ol':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
        </svg>
      );
    case 'quote':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      );
    case 'code':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
        </svg>
      );
    case 'codeblock':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4zM2 20h20v2H2z" />
        </svg>
      );
    case 'link':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
        </svg>
      );
    case 'image':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    case 'hr':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M2 11h20v2H2z" />
        </svg>
      );
    default:
      return <span className="tool-text">{icon}</span>;
  }
}

export default function Toolbar({ onAction }) {
  return (
    <div className="toolbar">
      {TOOLS.map((tool, i) =>
        tool.type === 'separator' ? (
          <div key={`sep-${i}`} className="toolbar-separator" />
        ) : (
          <button
            key={tool.action}
            className="toolbar-button"
            onClick={() => onAction(tool.action)}
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          >
            <ToolIcon icon={tool.icon} className={tool.className} />
          </button>
        )
      )}
    </div>
  );
}
