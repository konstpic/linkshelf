import { useState, useEffect, useRef } from 'react'
import { getDomain, getFaviconUrl } from '../utils/url'
import { fetchPageMeta } from '../api/linkShelf'
import { getCachedFaviconUrl, setCachedFaviconUrl } from '../utils/faviconCache'
import { getCachedPreviewUrl, setCachedPreviewUrl } from '../utils/previewCache'
import { upscaleFaviconIfNeeded } from '../utils/upscaleFavicon'
import { fetchImageBlob } from '../api/linkShelf'

const FAVICON_FAILED = '__failed__'

function isGoogleFaviconUrl(url) {
  return typeof url === 'string' && (url.includes('google') || url.includes('gstatic'))
}

export default function LinkCard({ link, onOpen, onEdit, onDelete, onTogglePinned, onUpdatePreview, onUpdateFavicon, onContextMenu: onContextMenuProp }) {
  const [previewImageError, setPreviewImageError] = useState(false)
  const [faviconError, setFaviconError] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [faviconDisplayUrl, setFaviconDisplayUrl] = useState(() => getCachedFaviconUrl(link.favicon))
  const [previewDisplayUrl, setPreviewDisplayUrl] = useState(() => getCachedPreviewUrl(link.previewImage))
  const fetchedMetaRef = useRef(false)
  const showFavicon = link.favicon && link.favicon !== FAVICON_FAILED && !faviconError && !isGoogleFaviconUrl(link.favicon)

  const hasPreviewImage = link.previewImage && !previewImageError

  const needsPreview = !link.previewImage && !previewImageError
  const needsFavicon = !link.favicon || link.favicon === FAVICON_FAILED || isGoogleFaviconUrl(link.favicon)

  useEffect(() => {
    if (!link?.url || !(needsPreview || needsFavicon) || fetchedMetaRef.current) return
    if (!onUpdatePreview && !onUpdateFavicon) return
    if (isGoogleFaviconUrl(link.favicon) && onUpdateFavicon) {
      onUpdateFavicon(link, FAVICON_FAILED)
      return
    }
    fetchedMetaRef.current = true
    const delay = parseInt(String(link.id).slice(-3), 10) % 600
    const t = setTimeout(async () => {
      setLoadingPreview(true)
      try {
        const { previewImage, favicon } = await fetchPageMeta(link.url)
        if (previewImage && onUpdatePreview) onUpdatePreview(link, previewImage)
        const faviconToSet = favicon || getFaviconUrl(link.url)
        if (faviconToSet && onUpdateFavicon) onUpdateFavicon(link, faviconToSet)
      } finally {
        setLoadingPreview(false)
      }
    }, delay)
    return () => clearTimeout(t)
  }, [link?.id, link?.url, link?.previewImage, link?.favicon, previewImageError, needsPreview, needsFavicon, onUpdatePreview, onUpdateFavicon])

  useEffect(() => {
    if (!link?.favicon) return
    const cached = getCachedFaviconUrl(link.favicon)
    if (cached) setFaviconDisplayUrl(cached)
  }, [link?.favicon])

  useEffect(() => {
    if (!showFavicon || !link.favicon || getCachedFaviconUrl(link.favicon)) return
    let cancelled = false
    fetchImageBlob(link.favicon)
      .then((data) => {
        if (cancelled || !data?.base64) return null
        const binary = atob(data.base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        return new Blob([bytes], { type: data.mimeType || 'image/png' })
      })
      .then((blob) => (cancelled || !blob ? null : upscaleFaviconIfNeeded(blob)))
      .then((blob) => {
        if (cancelled || !blob) return
        const url = setCachedFaviconUrl(link.favicon, blob)
        if (url) setFaviconDisplayUrl(url)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [showFavicon, link?.favicon])

  useEffect(() => {
    if (!link?.previewImage) return
    const cached = getCachedPreviewUrl(link.previewImage)
    if (cached) setPreviewDisplayUrl(cached)
  }, [link?.previewImage])

  useEffect(() => {
    if (!hasPreviewImage || !link.previewImage || getCachedPreviewUrl(link.previewImage)) return
    let cancelled = false
    fetch(link.previewImage, { mode: 'cors' })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        if (cancelled) return
        const url = setCachedPreviewUrl(link.previewImage, blob)
        if (url) setPreviewDisplayUrl(url)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [hasPreviewImage, link?.previewImage])

  const faviconSrc = faviconDisplayUrl || (showFavicon ? link.favicon : null)
  const previewSrc = previewDisplayUrl || (hasPreviewImage ? link.previewImage : null)
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
        {hasPreviewImage && previewSrc ? (
          <img
            src={previewSrc}
            alt=""
            className="card-preview-image"
            onError={() => setPreviewImageError(true)}
          />
        ) : (
          <div className="card-preview-fallback">
            {loadingPreview ? (
              <div className="card-preview-loading" title="Загрузка превью…">
                <span className="card-preview-spinner" />
                <span className="fallback-domain">Загрузка…</span>
              </div>
            ) : showFavicon && faviconSrc ? (
              <>
                <img
                  src={faviconSrc}
                  alt=""
                  className="card-preview-fallback-favicon"
                  onError={() => setFaviconError(true)}
                />
                <div className="fallback-domain">{getDomain(link.url)}</div>
              </>
            ) : (
              <>
                <div className="fallback-icon">🌐</div>
                <div className="fallback-domain">{getDomain(link.url)}</div>
              </>
            )}
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
          {showFavicon && faviconSrc && (
            <img
              src={faviconSrc}
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
