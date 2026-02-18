import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FlowScreenNode from './FlowScreenNode';
import { navigationEdge, ipcEdge, stateEdge } from './edgeTypes';
import useProjectStore from '../stores/projectStore';

const nodeTypes = { flowScreenNode: FlowScreenNode };
const edgeTypes = { navigationEdge, ipcEdge, stateEdge };

export default function FlowView() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useProjectStore((s) => s.getNodes());
  const edges = useProjectStore((s) => s.getEdges());
  const addNode = useProjectStore((s) => s.addNode);
  const addEdge = useProjectStore((s) => s.addEdge);
  const setComponentAction = useProjectStore((s) => s.setComponentAction);
  const removeNode = useProjectStore((s) => s.removeNode);
  const removeEdge = useProjectStore((s) => s.removeEdge);
  const updateNodePosition = useProjectStore((s) => s.updateNodePosition);
  const selectNode = useProjectStore((s) => s.selectNode);
  const selectEdge = useProjectStore((s) => s.selectEdge);
  const clearSelection = useProjectStore((s) => s.clearSelection);
  const setActiveScreenId = useProjectStore((s) => s.setActiveScreenId);
  const setViewMode = useProjectStore((s) => s.setViewMode);

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
          // If this edge has a sourceHandle, clear the navigate action on that button
          const edge = edges.find((e) => e.id === change.id);
          if (edge && edge.sourceHandle) {
            setComponentAction(edge.source, edge.sourceHandle, 'onClick', null);
          } else {
            removeEdge(change.id);
          }
        }
      });
    },
    [removeEdge, edges, setComponentAction]
  );

  const onConnect = useCallback(
    (params) => {
      if (params.sourceHandle) {
        // Edge drawn from a button handle → set navigate action on that button
        // setComponentAction handles both the component update AND edge creation
        setComponentAction(params.source, params.sourceHandle, 'onClick', {
          type: 'navigate',
          target: params.target,
        });
      } else {
        // Edge drawn from generic handle → just create a plain edge
        addEdge(params);
      }
    },
    [addEdge, setComponentAction]
  );

  const onNodeClick = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onNodeDoubleClick = useCallback(
    (_event, node) => {
      setActiveScreenId(node.id);
      setViewMode('editor');
    },
    [setActiveScreenId, setViewMode]
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
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onContextMenu={onContextMenu}
        snapToGrid
        snapGrid={[8, 8]}
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
      <div className="graph-hint">Right-click to add a screen. Double-click to edit.</div>
    </div>
  );
}
