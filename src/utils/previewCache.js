const MAX_ENTRIES = 60
const cache = new Map()
const order = []

function evictOne() {
  while (order.length > 0) {
    const key = order.shift()
    const url = cache.get(key)
    cache.delete(key)
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url)
      } catch {}
    }
    return
  }
}

export function getCachedPreviewUrl(previewUrl) {
  if (!previewUrl || typeof previewUrl !== 'string') return null
  return cache.get(previewUrl) || null
}

export function setCachedPreviewUrl(previewUrl, blob) {
  if (!previewUrl || !blob) return null
  if (cache.has(previewUrl)) return cache.get(previewUrl)
  while (cache.size >= MAX_ENTRIES) evictOne()
  const objectUrl = URL.createObjectURL(blob)
  cache.set(previewUrl, objectUrl)
  order.push(previewUrl)
  return objectUrl
}

export function removeCachedPreviewUrl(previewUrl) {
  if (!previewUrl) return
  const objectUrl = cache.get(previewUrl)
  if (objectUrl) {
    cache.delete(previewUrl)
    const i = order.indexOf(previewUrl)
    if (i !== -1) order.splice(i, 1)
    if (objectUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(objectUrl)
      } catch {}
    }
  }
}
