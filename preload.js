const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('namascolor', {
  openPicker: () => ipcRenderer.invoke('open-picker'),
  saveTheme: (json) => ipcRenderer.invoke('save-theme', json),
  onColorPicked: (callback) => ipcRenderer.on('color-from-picker', (_, hex) => callback(hex)),

  // Picker window only
  onScreenshotData: (callback) => ipcRenderer.on('screenshot-data', (_, data) => callback(data)),
  sendColorPicked: (hex) => ipcRenderer.send('color-picked', hex),
  sendPickerCancel: () => ipcRenderer.send('picker-cancel')
});
