/**
 * Generate main.js for the output Electron app.
 * Creates BrowserWindow per window, IPC handlers, navigation handlers, modal parent wiring.
 */
import { toPascalCase, toCamelCase, sanitizeChannelName, collectAllIpcChannels, collectNavigationChannels } from '../helpers.js';

export function generateMainProcess(windows, edges) {
  const windowIds = Object.keys(windows);
  const ipc = collectAllIpcChannels(windows);
  const navChannels = collectNavigationChannels(edges);
  const stateEdges = edges.filter((e) => e.type === 'state');

  // Determine which windows are modal (need parent reference)
  const modalWindows = windowIds.filter((id) => windows[id].modal);

  // Find parent for modal windows (source of navigation edge targeting this modal)
  function findParent(targetId) {
    const navEdge = edges.find((e) => e.type === 'navigation' && e.target === targetId);
    return navEdge ? navEdge.source : windowIds[0];
  }

  let code = `const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

if (require('electron-squirrel-startup')) {
  app.quit();
}

`;

  // Window reference variables
  code += `// Window references\n`;
  for (const id of windowIds) {
    code += `let ${toCamelCase(id)}Window = null;\n`;
  }
  code += '\n';

  // Create-window functions
  for (const id of windowIds) {
    const win = windows[id];
    const varName = `${toCamelCase(id)}Window`;
    const isModal = win.modal;
    const parentVar = isModal ? `${toCamelCase(findParent(id))}Window` : null;

    code += `function create${toPascalCase(id)}Window() {\n`;

    // If already open, just focus
    code += `  if (${varName} && !${varName}.isDestroyed()) {\n`;
    code += `    ${varName}.focus();\n`;
    code += `    return;\n`;
    code += `  }\n\n`;

    code += `  ${varName} = new BrowserWindow({\n`;
    code += `    width: ${win.width || 800},\n`;
    code += `    height: ${win.height || 600},\n`;
    code += `    title: ${JSON.stringify(win.title || toPascalCase(id))},\n`;
    code += `    resizable: ${win.resizable !== false},\n`;
    code += `    frame: ${win.frame !== false},\n`;
    code += `    transparent: ${!!win.transparent},\n`;
    code += `    alwaysOnTop: ${!!win.alwaysOnTop},\n`;
    if (win.backgroundColor && win.backgroundColor !== '#ffffff') {
      code += `    backgroundColor: ${JSON.stringify(win.backgroundColor)},\n`;
    }
    if (isModal && parentVar) {
      code += `    modal: true,\n`;
      code += `    parent: ${parentVar},\n`;
    }
    code += `    webPreferences: {\n`;
    code += `      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,\n`;
    code += `      contextIsolation: true,\n`;
    code += `      nodeIntegration: false,\n`;
    code += `    },\n`;
    code += `  });\n\n`;

    code += `  ${varName}.loadURL(MAIN_WINDOW_WEBPACK_ENTRY + '?window=${id}');\n\n`;

    code += `  ${varName}.on('closed', () => {\n`;
    code += `    ${varName} = null;\n`;
    code += `  });\n`;
    code += `}\n\n`;
  }

  // App ready
  const firstWindow = windowIds[0] || 'main';
  code += `app.whenReady().then(() => {\n`;
  code += `  create${toPascalCase(firstWindow)}Window();\n\n`;
  code += `  app.on('activate', () => {\n`;
  code += `    if (BrowserWindow.getAllWindows().length === 0) {\n`;
  code += `      create${toPascalCase(firstWindow)}Window();\n`;
  code += `    }\n`;
  code += `  });\n`;
  code += `});\n\n`;

  code += `app.on('window-all-closed', () => {\n`;
  code += `  if (process.platform !== 'darwin') app.quit();\n`;
  code += `});\n\n`;

  // Navigation IPC handlers
  if (navChannels.length > 0) {
    code += `// Navigation handlers\n`;
    for (const edge of edges.filter((e) => e.type === 'navigation')) {
      const channel = `navigate:open-${edge.target}`;
      code += `ipcMain.handle(${JSON.stringify(channel)}, () => {\n`;
      code += `  create${toPascalCase(edge.target)}Window();\n`;
      code += `});\n\n`;
    }
  }

  // IPC emit handlers (renderer invokes → main handles)
  if (ipc.emits.length > 0) {
    code += `// IPC handlers (renderer → main)\n`;
    for (const ch of ipc.emits) {
      code += `ipcMain.handle(${JSON.stringify(ch)}, async (_event, data) => {\n`;
      code += `  // TODO: Implement handler for "${ch}"\n`;
      code += `  console.log('IPC:', ${JSON.stringify(ch)}, data);\n`;
      code += `  return { ok: true };\n`;
      code += `});\n\n`;
    }
  }

  // IPC listen forwarding (main sends → renderer listens)
  if (ipc.listens.length > 0) {
    code += `// IPC forwarding (main → renderer)\n`;
    code += `function broadcastToAllWindows(channel, data) {\n`;
    code += `  for (const win of BrowserWindow.getAllWindows()) {\n`;
    code += `    if (!win.isDestroyed()) win.webContents.send(channel, data);\n`;
    code += `  }\n`;
    code += `}\n\n`;
  }

  return code;
}
