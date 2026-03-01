import React, { useMemo } from 'react';
import { diffLines } from 'diff';

export default function DiffView({ filePath, currentContent, externalContent, onResolve }) {
  const fileName = filePath ? filePath.split('/').pop() : 'file';

  const diffParts = useMemo(() => {
    return diffLines(currentContent, externalContent);
  }, [currentContent, externalContent]);

  return (
    <div className="modal-overlay">
      <div className="modal diff-modal">
        <h2>External Changes Detected</h2>
        <p className="diff-description">
          <strong>{fileName}</strong> has been modified outside the editor.
        </p>

        <div className="diff-content">
          <div className="diff-header">
            <span className="diff-label diff-label--current">Your version</span>
            <span className="diff-label diff-label--external">External version</span>
          </div>
          <div className="diff-body">
            {diffParts.map((part, i) => {
              let className = 'diff-line';
              if (part.added) className += ' diff-line--added';
              else if (part.removed) className += ' diff-line--removed';

              return (
                <div key={i} className={className}>
                  <span className="diff-indicator">
                    {part.added ? '+' : part.removed ? '-' : ' '}
                  </span>
                  <pre className="diff-text">{part.value}</pre>
                </div>
              );
            })}
          </div>
        </div>

        <div className="diff-actions">
          <button className="btn btn-ghost" onClick={() => onResolve('cancel')}>
            Keep Mine (Cancel)
          </button>
          <button className="btn btn-default" onClick={() => onResolve('save-as-new')}>
            Save Mine as New File
          </button>
          <button className="btn btn-primary" onClick={() => onResolve('overwrite')}>
            Accept External Version
          </button>
        </div>
      </div>
    </div>
  );
}
