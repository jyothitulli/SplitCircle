const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, safe API to the renderer process via contextBridge.
// This keeps nodeIntegration off (good for security) while still allowing
// the React app to use platform-specific features when running inside Electron.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getVersion: () => ipcRenderer.invoke('get-version'),
});
