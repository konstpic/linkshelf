import { useState } from 'react'
import { getDomain } from '../utils/url'

export default function LinkCard({ link, onOpen, onEdit, onDelete, onTogglePinned, onContextMenu: onContextMenuProp }) {
  const [previewImageError, setPreviewImageError] = useState(false)
  const [faviconError, setFaviconError] = useState(false)
  const showFavicon = link.favicon && !faviconError

  const hasPreviewImage = link.previewImage && !previewImageError
  const tags = Array.isArray(link.tags) ? link.tags : []
  const hasDescription = link.description && String(link.description).trim()

  const handleStarClick = (e) => {
    e.stopPropagation()
    onTogglePinned?.(link)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    onContextMenuProp?.(e, link)
  }

  return (
    <div className="link-card" onClick={() => onOpen(link.url)} onContextMenu={handleContextMenu}>
      <div className="card-preview">
        {hasPreviewImage ? (
          <img
            src={link.previewImage}
            alt=""
            className="card-preview-image"
            onError={() => setPreviewImageError(true)}
          />
        ) : (
          <div className="card-preview-fallback">
            <div className="fallback-icon">🌐</div>
            <div className="fallback-domain">{getDomain(link.url)}</div>
          </div>
        )}
        {onTogglePinned && (
          <button
            type="button"
            className={`card-pinned ${link.pinned ? 'is-pinned' : ''}`}
            onClick={handleStarClick}
            title={link.pinned ? 'Убрать из избранного' : 'В избранное'}
            aria-label={link.pinned ? 'Убрать из избранного' : 'В избранное'}
          >
            ★
          </button>
        )}
      </div>

      <div className="card-body">
        <div className="card-title-row">
          {showFavicon && (
            <img
              src={link.favicon}
              alt=""
              className="card-favicon"
              width={16}
              height={16}
              onError={() => setFaviconError(true)}
            />
          )}
          <div className="card-title">{link.title || getDomain(link.url)}</div>
        </div>
        {hasDescription && (
          <div className="card-description" title={link.description}>
            {String(link.description).trim().slice(0, 60)}
            {String(link.description).trim().length > 60 ? '…' : ''}
          </div>
        )}
        <div className="card-url">{getDomain(link.url)}</div>
        {tags.length > 0 && (
          <div className="card-tags">
            {tags.slice(0, 4).map((tag) => (
              <span key={tag} className="card-tag-chip">{tag}</span>
            ))}
            {tags.length > 4 && <span className="card-tag-more">+{tags.length - 4}</span>}
          </div>
        )}
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
