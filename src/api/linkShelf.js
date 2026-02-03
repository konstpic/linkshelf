const api = typeof window !== 'undefined' ? window.linkShelfAPI : null

export async function loadLinks() {
  if (api) return api.loadLinks()
  return { categories: ['Всё'], links: [] }
}

export async function saveLinks(data) {
  if (api) return api.saveLinks(data)
}

export function openExternal(url) {
  if (api) return api.openExternal(url)
  if (typeof window !== 'undefined') window.open(url, '_blank')
}

export async function exportData() {
  if (api) return api.exportData()
  return { ok: false }
}

export async function importData() {
  if (api) return api.importData()
  return { ok: false }
}

export async function importBookmarks() {
  if (api) return api.importBookmarks()
  return { ok: false }
}

export function openDataFolder() {
  if (api) return api.openDataFolder()
}

export function getDataPath() {
  if (api) return api.getDataPath()
  return Promise.resolve('')
}

export function getPendingAddData() {
  if (api) return api.getPendingAddData()
  return Promise.resolve(null)
}

export function openExtensionInBrowser(browser) {
  if (api) return api.openExtensionInBrowser(browser)
}

export async function setDataPath() {
  if (api) return api.setDataPath()
  return { ok: false }
}

export function fetchFavicon(url) {
  if (api) return api.fetchFavicon(url)
  return Promise.resolve('')
}

export function fetchPageTitle(url) {
  if (api) return api.fetchPageTitle(url)
  return Promise.resolve('')
}

export function fetchPreviewImage(url) {
  if (api) return api.fetchPreviewImage(url)
  return Promise.resolve('')
}
