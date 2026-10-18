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

  // Maximize and prevent resize per user requirement
  mainWindow.maximize();
  mainWindow.setResizable(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
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
