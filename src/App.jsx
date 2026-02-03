import { useState, useEffect, useCallback } from 'react'

/* ─── Helpers ─── */
const getDomain = (url) => {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

const normalizeUrl = (url) => {
  url = url.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  return url
}

const EMOJI_MAP = {
  'Всё': '📂',
  'Работа': '💼',
  'Развлечения': '🎮',
  'Новости': '📰',
  'Инструменты': '🛠️',
  'Учёба': '📚',
}

const getEmoji = (name) => EMOJI_MAP[name] || '📁'

// Получить аббревиатуру (первые буквы слов)
const getAbbreviation = (name) => {
  if (name.length <= 2) return name.toUpperCase()
  const words = name.split(/\s+/)
  if (words.length > 1) {
    // Если несколько слов - берем первые буквы каждого слова
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }
  // Если одно слово - берем первые 2 буквы
  return name.slice(0, 2).toUpperCase()
}

/* ─── Hooks ─── */
function useDataStore() {
  const [data, setData] = useState({ categories: ['Всё'], links: [] })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (window.linkShelfAPI) {
      window.linkShelfAPI.loadLinks().then((d) => {
        setData(d)
        setLoaded(true)
      })
    } else {
      // fallback for browser dev without electron
      setLoaded(true)
    }
  }, [])

  const save = useCallback((newData) => {
    setData(newData)
    if (window.linkShelfAPI) window.linkShelfAPI.saveLinks(newData)
  }, [])

  return { data, save, loaded }
}

/* ─── Components ─── */

