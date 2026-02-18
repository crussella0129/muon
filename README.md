# Muon (under construction)

> *"The electron's heavier sibling — carrying more weight so you don't have to."*

**Muon** is a visual IDE for designing, scaffolding, and managing Electron apps. Instead of hand-wiring `BrowserWindow` configurations, IPC channels, menu templates, and React component trees from scratch, you design them on a canvas and connect them in a node graph.

Muon is itself an Electron app that builds Electron apps.

## Core Value Proposition

Reduce the time from "idea" to "running Electron prototype" from hours to minutes, while producing clean, maintainable, human-readable code that you own outright.

## Architecture

Muon is organized into three layers:

| Layer | Purpose | Technology |
|-------|---------|-----------|
| **Graph Layer** | Global app topology — windows, connections, IPC | React Flow |
| **Canvas Layer** | Per-window UI designer (Phase 3) | Craft.js |
| **Code Layer** | Monaco-based inline editor | Monaco Editor |

All layers read from and write to a single **Project Model** (`muon.project.json`), which is consumed by the **Codegen Engine** to emit a complete Electron project.

## Current Status: Phase 1 — Graph View Skeleton

- Electron + React + React Flow project scaffold
- Custom "Window" node with title, dimensions, and config badges
- Edge creation between nodes (navigation, IPC, shared state)
- Properties panel for selected nodes and edges
- Save/load project model to disk as JSON
- Minimap, snap-to-grid, undo/redo
- Dark theme IDE interface

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron 28+ |
| UI Framework | React 18 |
| Graph View | React Flow |
| State Management | Zustand |
| Code Editor | Monaco Editor (integrated, used in later phases) |
| Build System | Electron Forge + Webpack |

## Getting Started

### Prerequisites

- Node.js 20+ (LTS)
- npm 9+
- Git

### Install & Run

```bash
git clone https://github.com/crussella0129/muon.git
cd muon
npm install
npm start
```

### Usage

- **Right-click** the canvas to add a new window node
- **Click** a node to view/edit its properties in the side panel
- **Drag** from a node's handle to another node to create an edge
- **Delete** key removes selected nodes or edges
- **Ctrl+S** saves the project
- **Ctrl+O** opens a project file
- **Ctrl+N** creates a new project
- **Ctrl+Z / Ctrl+Shift+Z** undo/redo

### Build for Distribution

```bash
npx electron-forge make
```

## Project Structure

```
muon/
├── package.json
├── forge.config.js
├── main.js                    Electron main process
├── preload.js                 contextBridge API
├── src/
│   ├── index.html
│   ├── index.jsx              React entry point
│   ├── App.jsx                Root layout
│   ├── styles.css             IDE theme
│   ├── stores/
│   │   └── projectStore.js    Zustand store (project model + UI state)
│   ├── graph/
│   │   ├── GraphView.jsx      React Flow canvas
│   │   ├── WindowNode.jsx     Custom window node component
│   │   └── edgeTypes.js       Navigation, IPC, and state edge renderers
│   ├── panels/
│   │   ├── PropertiesPanel.jsx Node/edge property editor
│   │   └── Toolbar.jsx        Top toolbar
│   └── utils/
│       ├── fileIO.js          Save/load project JSON
│       └── defaults.js        Default project, node, and edge configs
└── README.md
```

## Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Graph View Skeleton | **Current** |
| 2 | Menu Designer | Planned |
| 3 | Canvas View (Craft.js) | Planned |
| 4 | Codegen Engine | Planned |
| 5 | Round-Tripping & Polish | Planned |

## License

MIT
