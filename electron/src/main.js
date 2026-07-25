const { app, BrowserWindow, Menu, shell, nativeTheme } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  const backgroundColor = nativeTheme.shouldUseDarkColors ? '#0D110F' : '#FAF7F2';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: 'SplitCircle',
    backgroundColor,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false, // Show after ready-to-show to prevent flash
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (!isDev) autoUpdater.checkForUpdatesAndNotify();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App menu
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'SplitCircle',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow.webContents.executeJavaScript("window.location.href = '/dashboard'"),
        },
        {
          label: 'Add Expense',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.executeJavaScript("window.location.href = '/expenses'"),
        },
        {
          label: 'Scan Receipt',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => mainWindow.webContents.executeJavaScript("window.location.href = '/ocr'"),
        },
        {
          label: 'AI Insights',
          accelerator: 'CmdOrCtrl+I',
          click: () => mainWindow.webContents.executeJavaScript("window.location.href = '/insights'"),
        },
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        { label: 'About SplitCircle', role: 'about' },
        {
          label: 'View on GitHub',
          click: () => shell.openExternal('https://github.com'),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  createWindow();
  buildMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// React to system theme changes
nativeTheme.on('updated', () => {
  if (mainWindow) {
    const bg = nativeTheme.shouldUseDarkColors ? '#0D110F' : '#FAF7F2';
    mainWindow.setBackgroundColor(bg);
  }
});
