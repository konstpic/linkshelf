export function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function normalizeUrl(url) {
  url = url.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  return url
}
