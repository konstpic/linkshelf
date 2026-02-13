import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { useDataStore } from './hooks/useDataStore'
import { openExternal, exportData, importData, importBookmarks, openDataFolder, setDataPath, getPendingAddData, openExtensionInBrowser } from './api/linkShelf'
import { getDomain } from './utils/url'
import { removeCachedFaviconUrl } from './utils/faviconCache'
import { removeCachedPreviewUrl } from './utils/previewCache'
import Sidebar from './components/Sidebar'
import LinkCard from './components/LinkCard'
import SortableLinkCard from './components/SortableLinkCard'
import LinkModal from './components/LinkModal'
import BookmarkletModal from './components/BookmarkletModal'
import HelpModal from './components/HelpModal'
import OnboardingTour, { isOnboardingDone } from './components/OnboardingTour'
import ContextMenu from './components/ContextMenu'

const SORT_STORAGE_KEY = 'linkshelf_sortOrder'
const VIEW_STORAGE_KEY = 'linkshelf_viewMode'
const THEME_STORAGE_KEY = 'linkshelf_theme'
const LIQUID_GLASS_STORAGE_KEY = 'linkshelf_liquid_glass'

function getStoredSortOrder() {
  try {
    const v = localStorage.getItem(SORT_STORAGE_KEY)
    if (v === 'date' || v === 'name' || v === 'manual') return v
  } catch {}
  return 'date'
}

function getStoredViewMode() {
  try {
    const v = localStorage.getItem(VIEW_STORAGE_KEY)
    if (v === 'grid' || v === 'list') return v
  } catch {}
  return 'grid'
}

function getStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {}
  return 'dark'
}

function getStoredLiquidGlass() {
  try {
    const v = localStorage.getItem(LIQUID_GLASS_STORAGE_KEY)
    return v === 'true' || v === '1'
  } catch {}
  return false
}

