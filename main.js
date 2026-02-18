const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Muon',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  const isMac = process.platform === 'darwin';
  const menuTemplate = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu:new-project'),
        },
        {
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu:open-project'),
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu:save'),
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu:save-as'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => mainWindow.webContents.send('menu:undo'),
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: () => mainWindow.webContents.send('menu:redo'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
};

// IPC Handlers

ipcMain.handle('dialog:open-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Muon Project',
    filters: [
      { name: 'Muon Project', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (canceled || filePaths.length === 0) return null;
  const content = fs.readFileSync(filePaths[0], 'utf-8');
  return { path: filePaths[0], content };
});

ipcMain.handle('dialog:save-file', async (_event, { defaultPath }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Muon Project',
    defaultPath: defaultPath || 'muon.project.json',
    filters: [
      { name: 'Muon Project', extensions: ['json'] },
    ],
  });
  if (canceled || !filePath) return null;
  return filePath;
});

ipcMain.handle('fs:write-file', async (_event, { filePath, content }) => {
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('fs:read-file', async (_event, { filePath }) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content;
});

// --- Codegen IPC handlers ---

ipcMain.handle('dialog:select-directory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Output Directory',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

ipcMain.handle('codegen:write-files', async (_event, { outputDir, files }) => {
  const written = [];
  for (let i = 0; i < files.length; i++) {
    const { path: relPath, content } = files[i];
    const fullPath = path.join(outputDir, relPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf-8');
    written.push(relPath);

    // Send progress to renderer
    mainWindow.webContents.send('codegen:progress', {
      current: i + 1,
      total: files.length,
      file: relPath,
    });
  }
  return { success: true, written };
});

let buildProcess = null;

ipcMain.handle('codegen:build-run', async (_event, { outputDir }) => {
  if (buildProcess) {
    return { error: 'A build process is already running.' };
  }

  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';

  // Run npm install && npm start
  buildProcess = spawn(npmCmd, ['install'], { cwd: outputDir, shell: false });

  buildProcess.stdout.on('data', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('codegen:output', data.toString());
    }
  });

  buildProcess.stderr.on('data', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('codegen:output', data.toString());
    }
  });

  buildProcess.on('close', (code) => {
    if (code !== 0) {
      buildProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('codegen:process-exit', { phase: 'install', code });
      }
      return;
    }

    // npm install succeeded — now run npm start
    buildProcess = spawn(npmCmd, ['start'], { cwd: outputDir, shell: false });

    buildProcess.stdout.on('data', (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('codegen:output', data.toString());
      }
    });

    buildProcess.stderr.on('data', (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('codegen:output', data.toString());
      }
    });

    buildProcess.on('close', (startCode) => {
      buildProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('codegen:process-exit', { phase: 'start', code: startCode });
      }
    });
  });

  return { success: true, pid: buildProcess.pid };
});

ipcMain.handle('codegen:kill-process', async () => {
  if (buildProcess) {
    buildProcess.kill();
    buildProcess = null;
    return { killed: true };
  }
  return { killed: false };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
