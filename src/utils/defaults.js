export function createDefaultProject() {
  return {
    meta: {
      name: 'my-app',
      version: '0.1.0',
      electron: '^28.0.0',
      muonVersion: '0.1.0',
    },
    windows: {
      main: {
        title: 'Main Window',
        width: 1200,
        height: 800,
        resizable: true,
        frame: true,
        modal: false,
        transparent: false,
        alwaysOnTop: false,
        backgroundColor: '#ffffff',
        layoutMode: 'flow',
        menu: null,
        component: null,
        ipc: { listens: [], emits: [] },
        children: [],
      },
    },
    menus: {},
    components: {},
    graph: {
      nodes: [
        { id: 'main', type: 'window', position: { x: 250, y: 200 } },
      ],
      edges: [],
    },
  };
}

export function createWindowNode(id) {
  return {
    title: id.charAt(0).toUpperCase() + id.slice(1),
    width: 800,
    height: 600,
    resizable: true,
    frame: true,
    modal: false,
    transparent: false,
    alwaysOnTop: false,
    backgroundColor: '#ffffff',
    layoutMode: 'flow',
    menu: null,
    component: null,
    ipc: { listens: [], emits: [] },
    children: [],
  };
}

export function createEdge(sourceId, targetId) {
  return {
    id: `e-${sourceId}-${targetId}-${Date.now()}`,
    source: sourceId,
    target: targetId,
    label: '',
    type: 'navigation',
  };
}