// Sidebar
function Sidebar({ categories, activeCategory, onSelect, onAddCategory, onDeleteCategory, linkCounts, collapsed }) {
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState('')

  const handleAdd = () => {
    const trimmed = newCat.trim()
    if (trimmed && !categories.includes(trimmed)) {
      onAddCategory(trimmed)
      setNewCat('')
      setAdding(false)
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg viewBox="0 0 28 28" fill="none">
            <rect x="2" y="4" width="24" height="20" rx="4" stroke="#6366f1" strokeWidth="2" fill="none"/>
            <path d="M2 10h24" stroke="#6366f1" strokeWidth="2"/>
            <circle cx="7" cy="7" r="1.2" fill="#ef4444"/>
            <circle cx="11" cy="7" r="1.2" fill="#f59e0b"/>
            <circle cx="15" cy="7" r="1.2" fill="#22c55e"/>
            <rect x="6" y="15" width="7" height="5" rx="1.5" fill="rgba(99,102,241,0.35)"/>
            <rect x="15" y="15" width="7" height="5" rx="1.5" fill="rgba(99,102,241,0.22)"/>
          </svg>
          {!collapsed && <span>LinkShelf</span>}
        </div>
      </div>

      {!collapsed && <div className="sidebar-section-label">Категории</div>}

      <div className="sidebar-cat-list">
        {categories.map((cat) => (
          <div
            key={cat}
            className={`sidebar-cat-item ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => onSelect(cat)}
            title={collapsed ? cat : undefined}
          >
            {collapsed ? (
              <>
                <span className="cat-icon">{getEmoji(cat)}</span>
                <span className="cat-abbr">{getAbbreviation(cat)}</span>
              </>
            ) : (
              <>
                <span className="cat-icon">{getEmoji(cat)}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                <span className="cat-count">{linkCounts[cat] || 0}</span>
                {cat !== 'Всё' && (
                  <button className="cat-delete" onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat) }}>
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {adding && !collapsed && (
          <div className="cat-input-wrap">
            <input
              autoFocus
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Название..."
            />
            <button onClick={handleAdd}>+</button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="sidebar-bottom">
          <button className="btn-add-cat" onClick={() => setAdding(true)}>
            <span>+</span> Новая категория
          </button>
        </div>
      )}
    </aside>
  )
}

// Link Card
function LinkCard({ link, onOpen, onEdit, onDelete }) {
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [previewError, setPreviewError] = useState(false)

  const tryPreview = link.url && !previewError

  return (
    <div className="link-card" onClick={() => onOpen(link.url)}>
      <div className="card-preview">
        {tryPreview && (
          <iframe
            src={link.url}
            sandbox="allow-scripts"
            onLoad={() => setPreviewLoaded(true)}
            onError={() => setPreviewError(true)}
            style={{ display: previewLoaded ? 'block' : 'none' }}
          />
        )}
        {(!previewLoaded || previewError) && (
          <div className="card-preview-fallback">
            <div className="fallback-icon">🌐</div>
            <div className="fallback-domain">{getDomain(link.url)}</div>
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="card-title">{link.title || getDomain(link.url)}</div>
        <div className="card-url">{getDomain(link.url)}</div>
        <div className="card-footer">
          <span className="card-tag">{link.category}</span>
          <div className="card-actions" onClick={(e) => e.stopPropagation()}>
            <button className="card-btn" onClick={() => onEdit(link)} title="Редактировать">✎</button>
            <button className="card-btn danger" onClick={() => onDelete(link.id)} title="Удалить">🗑</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal — Add / Edit
function LinkModal({ link, categories, onSave, onClose }) {
  const [title, setTitle]       = useState(link?.title || '')
  const [url, setUrl]           = useState(link?.url || '')
  const [category, setCategory] = useState(link?.category || categories[0])

  const isEdit = !!link?.id
  const valid  = url.trim().length > 0

  const handleSave = () => {
    if (!valid) return
    onSave({
      id:       link?.id || Date.now().toString(),
      title:    title.trim(),
      url:      normalizeUrl(url),
      category,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Редактировать ссылку' : 'Новая ссылка'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Название (опционально)</label>
            <input
              autoFocus={!isEdit}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: GitHub"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            />
          </div>
          <div className="field">
            <label>URL</label>
            <input
              autoFocus={isEdit}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            />
          </div>
          <div className="field">
            <label>Категория</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{getEmoji(c)} {c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-save" disabled={!valid} onClick={handleSave}>
            {isEdit ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── App ─── */
export default function App() {
  const { data, save, loaded } = useDataStore()
  const [activeCategory, setActiveCategory] = useState('Всё')
  const [search, setSearch]                 = useState('')
  const [modalLink, setModalLink]           = useState(null) // null = closed, {} = new, {id,...} = edit
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!loaded) return null

  const { categories, links } = data

  // ── filtered list ──
  const filtered = links.filter((l) => {
    const matchCat  = activeCategory === 'Всё' || l.category === activeCategory
    const q         = search.toLowerCase()
    const matchQ    = !q || (l.title || '').toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  // ── link counts per category ──
  const linkCounts = { 'Всё': links.length }
  categories.forEach((c) => { linkCounts[c] = links.filter((l) => l.category === c).length })

  // ── CRUD ──
  const addOrUpdateLink = (link) => {
    const exists = links.find((l) => l.id === link.id)
    const newLinks = exists
      ? links.map((l) => (l.id === link.id ? link : l))
      : [...links, link]
    save({ categories, links: newLinks })
    setModalLink(null)
  }

  const deleteLink = (id) => {
    save({ categories, links: links.filter((l) => l.id !== id) })
  }

  const addCategory = (name) => {
    if (!categories.includes(name)) save({ categories: [...categories, name], links })
  }

  const deleteCategory = (name) => {
    save({
      categories: categories.filter((c) => c !== name),
      links: links.filter((l) => l.category !== name),
    })
    if (activeCategory === name) setActiveCategory('Всё')
  }

  const openExternal = (url) => {
    if (window.linkShelfAPI) window.linkShelfAPI.openExternal(url)
    else window.open(url, '_blank')
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Кнопка сворачивания на границе сайдбара */}
      <button 
        className="sidebar-toggle" 
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
        title={sidebarCollapsed ? "Развернуть" : "Свернуть"}
      >
        {sidebarCollapsed ? '→' : '←'}
      </button>

      {/* Sidebar */}
      <Sidebar
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        linkCounts={linkCounts}
        collapsed={sidebarCollapsed}
      />

      {/* Main */}
      <div className="main-content">
        <div className="topbar">
          <div className="search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="7" cy="7" r="4.5"/>
              <line x1="10.5" y1="10.5" x2="14" y2="14"/>
            </svg>
            <input
              className="search-input"
              placeholder="Поиск ссылок…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-add-link" onClick={() => setModalLink({})}>
            <span style={{ fontSize: 16 }}>+</span> Добавить
          </button>
        </div>

        <div className="grid-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <p>
                {search
                  ? 'Ничего не найдено по вашему запросу.'
                  : 'Пока нет ссылок. Нажмите «+ Добавить», чтобы добавить первую!'}
              </p>
            </div>
          ) : (
            <div className="links-grid">
              {filtered.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onOpen={openExternal}
                  onEdit={() => setModalLink(link)}
                  onDelete={deleteLink}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalLink !== null && (
        <LinkModal
          link={modalLink.id ? modalLink : null}
          categories={categories}
          onSave={addOrUpdateLink}
          onClose={() => setModalLink(null)}
        />
      )}
    </div>
  )
}
