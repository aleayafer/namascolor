const { app, BrowserWindow, ipcMain, desktopCapturer, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let pickerWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#f5f5f7',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'default',
    title: 'NamasColor — Color Picker para Power BI'
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  app.quit();
});

// --- IPC: Screen Capture ---

ipcMain.handle('capture-screen', async () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  const scaleFactor = primaryDisplay.scaleFactor;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: width * scaleFactor, height: height * scaleFactor }
  });

  if (sources.length === 0) return null;

  const screenshot = sources[0].thumbnail;
  return {
    dataURL: screenshot.toDataURL(),
    width: width,
    height: height,
    scaleFactor: scaleFactor
  };
});

ipcMain.handle('open-picker', async () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  // Hide main window briefly for clean capture
  mainWindow.hide();

  // Small delay to let the window hide
  await new Promise(r => setTimeout(r, 150));

  const scaleFactor = primaryDisplay.scaleFactor;
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: width * scaleFactor, height: height * scaleFactor }
  });

  mainWindow.show();

  if (sources.length === 0) return null;

  const screenshot = sources[0].thumbnail;

  pickerWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  pickerWindow.loadFile(path.join(__dirname, 'src', 'picker.html'));

  pickerWindow.webContents.once('did-finish-load', () => {
    pickerWindow.webContents.send('screenshot-data', {
      dataURL: screenshot.toDataURL(),
      width: width,
      height: height,
      scaleFactor: scaleFactor
    });
  });

  return true;
});

ipcMain.on('color-picked', (event, hex) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('color-from-picker', hex);
  }
  if (pickerWindow && !pickerWindow.isDestroyed()) {
    pickerWindow.close();
    pickerWindow = null;
  }
});

ipcMain.on('picker-cancel', () => {
  if (pickerWindow && !pickerWindow.isDestroyed()) {
    pickerWindow.close();
    pickerWindow = null;
  }
});

// --- IPC: Save Theme File ---

ipcMain.handle('save-theme', async (event, jsonContent) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Guardar tema Power BI',
    defaultPath: 'NamasColor-Theme.json',
    filters: [
      { name: 'Power BI Theme', extensions: ['json'] }
    ]
  });

  if (result.canceled) return false;

  fs.writeFileSync(result.filePath, jsonContent, 'utf-8');
  return result.filePath;
});
