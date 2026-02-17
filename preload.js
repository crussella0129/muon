const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('muonAPI', {
  // File dialogs
  openFile: () => ipcRenderer.invoke('dialog:open-file'),
  saveFileDialog: (defaultPath) => ipcRenderer.invoke('dialog:save-file', { defaultPath }),

  // File system
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', { filePath, content }),
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', { filePath }),

  // Menu event listeners
  onMenuNewProject: (callback) => {
    ipcRenderer.on('menu:new-project', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:new-project');
  },
  onMenuOpenProject: (callback) => {
    ipcRenderer.on('menu:open-project', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:open-project');
  },
  onMenuSave: (callback) => {
    ipcRenderer.on('menu:save', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:save');
  },
  onMenuSaveAs: (callback) => {
    ipcRenderer.on('menu:save-as', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:save-as');
  },
  onMenuUndo: (callback) => {
    ipcRenderer.on('menu:undo', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:undo');
  },
  onMenuRedo: (callback) => {
    ipcRenderer.on('menu:redo', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:redo');
  },
});
