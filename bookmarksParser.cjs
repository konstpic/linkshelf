/**
 * Parse Chrome/Safari bookmarks HTML export into { title, url, folder }[]
 * Chrome: <DT><H3>Folder</H3><DL><DT><A HREF="url">title</A></DT>...
 * Safari: <DT><H3>Folder</H3>... or <DT><A HREF="url">title</A>
 */

function parseBookmarksHTML(html) {
  const result = []
  let currentFolder = 'Импорт'

  const stripTags = (s) => {
    if (!s || typeof s !== 'string') return ''
    return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
  }

  const hrefRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  const h3Re = /<h3[^>]*>([\s\S]*?)<\/h3>/gi

  const lines = html.split(/\r?\n/).join(' ')
  let pos = 0

  while (pos < lines.length) {
    const rest = lines.slice(pos)
    const h3Match = rest.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)
    const aMatch = rest.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i)

    let nextH3 = h3Match ? rest.indexOf(h3Match[0]) : -1
    let nextA = aMatch ? rest.indexOf(aMatch[0]) : -1
    if (nextH3 === -1) nextH3 = Infinity
    if (nextA === -1) nextA = Infinity

    if (nextH3 < nextA && h3Match) {
      currentFolder = stripTags(h3Match[1]) || currentFolder
      pos += nextH3 + h3Match[0].length
      continue
    }

    if (nextA < nextH3 && aMatch) {
      const url = (aMatch[1] || '').trim().replace(/&amp;/g, '&')
      const title = stripTags(aMatch[2]) || url
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://'))) {
        result.push({ title, url, folder: currentFolder })
      }
      pos += nextA + aMatch[0].length
      continue
    }

    break
  }

  return result
}

module.exports = { parseBookmarksHTML }
