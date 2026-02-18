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
  selected,
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
      {/* Invisible wider path for easier click/selection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          ...(selected ? { stroke: '#f59e0b', strokeWidth: 3, filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' } : {}),
        }}
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
