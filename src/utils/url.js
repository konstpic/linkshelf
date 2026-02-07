export function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function getFaviconUrl(pageUrl) {
  try {
    const url = String(pageUrl || '').trim()
    if (!url) return ''
    const origin = url.startsWith('http') ? new URL(url).origin : `https://${getDomain('https://' + url)}`
    return `${origin}/favicon.ico`
  } catch {
    return ''
  }
}

export function normalizeUrl(url) {
  url = url.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  return url
}
