/**
 * Generate all renderer-side files:
 * - index.html, index.jsx, App.jsx (query-param routing)
 * - Per-window .jsx components
 * - index.css
 * - Shared Zustand store (if state edges exist)
 */
import { toPascalCase, toCamelCase } from '../helpers.js';

export function generateIndexHtml(meta) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${meta.name || 'App'}</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
}

export function generateIndexJsx() {
  return `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
`;
}

export function generateAppJsx(windowIds) {
  let code = `import React from 'react';\n`;

  // Import each window component
  for (const id of windowIds) {
    code += `import ${toPascalCase(id)}Window from './windows/${toPascalCase(id)}Window';\n`;
  }

  code += `\n`;
  code += `export default function App() {\n`;
  code += `  const params = new URLSearchParams(window.location.search);\n`;
  code += `  const windowName = params.get('window') || '${windowIds[0] || 'main'}';\n\n`;

  code += `  switch (windowName) {\n`;
  for (const id of windowIds) {
    code += `    case '${id}':\n`;
    code += `      return <${toPascalCase(id)}Window />;\n`;
  }
  code += `    default:\n`;
  code += `      return <div>Unknown window: {windowName}</div>;\n`;
  code += `  }\n`;
  code += `}\n`;

  return code;
}

function escapeJsx(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;')
    .replace(/"/g, '&quot;');
}

function generateComponentTreeJsx(children, indent, windowIds) {
  let jsx = '';
  for (const comp of children) {
    const pad = ' '.repeat(indent);
    const style = comp.style && Object.keys(comp.style).length > 0
      ? ` style={${JSON.stringify(comp.style)}}`
      : '';

    switch (comp.type) {
      case 'heading': {
        const level = comp.props.level || 1;
        const tag = `h${level}`;
        jsx += `${pad}<${tag}${style}>${escapeJsx(comp.props.text || 'Heading')}</${tag}>\n`;
        break;
      }
      case 'paragraph':
        jsx += `${pad}<p${style}>${escapeJsx(comp.props.text || '')}</p>\n`;
        break;
      case 'button': {
        const navAction = comp.props?.actions?.onClick;
        if (navAction && navAction.type === 'navigate' && navAction.target) {
          const targetId = navAction.target;
          const fnName = toCamelCase(`navigate-to-${targetId}`);
          jsx += `${pad}<button${style} onClick={${fnName}}>${escapeJsx(comp.props.text || 'Button')}</button>\n`;
        } else {
          jsx += `${pad}<button${style}>${escapeJsx(comp.props.text || 'Button')}</button>\n`;
        }
        break;
      }
      case 'textInput': {
        const placeholder = comp.props.placeholder ? ` placeholder="${escapeJsx(comp.props.placeholder)}"` : '';
        jsx += `${pad}<input type="text"${placeholder}${style} />\n`;
        break;
      }
      case 'image': {
        const alt = comp.props.alt || 'Image';
        const w = comp.props.width || 200;
        const h = comp.props.height || 150;
        const imgStyle = { ...comp.style, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' };
        jsx += `${pad}<div style={${JSON.stringify(imgStyle)}}><span>${escapeJsx(alt)}</span></div>\n`;
        break;
      }
      case 'divider':
        jsx += `${pad}<hr${style} />\n`;
        break;
      case 'container': {
        const dir = comp.props.direction || 'column';
        const containerStyle = { ...comp.style, display: 'flex', flexDirection: dir };
        const childJsx = comp.children && comp.children.length > 0
          ? '\n' + generateComponentTreeJsx(comp.children, indent + 2, windowIds) + pad
          : '';
        jsx += `${pad}<div style={${JSON.stringify(containerStyle)}}>${childJsx}</div>\n`;
        break;
      }
      default:
        break;
    }
  }
  return jsx;
}

// Collect all unique navigate targets from button actions in a component tree
function collectButtonNavigateTargets(children) {
  const targets = new Set();
  for (const comp of children) {
    if (comp.type === 'button' && comp.props?.actions?.onClick?.type === 'navigate') {
      targets.add(comp.props.actions.onClick.target);
    }
    if (comp.children) {
      for (const t of collectButtonNavigateTargets(comp.children)) {
        targets.add(t);
      }
    }
  }
  return targets;
}

export function generateWindowComponent(id, windowConfig, edges) {
  const title = windowConfig.title || toPascalCase(id);
  const emits = (windowConfig.ipc && windowConfig.ipc.emits) || [];
  const listens = (windowConfig.ipc && windowConfig.ipc.listens) || [];
  const children = windowConfig.children || [];
  const layoutMode = windowConfig.layoutMode || 'flow';

  // Navigation edges from this window (graph-level)
  const navTargets = edges
    .filter((e) => e.type === 'navigation' && e.source === id)
    .map((e) => e.target);

  // Button-level navigate targets
  const buttonNavTargets = collectButtonNavigateTargets(children);

  const windowIds = Object.keys(windowConfig).length > 0 ? [] : []; // placeholder

  let code = `import React from 'react';\n\n`;

  code += `export default function ${toPascalCase(id)}Window() {\n`;

  // Button navigation handlers
  for (const target of buttonNavTargets) {
    const fnName = toCamelCase(`navigate-to-${target}`);
    code += `  const ${fnName} = () => {\n`;
    code += `    window.appAPI.${toCamelCase(`navigate-open-${target}`)}();\n`;
    code += `  };\n\n`;
  }

  // Graph-level navigation handlers (for targets not already covered by buttons)
  for (const target of navTargets) {
    if (buttonNavTargets.has(target)) continue;
    code += `  const ${toCamelCase(`open${toPascalCase(target)}`)} = () => {\n`;
    code += `    window.appAPI.${toCamelCase(`navigate-open-${target}`)}();\n`;
    code += `  };\n\n`;
  }

  // Emit handlers
  for (const ch of emits) {
    const fnName = toCamelCase(ch.replace(/[^a-zA-Z0-9]/g, '-'));
    code += `  const handle${toPascalCase(ch.replace(/[^a-zA-Z0-9]/g, '-'))} = async () => {\n`;
    code += `    const result = await window.appAPI.${fnName}();\n`;
    code += `    console.log(${JSON.stringify(ch)}, result);\n`;
    code += `  };\n\n`;
  }

  // Listen effects
  if (listens.length > 0) {
    code += `  React.useEffect(() => {\n`;
    code += `    const cleanups = [\n`;
    for (const ch of listens) {
      const onName = 'on' + ch.split(/[^a-zA-Z0-9]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
      code += `      window.appAPI.${onName}((data) => {\n`;
      code += `        console.log(${JSON.stringify(ch)}, data);\n`;
      code += `      }),\n`;
    }
    code += `    ];\n`;
    code += `    return () => cleanups.forEach((fn) => fn());\n`;
    code += `  }, []);\n\n`;
  }

  // JSX — wrapper style based on layoutMode
  const wrapperStyle = layoutMode === 'free'
    ? '{ position: "relative", width: "100%", minHeight: "100vh" }'
    : '{ display: "flex", flexDirection: "column", padding: 24 }';

  code += `  return (\n`;
  code += `    <div style={${wrapperStyle}}>\n`;

  // Render component tree if children exist, otherwise fallback
  if (children.length > 0) {
    code += generateComponentTreeJsx(children, 6, windowIds);
  } else {
    code += `      <h1>${escapeJsx(title)}</h1>\n`;
    code += `      <p>Window ID: ${id}</p>\n`;
  }

  // Graph-level navigation/IPC buttons (only those not covered by button actions)
  const extraNavTargets = navTargets.filter((t) => !buttonNavTargets.has(t));
  if (extraNavTargets.length > 0 || emits.length > 0) {
    code += `      <div style={{ marginTop: 16 }}>\n`;
    for (const target of extraNavTargets) {
      code += `        <button onClick={${toCamelCase(`open${toPascalCase(target)}`)}}>Open ${toPascalCase(target)}</button>\n`;
    }
    for (const ch of emits) {
      code += `        <button onClick={handle${toPascalCase(ch.replace(/[^a-zA-Z0-9]/g, '-'))}}>Send: ${ch}</button>\n`;
    }
    code += `      </div>\n`;
  }

  code += `    </div>\n`;
  code += `  );\n`;
  code += `}\n`;

  return code;
}

export function generateIndexCss() {
  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
}

h1, h2, h3, h4, h5, h6 {
  margin-bottom: 8px;
}

p {
  margin-bottom: 8px;
  line-height: 1.5;
}

button {
  padding: 8px 16px;
  margin: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #e8e8e8;
}

input[type="text"] {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 8px;
}

input[type="text"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

hr {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 12px 0;
}
`;
}

export function generateSharedStore(stateEdges, windows) {
  if (stateEdges.length === 0) return null;

  // Collect window IDs connected by state edges
  const connectedIds = new Set();
  for (const e of stateEdges) {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  }

  let code = `import { create } from 'zustand';\n\n`;
  code += `/**\n`;
  code += ` * Shared state store for windows: ${[...connectedIds].join(', ')}\n`;
  code += ` * Connected via state edges in the Muon project graph.\n`;
  code += ` */\n`;
  code += `const useSharedStore = create((set) => ({\n`;
  code += `  // Add your shared state here\n`;
  code += `  sharedData: {},\n`;
  code += `  setSharedData: (data) => set({ sharedData: data }),\n`;
  code += `}));\n\n`;
  code += `export default useSharedStore;\n`;

  return code;
}
