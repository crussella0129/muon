/**
 * Generate preload.js for the output Electron app.
 * contextBridge.exposeInMainWorld with all IPC channels.
 */
import { toCamelCase, sanitizeChannelName, collectAllChannels } from '../helpers.js';

export function generatePreload(windows, edges) {
  const channels = collectAllChannels(windows, edges);

  let code = `const { contextBridge, ipcRenderer } = require('electron');\n\n`;
  code += `contextBridge.exposeInMainWorld('appAPI', {\n`;

  // invoke channels (emits + navigation)
  for (const ch of channels.invoke) {
    const fnName = toCamelCase(ch.replace(/[^a-zA-Z0-9]/g, '-'));
    code += `  ${fnName}: (data) => ipcRenderer.invoke(${JSON.stringify(ch)}, data),\n`;
  }

  // on channels (listens)
  for (const ch of channels.on) {
    const fnName = 'on' + ch.split(/[^a-zA-Z0-9]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    code += `  ${fnName}: (callback) => {\n`;
    code += `    ipcRenderer.on(${JSON.stringify(ch)}, (_event, data) => callback(data));\n`;
    code += `    return () => ipcRenderer.removeAllListeners(${JSON.stringify(ch)});\n`;
    code += `  },\n`;
  }

  code += `});\n`;

  return code;
}
