import { create } from 'zustand';
import { createDefaultProject, createWindowNode, createEdge } from '../utils/defaults';

const MAX_HISTORY = 50;

// --- Tree helpers ---

function findComponentInTree(children, id) {
  for (const child of children) {
    if (child.id === id) return child;
    if (child.children) {
      const found = findComponentInTree(child.children, id);
      if (found) return found;
    }
  }
  return null;
}

function removeFromTree(children, id) {
  for (let i = 0; i < children.length; i++) {
    if (children[i].id === id) {
      children.splice(i, 1);
      return true;
    }
    if (children[i].children && removeFromTree(children[i].children, id)) {
      return true;
    }
  }
  return false;
}

function updateInTree(children, id, updates) {
  for (const child of children) {
    if (child.id === id) {
      if (updates.props) child.props = { ...child.props, ...updates.props };
      if (updates.style) child.style = { ...child.style, ...updates.style };
      if (updates.children !== undefined) child.children = updates.children;
      return true;
    }
    if (child.children && updateInTree(child.children, id, updates)) {
      return true;
    }
  }
  return false;
}

// Collect ALL buttons (event drivers) from a window's component tree.
// Returns array of { componentId, label, target } — target is null if no navigate action set.
function collectAllOutputs(children) {
  const outputs = [];
  for (const child of children) {
    if (child.type === 'button') {
      const navAction = child.props?.actions?.onClick;
      outputs.push({
        componentId: child.id,
        label: child.props.text || 'Button',
        target: navAction?.type === 'navigate' ? navAction.target : null,
      });
    }
    if (child.children) {
      outputs.push(...collectAllOutputs(child.children));
    }
  }
  return outputs;
}

