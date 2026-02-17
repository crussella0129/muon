import React from 'react';
import { getBezierPath, EdgeLabelRenderer } from 'reactflow';

function BaseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  style = {},
  markerEnd,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={style}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export function navigationEdge(props) {
  return (
    <BaseEdge
      {...props}
      style={{ stroke: '#3b82f6', strokeWidth: 2, ...props.style }}
    />
  );
}

export function ipcEdge(props) {
  return (
    <BaseEdge
      {...props}
      style={{
        stroke: '#22c55e',
        strokeWidth: 2,
        strokeDasharray: '5 5',
        ...props.style,
      }}
    />
  );
}

export function stateEdge(props) {
  return (
    <BaseEdge
      {...props}
      style={{
        stroke: '#a855f7',
        strokeWidth: 3,
        ...props.style,
      }}
    />
  );
}
