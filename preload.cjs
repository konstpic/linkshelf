const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('linkShelfAPI', {
  loadLinks: () => ipcRenderer.invoke('links:load'),
  saveLinks: (data) => ipcRenderer.invoke('links:save', data),
  openExternal: (url) => ipcRenderer.invoke('links:open', url),
  exportData: () => ipcRenderer.invoke('links:export'),
  importData: () => ipcRenderer.invoke('links:import'),
  importBookmarks: () => ipcRenderer.invoke('links:importBookmarks'),
  openDataFolder: () => ipcRenderer.invoke('links:openDataFolder'),
  fetchFavicon: (url) => ipcRenderer.invoke('links:fetchFavicon', url),
  fetchPageTitle: (url) => ipcRenderer.invoke('links:fetchPageTitle', url),
  fetchPreviewImage: (url) => ipcRenderer.invoke('links:fetchPreviewImage', url),
  onOpenAddModal: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('open-add-modal', handler)
    return () => ipcRenderer.removeListener('open-add-modal', handler)
  },
  onOpenImport: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('open-import', handler)
    return () => ipcRenderer.removeListener('open-import', handler)
  },
  onOpenExport: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('open-export', handler)
    return () => ipcRenderer.removeListener('open-export', handler)
  },
  onOpenDataFolder: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('open-data-folder', handler)
    return () => ipcRenderer.removeListener('open-data-folder', handler)
  },
  onDataReload: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('data-reload', handler)
    return () => ipcRenderer.removeListener('data-reload', handler)
  },
})
