const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('linkShelfAPI', {
  loadLinks: () => ipcRenderer.invoke('links:load'),
  saveLinks: (data) => ipcRenderer.invoke('links:save', data),
  openExternal: (url) => ipcRenderer.invoke('links:open', url),
})
