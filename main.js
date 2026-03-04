const { app, BrowserWindow, ipcMain, desktopCapturer, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let pickerWindows = [];

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 660,
    minWidth: 760,
    minHeight: 520,
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

// --- Close all picker windows ---

function closeAllPickers() {
  for (const win of pickerWindows) {
    if (win && !win.isDestroyed()) win.close();
  }
  pickerWindows = [];
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
}

// --- IPC: Screen Capture (legacy, kept for compat) ---

ipcMain.handle('capture-screen', async () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  const scaleFactor = primaryDisplay.scaleFactor;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: Math.round(width * scaleFactor), height: Math.round(height * scaleFactor) }
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

// --- IPC: Open Picker — one window per monitor ---

ipcMain.handle('open-picker', async () => {
  const displays = screen.getAllDisplays();

  // Thumbnail size = largest physical resolution across displays
  const maxPhysW = Math.round(Math.max(...displays.map(d => d.bounds.width * d.scaleFactor)));
  const maxPhysH = Math.round(Math.max(...displays.map(d => d.bounds.height * d.scaleFactor)));

  // Hide main window for clean capture
  mainWindow.hide();
  await new Promise(r => setTimeout(r, 80));

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: maxPhysW, height: maxPhysH }
  });

  if (sources.length === 0) {
    mainWindow.show();
    return null;
  }

  // Create one picker window per display
  for (const display of displays) {
    // Match source to display via display_id, fallback to index
    const source = sources.find(s => s.display_id === display.id.toString())
      || sources[displays.indexOf(display)];
    if (!source) continue;

    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      hasShadow: false,
      fullscreenable: false,
      backgroundColor: '#000000',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    win.setAlwaysOnTop(true, 'screen-saver');
    win.loadFile(path.join(__dirname, 'src', 'picker.html'));

    const screenshotData = {
      dataURL: source.thumbnail.toDataURL(),
      width: display.bounds.width,
      height: display.bounds.height,
      scaleFactor: display.scaleFactor
    };

    win.webContents.once('did-finish-load', () => {
      win.webContents.send('screenshot-data', screenshotData);
    });

    pickerWindows.push(win);
  }

  return true;
});

// --- IPC: Color picked / cancel ---

ipcMain.on('color-picked', (event, hex) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('color-from-picker', hex);
  }
  closeAllPickers();
});

ipcMain.on('picker-cancel', () => {
  closeAllPickers();
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
