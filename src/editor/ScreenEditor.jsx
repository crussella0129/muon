import React, { useRef, useState, useLayoutEffect, useCallback } from 'react';
import useProjectStore from '../stores/projectStore';
import { createComponent } from '../components/componentDefs';
import ScreenCanvas from './ScreenCanvas';
import LayoutModeToggle from './LayoutModeToggle';

export default function ScreenEditor() {
  const activeScreenId = useProjectStore((s) => s.activeScreenId);
  const project = useProjectStore((s) => s.project);
  const addComponent = useProjectStore((s) => s.addComponent);

  const config = project.windows[activeScreenId];
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Compute scale so canvas fits within wrapper with padding
  const updateScale = useCallback(() => {
    if (!wrapperRef.current || !config) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const pad = 48; // padding around canvas
    const availW = rect.width - pad * 2;
    const availH = rect.height - pad * 2;
    const canvasW = config.width || 800;
    const canvasH = config.height || 600;
    const s = Math.min(availW / canvasW, availH / canvasH, 1); // never scale up past 1
    setScale(Math.max(0.2, s));
  }, [config]);

  useLayoutEffect(() => {
    updateScale();
    const obs = new ResizeObserver(updateScale);
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, [updateScale]);

  if (!config) {
    return (
      <div className="screen-editor">
        <div className="editor-empty">
          No screen selected. Add a screen from the left sidebar.
        </div>
      </div>
    );
  }

  const handleDragOver = (e) => {
    if (e.dataTransfer.types.includes('application/muon-component')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e) => {
    const compType = e.dataTransfer.getData('application/muon-component');
    if (!compType) return;
    e.preventDefault();
    e.stopPropagation();
    const comp = createComponent(compType);
    addComponent(activeScreenId, comp);
  };

  const canvasW = config.width || 800;
  const canvasH = config.height || 600;
  const scalePercent = Math.round(scale * 100);

  return (
    <div className="screen-editor" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="editor-screen-title">{config.title || activeScreenId}</span>
          <span className="editor-screen-dims">
            {canvasW} x {canvasH} &middot; {scalePercent}%
          </span>
        </div>
        <LayoutModeToggle screenId={activeScreenId} />
      </div>
      <div className="editor-canvas-wrapper" ref={wrapperRef}>
        <div
          className="editor-canvas-scaler"
          style={{
            width: canvasW * scale,
            height: canvasH * scale,
          }}
        >
          <div
            style={{
              width: canvasW,
              height: canvasH,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <ScreenCanvas screenId={activeScreenId} config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
