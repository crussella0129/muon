import React, { useCallback } from 'react';
import useProjectStore from '../stores/projectStore';
import EditorComponent from './EditorComponent';

export default function ScreenCanvas({ screenId, config }) {
  const clearComponentSelection = useProjectStore((s) => s.clearComponentSelection);
  const moveComponent = useProjectStore((s) => s.moveComponent);

  const children = config.children || [];
  const layoutMode = config.layoutMode || 'flow';

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      clearComponentSelection();
    }
  };

  const handleReorderDrop = useCallback(
    (draggedId, targetIndex) => {
      moveComponent(screenId, draggedId, targetIndex);
    },
    [screenId, moveComponent]
  );

  const handleBottomDrop = (e) => {
    if (layoutMode !== 'flow') return;
    const draggedId = e.dataTransfer.getData('application/muon-reorder');
    if (draggedId) {
      e.preventDefault();
      e.stopPropagation();
      moveComponent(screenId, draggedId, children.length);
    }
  };

  const handleBottomDragOver = (e) => {
    if (layoutMode !== 'flow' || !e.dataTransfer.types.includes('application/muon-reorder')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div
      className={`editor-canvas ${layoutMode === 'flow' ? 'layout-flow' : 'layout-free'}`}
      style={{
        width: config.width || 800,
        height: config.height || 600,
        backgroundColor: config.backgroundColor || '#ffffff',
      }}
      onClick={handleBackgroundClick}
    >
      {children.length === 0 && (
        <div className="canvas-empty-hint">
          <div className="canvas-empty-icon">+</div>
          <div className="canvas-empty-text">Drag components here</div>
        </div>
      )}
      {children.map((comp, i) => (
        <EditorComponent
          key={comp.id}
          comp={comp}
          windowId={screenId}
          layoutMode={layoutMode}
          index={i}
          onReorderDrop={handleReorderDrop}
        />
      ))}
      {layoutMode === 'flow' && children.length > 0 && (
        <div
          className="canvas-drop-tail"
          onDragOver={handleBottomDragOver}
          onDrop={handleBottomDrop}
        />
      )}
    </div>
  );
}
