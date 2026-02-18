import React from 'react';
import useProjectStore from '../stores/projectStore';

export default function Toolbar({ onNew, onOpen, onSave, onSaveAs, onGenerate, onBuildRun }) {
  const dirty = useProjectStore((s) => s.dirty);
  const projectPath = useProjectStore((s) => s.projectPath);
  const projectName = useProjectStore((s) => s.project.meta.name);
  const viewMode = useProjectStore((s) => s.viewMode);
  const setViewMode = useProjectStore((s) => s.setViewMode);

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
      <div className="toolbar-center">
        <button
          className={`toolbar-btn toolbar-btn-mode ${viewMode === 'editor' ? 'active editor-active' : ''}`}
          onClick={() => setViewMode('editor')}
        >
          Editor
        </button>
        <button
          className={`toolbar-btn toolbar-btn-mode ${viewMode === 'flow' ? 'active flow-active' : ''}`}
          onClick={() => setViewMode('flow')}
        >
          Flow
        </button>
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
        <span className="toolbar-separator">|</span>
        <button className="toolbar-btn toolbar-btn-green" onClick={onGenerate} title="Generate Project (Ctrl+G)">
          Generate
        </button>
        <button className="toolbar-btn toolbar-btn-blue" onClick={onBuildRun} title="Build &amp; Run">
          Build &amp; Run
        </button>
      </div>
    </div>
  );
}
