import React, { useRef, useEffect, useState, useCallback } from 'react';

const { electronAPI } = window;

// ── Tab Context Menu ──

function TabContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEscape);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 8;
      const maxY = window.innerHeight - rect.height - 8;
      if (x > maxX) menuRef.current.style.left = `${maxX}px`;
      if (y > maxY) menuRef.current.style.top = `${maxY}px`;
    }
  }, [x, y]);

  return (
    <div ref={menuRef} className="context-menu" style={{ left: x, top: y }}>
      {items.map((item, i) => (
        item.separator ? (
          <div key={i} className="context-menu-separator" />
        ) : (
          <div
            key={i}
            className={`context-menu-item ${item.disabled ? 'context-menu-item--disabled' : ''}`}
            onClick={() => {
              if (item.disabled) return;
              item.action();
              onClose();
            }}
          >
            {item.label}
          </div>
        )
      ))}
    </div>
  );
}

// ── Tab Bar ──

export default function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onCloseOtherTabs, onCloseTabsToRight, onNewTab }) {
  const tabListRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);

  // ── Auto-scroll active tab into view ──
  useEffect(() => {
    if (!tabListRef.current || !activeTabId) return;
    const activeEl = tabListRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [activeTabId, tabs.length]);

  // ── Context Menu ──
  const handleContextMenu = useCallback((e, tab, index) => {
    e.preventDefault();
    e.stopPropagation();

    const hasSavedFile = !!tab.filePath;
    const hasTabsToRight = index < tabs.length - 1;
    const hasOtherTabs = tabs.length > 1;

    const items = [];

    // File actions (only for saved files)
    if (hasSavedFile) {
      items.push(
        { label: 'Show in Finder', action: () => electronAPI.showInFolder(tab.filePath) },
        { label: 'Copy Path', action: () => navigator.clipboard.writeText(tab.filePath) },
        { separator: true },
      );
    }

    // Tab management
    items.push(
      { label: 'Close Tab', action: () => onCloseTab(tab.id) },
      { label: 'Close Other Tabs', action: () => onCloseOtherTabs(tab.id), disabled: !hasOtherTabs },
      { label: 'Close Tabs to the Right', action: () => onCloseTabsToRight(tab.id), disabled: !hasTabsToRight },
    );

    setContextMenu({ x: e.clientX, y: e.clientY, items });
  }, [tabs, onCloseTab, onCloseOtherTabs, onCloseTabsToRight]);

  return (
    <div className="tab-bar">
      <div className="tab-list" ref={tabListRef}>
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            className={`tab ${tab.id === activeTabId ? 'tab--active' : ''} ${tab.dirty ? 'tab--dirty' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab, index)}
          >
            <span className="tab-name">{tab.name}</span>
            {tab.dirty && <span className="tab-dirty-dot" />}
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              title="Close tab"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button className="tab-new" onClick={onNewTab} title="New file">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>

      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
