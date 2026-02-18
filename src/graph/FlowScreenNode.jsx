import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import useProjectStore from '../stores/projectStore';

function FlowScreenNode({ id, data }) {
  const selectedNodeId = useProjectStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === id;
  const config = data.windowConfig || {};
  const outputs = data.outputs || [];
  const childCount = (data.children || []).length;

  return (
    <div className={`flow-screen-node ${isSelected ? 'selected' : ''}`}>
      {/* Single target handle on the left */}
      <Handle type="target" position={Position.Left} className="flow-handle-target" />

      <div className="flow-screen-node-title">{config.title || id}</div>
      <div className="flow-screen-node-meta">
        <span>{config.width || 800} x {config.height || 600}</span>
        <span
          className="flow-screen-node-swatch"
          style={{ backgroundColor: config.backgroundColor || '#ffffff' }}
        />
        {childCount > 0 && <span className="flow-screen-node-badge">{childCount}</span>}
      </div>

      {/* Per-button source handles */}
      {outputs.length > 0 && (
        <div className="flow-screen-node-outputs">
          {outputs.map((out) => (
            <div key={out.componentId} className="flow-screen-node-output">
              <span className="flow-screen-node-output-label">{out.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={out.componentId}
                className={`flow-handle-source ${out.target ? 'connected' : 'unconnected'}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Fallback generic source handle when no buttons exist */}
      {outputs.length === 0 && (
        <Handle type="source" position={Position.Right} className="flow-handle-source" />
      )}
    </div>
  );
}

export default memo(FlowScreenNode);
