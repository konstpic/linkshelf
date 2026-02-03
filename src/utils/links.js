export function normalizeLink(link) {
  if (!link || typeof link !== 'object') return null
  return {
    id: link.id,
    title: link.title ?? '',
    url: link.url,
    category: link.category ?? 'Всё',
    tags: Array.isArray(link.tags) ? link.tags : [],
    description: link.description ?? '',
    pinned: Boolean(link.pinned),
    order: typeof link.order === 'number' ? link.order : 0,
    createdAt: typeof link.createdAt === 'number' ? link.createdAt : (link.createdAt ? Date.parse(link.createdAt) : 0) || Date.now(),
    favicon: link.favicon ?? '',
    previewImage: link.previewImage ?? '',
  }
}

export function normalizeData(data) {
  if (!data || typeof data !== 'object') {
    return { categories: ['Всё'], links: [] }
  }
  const categories = Array.isArray(data.categories) && data.categories.length > 0
    ? data.categories
    : ['Всё']
  const links = Array.isArray(data.links)
    ? data.links.map((link) => normalizeLink(link)).filter(Boolean)
    : []
  return { categories, links }
}
