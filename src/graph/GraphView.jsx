import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  addEdge as rfAddEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import WindowNode from './WindowNode';
import { navigationEdge, ipcEdge, stateEdge } from './edgeTypes';
import useProjectStore from '../stores/projectStore';

const nodeTypes = { windowNode: WindowNode };
const edgeTypes = { navigationEdge, ipcEdge, stateEdge };

export default function GraphView() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useProjectStore((s) => s.getNodes());
  const edges = useProjectStore((s) => s.getEdges());
  const addNode = useProjectStore((s) => s.addNode);
  const addEdge = useProjectStore((s) => s.addEdge);
  const removeNode = useProjectStore((s) => s.removeNode);
  const removeEdge = useProjectStore((s) => s.removeEdge);
  const updateNodePosition = useProjectStore((s) => s.updateNodePosition);
  const selectNode = useProjectStore((s) => s.selectNode);
  const selectEdge = useProjectStore((s) => s.selectEdge);
  const clearSelection = useProjectStore((s) => s.clearSelection);

  const onNodesChange = useCallback(
    (changes) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updateNodePosition(change.id, change.position);
        }
        if (change.type === 'remove') {
          removeNode(change.id);
        }
      });
    },
    [updateNodePosition, removeNode]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          removeEdge(change.id);
        }
      });
    },
    [removeEdge]
  );

  const onConnect = useCallback(
    (params) => {
      addEdge(params);
    },
    [addEdge]
  );

  const onNodeClick = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onEdgeClick = useCallback(
    (_event, edge) => {
      selectEdge(edge.id);
    },
    [selectEdge]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const onContextMenu = useCallback(
    (event) => {
      event.preventDefault();

      // Check if we right-clicked on a node or edge (don't show add menu)
      const targetNode = event.target.closest('.react-flow__node');
      if (targetNode) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode(position);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <div className="graph-view" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onContextMenu={onContextMenu}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          type: 'navigationEdge',
          animated: true,
          style: { stroke: '#3b82f6' },
        }}
      >
        <Background color="#334155" gap={16} size={1} />
        <Controls
          showInteractive={false}
          style={{ background: '#1e293b', borderColor: '#334155' }}
        />
        <MiniMap
          nodeColor="#3b82f6"
          maskColor="rgba(15, 23, 42, 0.7)"
          style={{ background: '#1e293b', borderColor: '#334155' }}
        />
      </ReactFlow>
      <div className="graph-hint">Right-click to add a window</div>
    </div>
  );
}
