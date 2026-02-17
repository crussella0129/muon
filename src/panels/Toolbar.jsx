import React from 'react';
import useProjectStore from '../stores/projectStore';

export default function Toolbar({ onNew, onOpen, onSave, onSaveAs }) {
  const dirty = useProjectStore((s) => s.dirty);
  const projectPath = useProjectStore((s) => s.projectPath);
  const projectName = useProjectStore((s) => s.project.meta.name);

  const displayName = projectPath
    ? projectPath.split(/[\\/]/).pop()
    : 'Untitled Project';

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-brand">Muon</span>
        <span className="toolbar-separator">|</span>
        <span className="toolbar-project">
          {projectName || displayName}
          {dirty && <span className="dirty-indicator">*</span>}
        </span>
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={onNew} title="New Project (Ctrl+N)">
          New
        </button>
        <button className="toolbar-btn" onClick={onOpen} title="Open Project (Ctrl+O)">
          Open
        </button>
        <button className="toolbar-btn" onClick={onSave} title="Save (Ctrl+S)">
          Save
        </button>
        <button className="toolbar-btn" onClick={onSaveAs} title="Save As (Ctrl+Shift+S)">
          Save As
        </button>
      </div>
    </div>
  );
}
