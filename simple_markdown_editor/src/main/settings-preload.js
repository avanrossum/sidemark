const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  setSettings: (updates) => ipcRenderer.invoke('settings:set-multiple', updates),
  getVersion: () => ipcRenderer.invoke('app:version'),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
  getSystemTheme: () => ipcRenderer.invoke('app:system-theme'),
  onThemeChanged: (callback) => {
    const handler = (_, theme) => callback(theme);
    ipcRenderer.on('app:theme-changed', handler);
    return () => ipcRenderer.removeListener('app:theme-changed', handler);
  },
  closeWindow: () => ipcRenderer.invoke('settings:close'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
