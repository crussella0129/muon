import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import useProjectStore from '../stores/projectStore';

function WindowNode({ id, data }) {
  const selectedNodeId = useProjectStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === id;
  const config = data.windowConfig || {};

  return (
    <div className={`window-node ${isSelected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="node-handle" />

      <div className="window-node-header">
        <div className="window-node-dots">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <span className="window-node-title">{data.label || id}</span>
      </div>

      <div className="window-node-body">
        <div className="window-node-info">
          <span className="dim">{config.width || 800} × {config.height || 600}</span>
        </div>
        {config.modal && <span className="window-node-badge">Modal</span>}
        {config.frame === false && <span className="window-node-badge">Frameless</span>}
        {config.alwaysOnTop && <span className="window-node-badge">On Top</span>}
      </div>

      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}

export default memo(WindowNode);
