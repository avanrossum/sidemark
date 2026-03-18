import React, { useMemo, useState, useCallback } from 'react';
import { diffLines } from 'diff';

// ── Group diff parts into hunks ──
// A hunk is a contiguous block of changes (added + removed lines together)
// separated by unchanged context lines.

// Max context lines between changes to still merge them into one hunk.
// diffLines often splits a single logical change (e.g. heading + body)
// across two change blocks separated by a blank line. Merging them
// makes the UI show one clickable block per logical change.
const MERGE_CONTEXT_THRESHOLD = 2;

function buildHunks(parts) {
  const hunks = [];
  let currentHunk = null;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.added || part.removed) {
      if (!currentHunk) {
        currentHunk = { id: hunks.length, parts: [], hasRemoved: false, hasAdded: false };
      }
      currentHunk.parts.push(part);
      if (part.removed) currentHunk.hasRemoved = true;
      if (part.added) currentHunk.hasAdded = true;
    } else {
      // Context line — check if it's a short gap between two change blocks
      const contextLines = part.value.split('\n').length - 1;
      const nextHasChange = parts.slice(i + 1).some((p) => p.added || p.removed);

      if (currentHunk && contextLines <= MERGE_CONTEXT_THRESHOLD && nextHasChange) {
        // Short context between changes — absorb into current hunk
        currentHunk.parts.push(part);
      } else {
        // Real context boundary — flush current hunk
        if (currentHunk) {
          hunks.push(currentHunk);
          currentHunk = null;
        }
        hunks.push({ id: hunks.length, parts: [part], isContext: true });
      }
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

// ── Build merged content from hunks + selections ──

function buildMergedContent(hunks, selections) {
  let result = '';
  for (const hunk of hunks) {
    if (hunk.isContext) {
      result += hunk.parts[0].value;
    } else {
      const choice = selections[hunk.id];
      for (const part of hunk.parts) {
        // Context parts absorbed into a change hunk — always include
        if (!part.added && !part.removed) {
          result += part.value;
        } else if (choice === 'mine' && part.removed) {
          result += part.value;
        } else if (choice === 'theirs' && part.added) {
          result += part.value;
        }
      }
    }
  }
  return result;
}

// ── Split a diff part value into renderable lines ──
// diff's value always ends with \n, so split and drop the trailing empty string

function splitLines(value) {
  const lines = value.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

export default function DiffView({ filePath, currentContent, externalContent, onResolve }) {
  const fileName = filePath ? filePath.split('/').pop() : 'file';

  const diffParts = useMemo(() => {
    return diffLines(currentContent, externalContent);
  }, [currentContent, externalContent]);

  const hunks = useMemo(() => buildHunks(diffParts), [diffParts]);

  // Initialize all change hunks to 'mine'
  const [selections, setSelections] = useState(() => {
    const initial = {};
    for (const hunk of hunks) {
      if (!hunk.isContext) {
        initial[hunk.id] = 'mine';
      }
    }
    return initial;
  });

  const toggleHunk = useCallback((hunkId) => {
    setSelections((prev) => ({
      ...prev,
      [hunkId]: prev[hunkId] === 'mine' ? 'theirs' : 'mine',
    }));
  }, []);

  const selectAll = useCallback((choice) => {
    setSelections((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = choice;
      }
      return next;
    });
  }, []);

  const changeHunks = hunks.filter((h) => !h.isContext);
  const allMine = changeHunks.every((h) => selections[h.id] === 'mine');
  const allTheirs = changeHunks.every((h) => selections[h.id] === 'theirs');

  const handleApply = useCallback(() => {
    if (allMine) {
      onResolve('cancel');
    } else if (allTheirs) {
      onResolve('overwrite');
    } else {
      const merged = buildMergedContent(hunks, selections);
      onResolve('merge', merged);
    }
  }, [hunks, selections, allMine, allTheirs, onResolve]);

  return (
    <div className="modal-overlay">
      <div className="modal diff-modal">
        <h2>External Changes Detected</h2>
        <p className="diff-description">
          <strong>{fileName}</strong> has been modified outside the editor.
          Click a change block to toggle between your version and theirs.
        </p>

        <div className="diff-toolbar">
          <button
            className={`btn btn-sm ${allMine ? 'btn-active' : 'btn-ghost'}`}
            onClick={() => selectAll('mine')}
          >
            Keep all mine
          </button>
          <button
            className={`btn btn-sm ${allTheirs ? 'btn-active' : 'btn-ghost'}`}
            onClick={() => selectAll('theirs')}
          >
            Accept all theirs
          </button>
          <span className="diff-toolbar-summary">
            {changeHunks.length} {changeHunks.length === 1 ? 'change' : 'changes'}
          </span>
        </div>

        <div className="diff-content">
          <div className="diff-body">
            {hunks.map((hunk) => {
              if (hunk.isContext) {
                const lines = splitLines(hunk.parts[0].value);
                return (
                  <div key={hunk.id} className="diff-hunk">
                    {lines.map((line, i) => (
                      <div key={i} className="diff-line">
                        <span className="diff-indicator"> </span>
                        <pre className="diff-text">{line}</pre>
                      </div>
                    ))}
                  </div>
                );
              }

              const choice = selections[hunk.id];
              const acceptTheirs = choice === 'theirs';

              return (
                <div
                  key={hunk.id}
                  className={`diff-hunk diff-hunk--change ${acceptTheirs ? 'diff-hunk--accept' : 'diff-hunk--reject'}`}
                  onClick={() => toggleHunk(hunk.id)}
                >
                  <div className="diff-hunk-badge">
                    {acceptTheirs ? 'theirs' : 'mine'}
                  </div>
                  {hunk.parts.map((part, pi) => {
                    const lines = splitLines(part.value);
                    const isKept = (part.removed && !acceptTheirs) || (part.added && acceptTheirs);
                    const isDimmed = (part.removed && acceptTheirs) || (part.added && !acceptTheirs);

                    return lines.map((line, li) => (
                      <div
                        key={`${pi}-${li}`}
                        className={`diff-line ${part.added ? 'diff-line--added' : ''} ${part.removed ? 'diff-line--removed' : ''} ${isKept ? 'diff-line--kept' : ''} ${isDimmed ? 'diff-line--dimmed' : ''}`}
                      >
                        <span className="diff-indicator">
                          {part.added ? '+' : part.removed ? '-' : ' '}
                        </span>
                        <pre className="diff-text">{line}</pre>
                      </div>
                    ));
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="diff-actions">
          <button className="btn btn-ghost" onClick={() => onResolve('cancel')}>
            Cancel
          </button>
          <button className="btn btn-default" onClick={() => onResolve('save-as-new')}>
            Save Mine as New File
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            {allMine ? 'Keep Mine' : allTheirs ? 'Accept Theirs' : 'Apply Selection'}
          </button>
        </div>
      </div>
    </div>
  );
}
