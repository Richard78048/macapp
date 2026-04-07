const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const AutoLaunch = require('auto-launch');

let mainWindow;

// Configuração do AutoLaunch
const launcher = new AutoLaunch({
  name: 'Hub-apps',
  path: app.getPath('exe'),
});

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    icon: path.join(__dirname, 'assets/icon.png') ,
    backgroundColor: '#EBEBEB',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile('index.html');
}

// Ouvinte para ligar/desligar o Auto-Start
ipcMain.on('toggle-autostart', (event, enable) => {
  if (app.isPackaged) {
    enable ? launcher.enable() : launcher.disable();
  } else {
    console.log('Auto-start ignorado em modo de desenvolvimento.');
  }
});

// Os demais IPCs (window-minimize, select-and-copy-icon, etc.) continuam aqui...
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

ipcMain.handle('select-and-copy-icon', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'ico', 'webp'] }]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const fileName = `${Date.now()}${path.extname(result.filePaths[0])}`;
    const destFolder = path.join(__dirname, 'assets');
    if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder);
    const destPath = path.join(destFolder, fileName);
    fs.copyFileSync(result.filePaths[0], destPath);
    return `assets/${fileName}`;
  }
  return null;
});

app.whenReady().then(createWindow);