export default function App() {
  const { data, save, loaded, reload } = useDataStore()
  const [activeCategory, setActiveCategory] = useState('Всё')
  const [search, setSearch] = useState('')
  const [modalLink, setModalLink] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sortOrder, setSortOrderState] = useState(getStoredSortOrder)
  const [viewMode, setViewModeState] = useState(getStoredViewMode)
  const [theme, setThemeState] = useState(getStoredTheme)
  const [liquidGlass, setLiquidGlassState] = useState(getStoredLiquidGlass)
  const [contextMenu, setContextMenu] = useState(null)
  const [bookmarkletModalOpen, setBookmarkletModalOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  const setSortOrder = (v) => {
    setSortOrderState(v)
    try {
      localStorage.setItem(SORT_STORAGE_KEY, v)
    } catch {}
  }

  const setViewMode = (v) => {
    setViewModeState(v)
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, v)
    } catch {}
  }

  const setTheme = (v) => {
    setThemeState(v)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, v)
    } catch {}
  }

  const setLiquidGlass = (v) => {
    setLiquidGlassState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      try {
        localStorage.setItem(LIQUID_GLASS_STORAGE_KEY, next ? 'true' : 'false')
      } catch {}
      return next
    })
  }

  useEffect(() => {
    const effective = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    document.documentElement.setAttribute('data-theme', effective)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-liquid-glass', liquidGlass ? 'true' : 'false')
  }, [liquidGlass])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    if (theme !== 'system') return
    const handler = () => {
      document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const handleImportRef = useRef(null)
  const handleExportRef = useRef(null)

  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.linkShelfAPI : null
    if (!api?.onOpenAddModal) return
    const unsubAdd = api.onOpenAddModal(() => setModalLink({}))
    const unsubAddWithData = api.onOpenAddWithData?.((data) => setModalLink(data || {}))
    const unsubImport = api.onOpenImport?.(() => handleImportRef.current?.())
    const unsubExport = api.onOpenExport?.(() => handleExportRef.current?.())
    const unsubFolder = api.onOpenDataFolder?.(() => openDataFolder())
    const unsubReload = api.onDataReload?.(() => reload())
    const unsubHelp = api.onOpenHelp?.(() => setHelpModalOpen(true))
    const unsubOnboarding = api.onOpenOnboarding?.(() => setOnboardingOpen(true))
    const unsubPreviewLog = api.onFetchPreviewLog?.((payload) => {
      if (payload.phase === 'start') console.log('[LinkShelf] GET (preview)', payload.url)
      if (payload.phase === 'end') console.log('[LinkShelf] preview', payload.url, '→', payload.previewUrl || '(none)')
      if (payload.phase === 'error') console.warn('[LinkShelf] preview error', payload.url, payload.err)
    })
    getPendingAddData?.().then((data) => {
      if (data && data.url) setModalLink(data)
    })
    if (!isOnboardingDone()) setTimeout(() => setOnboardingOpen(true), 400)
    return () => {
      unsubAdd?.()
      unsubAddWithData?.()
      unsubImport?.()
      unsubExport?.()
      unsubFolder?.()
      unsubReload?.()
      unsubHelp?.()
      unsubOnboarding?.()
      unsubPreviewLog?.()
    }
  }, [reload])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const updateLinkPreview = useCallback((link, previewImageUrl) => {
    if (!link?.id || !previewImageUrl) return
    save((prev) => ({
      ...prev,
      links: prev.links.map((l) =>
        l.id === link.id ? { ...l, previewImage: previewImageUrl } : l
      ),
    }))
  }, [save])

  const updateLinkFavicon = useCallback((link, faviconUrl) => {
    if (!link?.id || faviconUrl == null) return
    save((prev) => ({
      ...prev,
      links: prev.links.map((l) =>
        l.id === link.id ? { ...l, favicon: faviconUrl } : l
      ),
    }))
  }, [save])

  if (!loaded) {
    return (
      <div className="app-loading">
        <div className="app-loading-bg" aria-hidden="true" />
        <div className="app-loading-content">
          <h1 className="app-loading-title">LinkShelf</h1>
          <p className="app-loading-subtitle">Загрузка ссылок…</p>
          <div className="app-loading-shelf">
            <span className="app-loading-shelf-bar" style={{ '--i': 0 }} />
            <span className="app-loading-shelf-bar" style={{ '--i': 1 }} />
            <span className="app-loading-shelf-bar" style={{ '--i': 2 }} />
            <span className="app-loading-shelf-bar" style={{ '--i': 3 }} />
          </div>
          <div className="app-loading-dots">
            <span className="app-loading-dot" style={{ '--i': 0 }} />
            <span className="app-loading-dot" style={{ '--i': 1 }} />
            <span className="app-loading-dot" style={{ '--i': 2 }} />
          </div>
        </div>
        <div className="app-loading-floats" aria-hidden="true">
          <span className="app-loading-float" style={{ '--x': '10%', '--d': '2s' }}>🔗</span>
          <span className="app-loading-float" style={{ '--x': '85%', '--d': '2.5s' }}>📑</span>
          <span className="app-loading-float" style={{ '--x': '25%', '--d': '3s' }}>⭐</span>
          <span className="app-loading-float" style={{ '--x': '70%', '--d': '2.2s' }}>🔖</span>
          <span className="app-loading-float" style={{ '--x': '50%', '--d': '2.8s' }}>📌</span>
        </div>
      </div>
    )
  }

  const { categories, links } = data

  const displayCategories = ['Всё', 'Избранное', ...categories.filter((c) => c !== 'Всё')]

  const filtered = links.filter((l) => {
    const matchCat =
      activeCategory === 'Всё'
        ? true
        : activeCategory === 'Избранное'
          ? l.pinned
          : l.category === activeCategory
    const q = search.toLowerCase().trim()
    const matchQ =
      !q ||
      (l.title || '').toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q) ||
      (Array.isArray(l.tags) && l.tags.some((t) => String(t).toLowerCase().includes(q)))
    return matchCat && matchQ
  })

  const sortFn =
    sortOrder === 'date'
      ? (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      : sortOrder === 'name'
        ? (a, b) =>
            (a.title || getDomain(a.url) || '')
              .localeCompare(b.title || getDomain(b.url) || '', undefined, { sensitivity: 'base' })
        : (a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt || 0) - (b.createdAt || 0)

  const sortedFiltered = [...filtered].sort(sortFn)

  const linkCounts = { 'Всё': links.length, 'Избранное': links.filter((l) => l.pinned).length }
  categories.forEach((c) => { linkCounts[c] = links.filter((l) => l.category === c).length })

  const togglePinned = (link) => {
    const updated = { ...link, pinned: !link.pinned }
    const newLinks = links.map((l) => (l.id === link.id ? updated : l))
    save({ categories, links: newLinks })
  }

  const addOrUpdateLink = (link) => {
    const exists = links.find((l) => l.id === link.id)
    const newLinks = exists
      ? links.map((l) => (l.id === link.id ? link : l))
      : [...links, link]
    save({ categories, links: newLinks })
    setModalLink(null)
  }

  const deleteLink = (id) => {
    const link = links.find((l) => l.id === id)
    if (link?.favicon) removeCachedFaviconUrl(link.favicon)
    if (link?.previewImage) removeCachedPreviewUrl(link.previewImage)
    save({ categories, links: links.filter((l) => l.id !== id) })
  }

  const addCategory = (name) => {
    if (name === 'Избранное' || name === 'Всё') return
    if (!categories.includes(name)) save({ categories: [...categories, name], links })
  }

  const deleteCategory = (name) => {
    if (name === 'Избранное' || name === 'Всё') return
    save({
      categories: categories.filter((c) => c !== name),
      links: links.filter((l) => l.category !== name),
    })
    if (activeCategory === name) setActiveCategory('Всё')
  }

  const handleExport = async () => {
    const result = await exportData()
    if (result && !result.ok && result.error) console.error('Export failed:', result.error)
  }

  const handleImport = async () => {
    const result = await importData()
    if (result?.ok) await reload()
    else if (result?.error) console.error('Import failed:', result.error)
  }

  handleImportRef.current = handleImport
  handleExportRef.current = handleExport

  const handleImportBookmarks = async () => {
    const result = await importBookmarks()
    if (result?.ok) await reload()
    else if (result?.error) console.error('Import bookmarks failed:', result.error)
  }

  const handleCardContextMenu = (e, link) => {
    setContextMenu({ x: e.clientX, y: e.clientY, link })
  }

  const copyUrl = (url) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sortedFiltered.findIndex((l) => l.id === active.id)
    const newIndex = sortedFiltered.findIndex((l) => l.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(sortedFiltered, oldIndex, newIndex)
    const orderedIds = reordered.map((l) => l.id)
    const others = links.filter((l) => !orderedIds.includes(l.id)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const newLinks = [
      ...orderedIds.map((id, i) => {
        const link = links.find((l) => l.id === id)
        return link ? { ...link, order: i } : null
      }).filter(Boolean),
      ...others.map((l, i) => ({ ...l, order: orderedIds.length + i })),
    ]
    save({ categories, links: newLinks })
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? 'Развернуть' : 'Свернуть'}
      >
        {sidebarCollapsed ? '→' : '←'}
      </button>

      <Sidebar
        categories={displayCategories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        linkCounts={linkCounts}
        collapsed={sidebarCollapsed}
      />

      <div className="main-content">
        <div className="topbar">
          <div className="search-wrap" data-tour="search">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="7" cy="7" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
            <input
              className="search-input"
              placeholder="Поиск ссылок…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="more-menu-wrap" data-tour="more">
            <button
              type="button"
              className="btn-more"
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              title="Ещё"
              aria-label="Ещё"
            >
              ⋮
            </button>
            {moreMenuOpen && (
              <>
                <div className="dropdown-backdrop" onClick={() => setMoreMenuOpen(false)} />
                <div className="more-menu">
                  <button type="button" onClick={() => { openDataFolder(); setMoreMenuOpen(false) }}>
                    Открыть папку
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await setDataPath()
                      setMoreMenuOpen(false)
                      if (result?.ok) await reload()
                    }}
                  >
                    Изменить папку данных
                  </button>
                  <button type="button" onClick={() => { handleImport(); setMoreMenuOpen(false) }}>
                    Импорт JSON
                  </button>
                  <button type="button" onClick={() => { handleImportBookmarks(); setMoreMenuOpen(false) }}>
                    Импорт закладок
                  </button>
                  <button type="button" onClick={() => { handleExport(); setMoreMenuOpen(false) }}>
                    Экспорт
                  </button>
                  <button type="button" onClick={() => { setBookmarkletModalOpen(true); setMoreMenuOpen(false) }}>
                    Добавить из браузера
                  </button>
                  <div className="more-menu-divider" />
                  <span className="more-menu-label">Расширение</span>
                  <button type="button" onClick={() => { openExtensionInBrowser('chrome'); setMoreMenuOpen(false) }}>
                    Chrome
                  </button>
                  <button type="button" onClick={() => { openExtensionInBrowser('firefox'); setMoreMenuOpen(false) }}>
                    Firefox
                  </button>
                  <button type="button" onClick={() => { openExtensionInBrowser('safari'); setMoreMenuOpen(false) }}>
                    Safari
                  </button>
                  <div className="more-menu-divider" />
                  <button type="button" onClick={() => { setHelpModalOpen(true); setMoreMenuOpen(false) }}>
                    Справка
                  </button>
                  <button type="button" onClick={() => { setOnboardingOpen(true); setMoreMenuOpen(false) }}>
                    Показать обучение
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="view-segment">
            <button
              type="button"
              className={viewMode === 'grid' ? 'view-btn active' : 'view-btn'}
              onClick={() => setViewMode('grid')}
              title="Сетка"
            >
              Сетка
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'view-btn active' : 'view-btn'}
              onClick={() => setViewMode('list')}
              title="Список"
            >
              Список
            </button>
          </div>
          <div className="sort-segment">
            <button
              type="button"
              className={sortOrder === 'date' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setSortOrder('date')}
              title="По дате"
            >
              Дата
            </button>
            <button
              type="button"
              className={sortOrder === 'name' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setSortOrder('name')}
              title="По названию"
            >
              Имя
            </button>
            <button
              type="button"
              className={sortOrder === 'manual' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setSortOrder('manual')}
              title="Вручную (перетаскивание)"
            >
              Вручную
            </button>
          </div>
          <div className="theme-segment theme-segment-ios" title="Тема">
            <button
              type="button"
              className={theme === 'light' ? 'theme-btn active' : 'theme-btn'}
              onClick={() => setTheme('light')}
              title="Светлая"
            >
              Светлая
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'theme-btn active' : 'theme-btn'}
              onClick={() => setTheme('dark')}
              title="Тёмная"
            >
              Тёмная
            </button>
            <button
              type="button"
              className={theme === 'system' ? 'theme-btn active' : 'theme-btn'}
              onClick={() => setTheme('system')}
              title="Как в системе"
            >
              Авто
            </button>
            <button
              type="button"
              className={'liquid-glass-btn' + (liquidGlass ? ' active' : '')}
              title="Liquid Glass (морфизм)"
              onClick={() => setLiquidGlass((v) => !v)}
            >
              ◎
            </button>
          </div>
          <button className="btn-add-link" onClick={() => setModalLink({})} data-tour="add">
              <span style={{ fontSize: 16 }}>+</span> Добавить
            </button>
        </div>

        <div className="grid-wrap" data-tour="grid">
          {sortedFiltered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <p>
                {search
                  ? 'Ничего не найдено по вашему запросу.'
                  : 'Пока нет ссылок. Нажмите «+ Добавить», чтобы добавить первую!'}
              </p>
            </div>
          ) : sortOrder === 'manual' && viewMode === 'grid' ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedFiltered.map((l) => l.id)} strategy={rectSortingStrategy}>
                <div className="links-grid">
                  {sortedFiltered.map((link) => (
                    <SortableLinkCard
                      key={link.id}
                      link={link}
                      onOpen={openExternal}
                      onEdit={() => setModalLink(link)}
                      onDelete={deleteLink}
                      onTogglePinned={togglePinned}
                      onUpdatePreview={updateLinkPreview}
                      onUpdateFavicon={updateLinkFavicon}
                      onContextMenu={handleCardContextMenu}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className={viewMode === 'list' ? 'links-list' : 'links-grid'}>
              {sortedFiltered.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onOpen={openExternal}
                  onEdit={() => setModalLink(link)}
                  onDelete={deleteLink}
                  onTogglePinned={togglePinned}
                  onUpdatePreview={updateLinkPreview}
                  onUpdateFavicon={updateLinkFavicon}
                  onContextMenu={handleCardContextMenu}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {modalLink !== null && (
        <LinkModal
          link={modalLink}
          categories={categories}
          onSave={addOrUpdateLink}
          onClose={() => setModalLink(null)}
        />
      )}

      {bookmarkletModalOpen && (
        <BookmarkletModal onClose={() => setBookmarkletModalOpen(false)} />
      )}

      {helpModalOpen && (
        <HelpModal onClose={() => setHelpModalOpen(false)} />
      )}

      {onboardingOpen && (
        <OnboardingTour
          onComplete={() => setOnboardingOpen(false)}
          onSkip={() => setOnboardingOpen(false)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          link={contextMenu.link}
          onOpen={openExternal}
          onEdit={(link) => setModalLink(link)}
          onCopyUrl={copyUrl}
          onDelete={deleteLink}
          onTogglePinned={togglePinned}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
