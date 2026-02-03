import { useState } from 'react'
import { getEmoji, getAbbreviation } from '../utils/emoji'

export default function Sidebar({
  categories,
  activeCategory,
  onSelect,
  onAddCategory,
  onDeleteCategory,
  linkCounts,
  collapsed,
}) {
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState('')

  const handleAdd = () => {
    const trimmed = newCat.trim()
    if (trimmed === 'Избранное' || trimmed === 'Всё') {
      setNewCat('')
      setAdding(false)
      return
    }
    if (trimmed && !categories.includes(trimmed)) {
      onAddCategory(trimmed)
      setNewCat('')
      setAdding(false)
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} data-tour="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg viewBox="0 0 28 28" fill="none">
            <rect x="2" y="4" width="24" height="20" rx="4" stroke="#6366f1" strokeWidth="2" fill="none" />
            <path d="M2 10h24" stroke="#6366f1" strokeWidth="2" />
            <circle cx="7" cy="7" r="1.2" fill="#ef4444" />
            <circle cx="11" cy="7" r="1.2" fill="#f59e0b" />
            <circle cx="15" cy="7" r="1.2" fill="#22c55e" />
            <rect x="6" y="15" width="7" height="5" rx="1.5" fill="rgba(99,102,241,0.35)" />
            <rect x="15" y="15" width="7" height="5" rx="1.5" fill="rgba(99,102,241,0.22)" />
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
                {(cat !== 'Всё' && cat !== 'Избранное') && (
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
