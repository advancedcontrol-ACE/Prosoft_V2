const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { createApiServer } = require('./apiServer.cjs');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let apiServerInstance = null;

function getIconPath() {
  const possiblePaths = [
    path.join(__dirname, '../ace.ico'),
    path.join(__dirname, '../public/ace.ico'),
    path.join(process.resourcesPath, 'ace.ico'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function getDistPath() {
  const possiblePaths = [
    path.join(__dirname, '../dist'),
    path.join(app.getAppPath(), 'dist'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, '../dist');
}

async function createWindow(targetUrl) {
  const icon = getIconPath();

  mainWindow = new BrowserWindow({
    title: 'Advanced Control Equipments',
    icon,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // Disable right-click on the top window title bar
  const WM_NCRBUTTONDOWN = 0x00A4;
  const WM_NCRBUTTONUP = 0x00A5;
  const WM_CONTEXTMENU = 0x007B;
  mainWindow.hookWindowMessage(WM_NCRBUTTONDOWN, () => {});
  mainWindow.hookWindowMessage(WM_NCRBUTTONUP, () => {});
  mainWindow.hookWindowMessage(WM_CONTEXTMENU, () => {});

  // Disable all Chrome / browser shortcuts other than Ctrl+Shift+C
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isCtrlOrCmd = Boolean(input.control || input.meta);
    const isShift = Boolean(input.shift);
    const isAlt = Boolean(input.alt);
    const key = (input.key || '').toLowerCase();

    // 1. Explicitly ALLOW Ctrl + Shift + C (Project Calibration Toggle)
    if (isCtrlOrCmd && isShift && key === 'c') {
      return;
    }

    // 2. Block Function keys F1 - F12 (Help, Reload, DevTools, Fullscreen, etc.)
    if (/^f(1[0-2]|[1-9])$/i.test(input.key)) {
      event.preventDefault();
      return;
    }

    // 3. Block Browser Navigation via Alt (Alt+Left, Alt+Right, Alt+Home)
    if (isAlt && ['arrowleft', 'arrowright', 'home'].includes(key)) {
      event.preventDefault();
      return;
    }

    // 4. Block Chrome Zoom keys: Ctrl+=, Ctrl+-, Ctrl+0, NumpadAdd, NumpadSubtract
    if (isCtrlOrCmd && ['=', '+', '-', '_', '0', 'numpadadd', 'numpadsubtract'].includes(key)) {
      event.preventDefault();
      return;
    }

    // 5. Block all other Ctrl combinations except essential text editing operations
    if (isCtrlOrCmd && !isAlt) {
      const isStandardEditing = !isShift && ['c', 'v', 'x', 'a', 'z', 'y'].includes(key);
      const isRedoShift = isShift && key === 'z';
      if (isStandardEditing || isRedoShift) {
        return; // Allow copy, paste, cut, select all, undo, redo in inputs
      }

      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Maximize and prevent resize per user requirement
  mainWindow.maximize();
  mainWindow.setResizable(false);

  // Dynamic Full-Screen Scaling based on 768px vertical baseline (entire screen length utilized)
  const applyUniformZoom = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const [width, height] = mainWindow.getContentSize();
    if (height > 0) {
      const scale = Math.max(0.2, height / 768);
      mainWindow.webContents.setZoomFactor(scale);
    }
  };

  mainWindow.once('ready-to-show', () => {
    applyUniformZoom();
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    applyUniformZoom();
  });

  mainWindow.on('resize', () => {
    applyUniformZoom();
  });

  mainWindow.on('maximize', () => {
    applyUniformZoom();
  });

  mainWindow.on('restore', () => {
    applyUniformZoom();
  });

  await mainWindow.loadURL(targetUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  try {
    let targetUrl = process.env.VITE_DEV_SERVER_URL;

    if (!targetUrl) {
      const distPath = getDistPath();
      apiServerInstance = createApiServer(distPath);
      const port = await apiServerInstance.start();
      targetUrl = `http://127.0.0.1:${port}`;
      console.log(`[Electron API Server] Running on ${targetUrl}`);
    }

    await createWindow(targetUrl);
  } catch (err) {
    console.error('Failed to initialize app:', err);
    app.quit();
  }
});

app.on('window-all-closed', async () => {
  if (apiServerInstance) {
    try {
      await apiServerInstance.stop();
    } catch {
      // ignore
    }
  }
  app.quit();
});

app.on('before-quit', async () => {
  if (apiServerInstance) {
    try {
      await apiServerInstance.stop();
    } catch {
      // ignore
    }
  }
});
