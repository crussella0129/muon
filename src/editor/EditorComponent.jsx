import React, { useCallback, useRef } from 'react';
import useProjectStore from '../stores/projectStore';

export default function EditorComponent({ comp, windowId, layoutMode, index, onReorderDrop }) {
  const selectedComponentId = useProjectStore((s) => s.selectedComponentId);
  const selectComponent = useProjectStore((s) => s.selectComponent);
  const updateComponent = useProjectStore((s) => s.updateComponent);
  const isSelected = selectedComponentId === comp.id;
  const dragRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    selectComponent(windowId, comp.id);
  };

  // --- Free mode: mouse drag to reposition ---
  const handleMouseDown = useCallback(
    (e) => {
      if (layoutMode !== 'free') return;
      e.stopPropagation();
      selectComponent(windowId, comp.id);

      const startX = e.clientX;
      const startY = e.clientY;
      const startTop = parseInt(comp.style?.top, 10) || 0;
      const startLeft = parseInt(comp.style?.left, 10) || 0;

      const onMove = (me) => {
        if (dragRef.current) {
          dragRef.current.style.top = `${startTop + me.clientY - startY}px`;
          dragRef.current.style.left = `${startLeft + me.clientX - startX}px`;
        }
      };
      const onUp = (me) => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        updateComponent(windowId, comp.id, {
          style: {
            ...comp.style,
            top: `${startTop + me.clientY - startY}px`,
            left: `${startLeft + me.clientX - startX}px`,
          },
        });
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [layoutMode, windowId, comp, selectComponent, updateComponent]
  );

  // --- Flow mode: HTML5 drag for reorder ---
  const handleDragStart = (e) => {
    if (layoutMode !== 'flow') return;
    e.dataTransfer.setData('application/muon-reorder', comp.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (layoutMode !== 'flow') return;
    if (e.dataTransfer.types.includes('application/muon-reorder')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e) => {
    if (layoutMode !== 'flow') return;
    const draggedId = e.dataTransfer.getData('application/muon-reorder');
    if (draggedId && draggedId !== comp.id && onReorderDrop) {
      e.preventDefault();
      e.stopPropagation();
      onReorderDrop(draggedId, index);
    }
  };

  const wrapperStyle = layoutMode === 'free'
    ? { position: 'absolute', top: comp.style?.top || '0px', left: comp.style?.left || '0px' }
    : {};

  return (
    <div
      ref={dragRef}
      className={`editor-component ${isSelected ? 'selected' : ''}`}
      style={wrapperStyle}
      onClick={handleClick}
      onMouseDown={layoutMode === 'free' ? handleMouseDown : undefined}
      draggable={layoutMode === 'flow'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ComponentPreview comp={comp} windowId={windowId} />
    </div>
  );
}

// Renders a realistic 1:1 preview of each component type
function ComponentPreview({ comp, windowId }) {
  const selectComponent = useProjectStore((s) => s.selectComponent);

  switch (comp.type) {
    case 'heading': {
      const level = comp.props.level || 1;
      const fontSize = { 1: 32, 2: 24, 3: 20, 4: 16, 5: 14, 6: 12 }[level];
      return (
        <div style={{ fontSize, fontWeight: 'bold', color: comp.style?.color || '#000', textAlign: comp.style?.textAlign }}>
          {comp.props.text || 'Heading'}
        </div>
      );
    }
    case 'paragraph':
      return (
        <p style={{ fontSize: 14, lineHeight: 1.5, color: comp.style?.color || '#333', textAlign: comp.style?.textAlign, margin: 0 }}>
          {comp.props.text || 'Paragraph text goes here.'}
        </p>
      );
    case 'button':
      return (
        <button
          type="button"
          style={{
            fontSize: 14,
            padding: comp.style?.padding || '8px 16px',
            backgroundColor: comp.style?.backgroundColor || '#3b82f6',
            color: comp.style?.color || '#fff',
            border: '1px solid transparent',
            borderRadius: comp.style?.borderRadius || '4px',
            cursor: 'default',
            textAlign: comp.style?.textAlign,
          }}
          tabIndex={-1}
          onClick={(e) => e.preventDefault()}
        >
          {comp.props.text || 'Button'}
        </button>
      );
    case 'textInput':
      return (
        <div>
          {comp.props.label && (
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{comp.props.label}</div>
          )}
          <input
            type="text"
            readOnly
            tabIndex={-1}
            placeholder={comp.props.placeholder || 'Enter text...'}
            style={{
              fontSize: 14,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              width: '100%',
              maxWidth: 400,
              background: '#fff',
              color: '#333',
              outline: 'none',
            }}
          />
        </div>
      );
    case 'image': {
      const w = comp.props.width || 200;
      const h = comp.props.height || 150;
      return (
        <div
          style={{
            width: w,
            height: h,
            backgroundColor: comp.style?.backgroundColor || '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            fontSize: 13,
            color: '#64748b',
          }}
        >
          {comp.props.alt || 'Image'}
        </div>
      );
    }
    case 'divider':
      return (
        <hr style={{
          border: 'none',
          borderTop: `1px solid ${comp.style?.borderColor || '#e2e8f0'}`,
          margin: comp.style?.margin || '8px 0',
          width: '100%',
        }} />
      );
    case 'container': {
      const dir = comp.props?.direction || 'column';
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: dir,
            padding: comp.style?.padding || '8px',
            gap: comp.style?.gap || '8px',
            backgroundColor: comp.style?.backgroundColor,
            border: '1px dashed #cbd5e1',
            borderRadius: 4,
            minHeight: 48,
          }}
        >
          {comp.children && comp.children.length > 0 ? (
            comp.children.map((child) => (
              <div
                key={child.id}
                className="editor-component"
                onClick={(e) => { e.stopPropagation(); selectComponent(windowId, child.id); }}
              >
                <ComponentPreview comp={child} windowId={windowId} />
              </div>
            ))
          ) : (
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 8 }}>
              Container
            </div>
          )}
        </div>
      );
    }
    default:
      return <div style={{ color: '#999', fontSize: 12 }}>Unknown: {comp.type}</div>;
  }
}
