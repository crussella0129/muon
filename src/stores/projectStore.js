import { create } from 'zustand';
import { createDefaultProject, createWindowNode, createEdge } from '../utils/defaults';

const MAX_HISTORY = 50;

const useProjectStore = create((set, get) => ({
  // Project model
  project: createDefaultProject(),
  projectPath: null,
  dirty: false,

  // UI state
  selectedNodeId: null,
  selectedEdgeId: null,

  // Undo/redo history
  past: [],
  future: [],

  // --- History helpers ---

  _pushHistory: () => {
    const { project, past } = get();
    const newPast = [...past, JSON.parse(JSON.stringify(project))];
    if (newPast.length > MAX_HISTORY) newPast.shift();
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { past, project, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [JSON.parse(JSON.stringify(project)), ...future],
      project: previous,
      dirty: true,
    });
  },

  redo: () => {
    const { past, project, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      past: [...past, JSON.parse(JSON.stringify(project))],
      future: future.slice(1),
      project: next,
      dirty: true,
    });
  },

  // --- Project operations ---

  setProjectPath: (path) => set({ projectPath: path }),

  loadProject: (data) => {
    set({
      project: data,
      dirty: false,
      past: [],
      future: [],
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  resetProject: () => {
    set({
      project: createDefaultProject(),
      projectPath: null,
      dirty: false,
      past: [],
      future: [],
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  markClean: () => set({ dirty: false }),

  // --- Selection ---

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),

  // --- Graph nodes (React Flow) ---

  getNodes: () => {
    const { project } = get();
    return project.graph.nodes.map((node) => {
      const windowDef = project.windows[node.id] || {};
      return {
        id: node.id,
        type: 'windowNode',
        position: node.position,
        data: {
          label: windowDef.title || node.id,
          windowConfig: windowDef,
        },
      };
    });
  },

  getEdges: () => {
    const { project } = get();
    return project.graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
      type: edge.type === 'ipc' ? 'ipcEdge' : edge.type === 'state' ? 'stateEdge' : 'navigationEdge',
      animated: edge.type === 'navigation',
      data: { edgeType: edge.type },
      style: edge.type === 'ipc'
        ? { strokeDasharray: '5 5', stroke: '#22c55e' }
        : edge.type === 'state'
        ? { stroke: '#a855f7', strokeWidth: 3 }
        : { stroke: '#3b82f6' },
      labelStyle: { fill: '#94a3b8', fontSize: 12 },
    }));
  },

  addNode: (position) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      const existingIds = project.graph.nodes.map((n) => n.id);
      const id = generateUniqueId('window', existingIds);
      const windowDef = createWindowNode(id);

      project.windows[id] = windowDef;
      project.graph.nodes.push({
        id,
        type: 'window',
        position: position || { x: 200, y: 200 },
      });

      return { project, dirty: true };
    });
  },

  removeNode: (nodeId) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      delete project.windows[nodeId];
      project.graph.nodes = project.graph.nodes.filter((n) => n.id !== nodeId);
      project.graph.edges = project.graph.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      return {
        project,
        dirty: true,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      };
    });
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      const node = project.graph.nodes.find((n) => n.id === nodeId);
      if (node) node.position = position;
      return { project, dirty: true };
    });
  },

  updateWindowConfig: (nodeId, updates) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      if (project.windows[nodeId]) {
        Object.assign(project.windows[nodeId], updates);
      }
      return { project, dirty: true };
    });
  },

  // --- Graph edges ---

  addEdge: (params) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      const edge = createEdge(params.source, params.target);
      project.graph.edges.push(edge);
      return { project, dirty: true };
    });
  },

  removeEdge: (edgeId) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      project.graph.edges = project.graph.edges.filter((e) => e.id !== edgeId);
      return {
        project,
        dirty: true,
        selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
      };
    });
  },

  updateEdge: (edgeId, updates) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      const edge = project.graph.edges.find((e) => e.id === edgeId);
      if (edge) Object.assign(edge, updates);
      return { project, dirty: true };
    });
  },

  // --- Meta ---

  updateMeta: (updates) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      Object.assign(project.meta, updates);
      return { project, dirty: true };
    });
  },
}));

function generateUniqueId(prefix, existingIds) {
  let counter = 1;
  let id = prefix + counter;
  while (existingIds.includes(id)) {
    counter++;
    id = prefix + counter;
  }
  return id;
}

export default useProjectStore;
