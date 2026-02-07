const MAX_ENTRIES = 200
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

export function getCachedFaviconUrl(faviconUrl) {
  if (!faviconUrl || typeof faviconUrl !== 'string') return null
  return cache.get(faviconUrl) || null
}

export function setCachedFaviconUrl(faviconUrl, blob) {
  if (!faviconUrl || !blob) return null
  if (cache.has(faviconUrl)) return cache.get(faviconUrl)
  while (cache.size >= MAX_ENTRIES) evictOne()
  const objectUrl = URL.createObjectURL(blob)
  cache.set(faviconUrl, objectUrl)
  order.push(faviconUrl)
  return objectUrl
}

export function removeCachedFaviconUrl(faviconUrl) {
  if (!faviconUrl) return
  const objectUrl = cache.get(faviconUrl)
  if (objectUrl) {
    cache.delete(faviconUrl)
    const i = order.indexOf(faviconUrl)
    if (i !== -1) order.splice(i, 1)
    if (objectUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(objectUrl)
      } catch {}
    }
  }
}