const useProjectStore = create((set, get) => ({
  // Project model
  project: createDefaultProject(),
  projectPath: null,
  dirty: false,

  // UI state
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedComponentId: null,
  selectedComponentWindowId: null,

  // View mode: 'editor' | 'flow'
  viewMode: 'editor',
  activeScreenId: 'main',

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

  // --- View mode ---

  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveScreenId: (id) => set({
    activeScreenId: id,
    selectedNodeId: id,
    selectedEdgeId: null,
    selectedComponentId: null,
    selectedComponentWindowId: null,
  }),

  getActiveScreen: () => {
    const { project, activeScreenId } = get();
    return project.windows[activeScreenId] || null;
  },

  // --- Project operations ---

  setProjectPath: (path) => set({ projectPath: path }),

  loadProject: (data) => {
    // Ensure children arrays and layoutMode exist on all windows (backward compat)
    if (data && data.windows) {
      for (const win of Object.values(data.windows)) {
        if (!win.children) win.children = [];
        if (!win.layoutMode) win.layoutMode = 'flow';
      }
    }
    const firstScreenId = data?.graph?.nodes?.[0]?.id || 'main';
    set({
      project: data,
      dirty: false,
      past: [],
      future: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      selectedComponentId: null,
      selectedComponentWindowId: null,
      activeScreenId: firstScreenId,
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
      selectedComponentId: null,
      selectedComponentWindowId: null,
      activeScreenId: 'main',
      viewMode: 'editor',
    });
  },

  markClean: () => set({ dirty: false }),

  // --- Selection ---

  selectNode: (nodeId) => set({
    selectedNodeId: nodeId,
    selectedEdgeId: null,
    selectedComponentId: null,
    selectedComponentWindowId: null,
  }),

  selectEdge: (edgeId) => set({
    selectedEdgeId: edgeId,
    selectedNodeId: null,
    selectedComponentId: null,
    selectedComponentWindowId: null,
  }),

  selectComponent: (windowId, componentId) => set({
    selectedComponentId: componentId,
    selectedComponentWindowId: windowId,
    selectedNodeId: windowId,
    selectedEdgeId: null,
  }),

  clearComponentSelection: () => set({
    selectedComponentId: null,
    selectedComponentWindowId: null,
  }),

  clearSelection: () => set({
    selectedNodeId: null,
    selectedEdgeId: null,
    selectedComponentId: null,
    selectedComponentWindowId: null,
  }),

  // --- Graph nodes (React Flow) ---

  getNodes: () => {
    const { project } = get();
    return project.graph.nodes.map((node) => {
      const windowDef = project.windows[node.id] || {};
      const outputs = collectAllOutputs(windowDef.children || []);
      return {
        id: node.id,
        type: 'flowScreenNode',
        position: node.position,
        data: {
          label: windowDef.title || node.id,
          windowConfig: windowDef,
          children: windowDef.children || [],
          outputs,
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
      sourceHandle: edge.sourceHandle || null,
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
    const { _pushHistory, activeScreenId } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      const existingIds = project.graph.nodes.map((n) => n.id);
      const id = generateUniqueId('window', existingIds);
      const windowDef = createWindowNode(id);

      // Inherit dimensions from the currently active screen
      const sourceScreen = project.windows[activeScreenId];
      if (sourceScreen) {
        windowDef.width = sourceScreen.width;
        windowDef.height = sourceScreen.height;
      }

      project.windows[id] = windowDef;
      project.graph.nodes.push({
        id,
        type: 'window',
        position: position || { x: 200, y: 200 },
      });

      return {
        project,
        dirty: true,
        activeScreenId: id,
        selectedNodeId: id,
        selectedEdgeId: null,
        selectedComponentId: null,
        selectedComponentWindowId: null,
      };
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

      // Fall back activeScreenId to first remaining screen
      let newActiveScreenId = state.activeScreenId;
      if (state.activeScreenId === nodeId) {
        newActiveScreenId = project.graph.nodes[0]?.id || null;
      }

      return {
        project,
        dirty: true,
        activeScreenId: newActiveScreenId,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        selectedComponentId: state.selectedComponentWindowId === nodeId ? null : state.selectedComponentId,
        selectedComponentWindowId: state.selectedComponentWindowId === nodeId ? null : state.selectedComponentWindowId,
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

  // --- Component CRUD ---

  addComponent: (windowId, component, parentComponentId) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      const win = project.windows[windowId];
      if (!win) return {};
      if (!win.children) win.children = [];

      if (parentComponentId) {
        const parent = findComponentInTree(win.children, parentComponentId);
        if (parent && parent.children) {
          parent.children.push(component);
        }
      } else {
        win.children.push(component);
      }

      return { project, dirty: true };
    });
  },

  removeComponent: (windowId, componentId) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      const win = project.windows[windowId];
      if (!win || !win.children) return {};
      removeFromTree(win.children, componentId);
      return { project, dirty: true };
    });
  },

  updateComponent: (windowId, componentId, updates) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      const win = project.windows[windowId];
      if (!win || !win.children) return {};
      updateInTree(win.children, componentId, updates);
      return { project, dirty: true };
    });
  },

  moveComponent: (windowId, componentId, newIndex) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      const win = project.windows[windowId];
      if (!win || !win.children) return {};

      const oldIndex = win.children.findIndex((c) => c.id === componentId);
      if (oldIndex === -1 || oldIndex === newIndex) return {};

      const [comp] = win.children.splice(oldIndex, 1);
      win.children.splice(newIndex, 0, comp);
      return { project, dirty: true };
    });
  },

  // --- Component Actions (with edge sync) ---

  setComponentAction: (windowId, componentId, actionType, actionConfig) => {
    const { _pushHistory } = get();
    _pushHistory();

    set((state) => {
      const project = JSON.parse(JSON.stringify(state.project));
      const win = project.windows[windowId];
      if (!win || !win.children) return {};

      const comp = findComponentInTree(win.children, componentId);
      if (!comp) return {};

      // Update component action
      if (!comp.props.actions) comp.props.actions = {};
      if (actionConfig) {
        comp.props.actions[actionType] = actionConfig;
      } else {
        delete comp.props.actions[actionType];
        if (Object.keys(comp.props.actions).length === 0) {
          delete comp.props.actions;
        }
      }

      // Sync navigation edges: one edge per button that has a navigate target
      const outputs = collectAllOutputs(win.children).filter((o) => o.target);

      // Remove existing button-sourced navigation edges from this window
      project.graph.edges = project.graph.edges.filter(
        (e) => !(e.source === windowId && e.type === 'navigation' && e.sourceHandle)
      );

      // Re-add one edge per output
      for (const out of outputs) {
        if (project.windows[out.target]) {
          project.graph.edges.push({
            id: `e-${windowId}-${out.componentId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            source: windowId,
            sourceHandle: out.componentId,
            target: out.target,
            label: '',
            type: 'navigation',
          });
        }
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
      if (params.sourceHandle) edge.sourceHandle = params.sourceHandle;
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
