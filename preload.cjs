const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('linkShelfAPI', {
  loadLinks: () => ipcRenderer.invoke('links:load'),
  saveLinks: (data) => ipcRenderer.invoke('links:save', data),
  openExternal: (url) => ipcRenderer.invoke('links:open', url),
  exportData: () => ipcRenderer.invoke('links:export'),
  importData: () => ipcRenderer.invoke('links:import'),
  importBookmarks: () => ipcRenderer.invoke('links:importBookmarks'),
  openDataFolder: () => ipcRenderer.invoke('links:openDataFolder'),
  getDataPath: () => ipcRenderer.invoke('links:getDataPath'),
  getPendingAddData: () => ipcRenderer.invoke('links:getPendingAddData'),
  openExtensionInBrowser: (browser) => ipcRenderer.invoke('links:openExtensionInBrowser', browser),
  setDataPath: () => ipcRenderer.invoke('links:setDataPath'),
  fetchFavicon: (url) => ipcRenderer.invoke('links:fetchFavicon', url),
  fetchPageTitle: (url) => ipcRenderer.invoke('links:fetchPageTitle', url),
  fetchPreviewImage: (url) => ipcRenderer.invoke('links:fetchPreviewImage', url),
  fetchPageMeta: (url) => ipcRenderer.invoke('links:fetchPageMeta', url),
  fetchImageBlob: (url) => ipcRenderer.invoke('links:fetchImageBlob', url),
  onOpenAddModal: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('open-add-modal', handler)
    return () => ipcRenderer.removeListener('open-add-modal', handler)
  },
  onOpenAddWithData: (callback) => {
    const handler = (_e, data) => callback(data)
    ipcRenderer.on('open-add-with-data', handler)
    return () => ipcRenderer.removeListener('open-add-with-data', handler)
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
  onOpenHelp: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('open-help', handler)
    return () => ipcRenderer.removeListener('open-help', handler)
  },
  onOpenOnboarding: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('open-onboarding', handler)
    return () => ipcRenderer.removeListener('open-onboarding', handler)
  },
  onDataReload: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('data-reload', handler)
    return () => ipcRenderer.removeListener('data-reload', handler)
  },
  onFetchPreviewLog: (callback) => {
    const handler = (_e, payload) => callback(payload)
    ipcRenderer.on('links:fetchPreviewLog', handler)
    return () => ipcRenderer.removeListener('links:fetchPreviewLog', handler)
  },
})
