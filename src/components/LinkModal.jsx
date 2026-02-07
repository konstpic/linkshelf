import { useState, useEffect } from 'react'
import { normalizeUrl, getFaviconUrl } from '../utils/url'
import { getEmoji } from '../utils/emoji'
import { fetchPageTitle, fetchPageMeta } from '../api/linkShelf'

function parseTagsStr(str) {
  return str
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function LinkModal({ link, categories, onSave, onClose }) {
  const [title, setTitle] = useState(link?.title ?? '')
  const [url, setUrl] = useState(link?.url ?? '')
  const [category, setCategory] = useState(link?.category ?? categories[0])
  const [description, setDescription] = useState(link?.description ?? '')
  const [tagsStr, setTagsStr] = useState(Array.isArray(link?.tags) ? link.tags.join(', ') : '')
  const [pinned, setPinned] = useState(!!link?.pinned)
  const [loadingTitle, setLoadingTitle] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (link) {
      setTitle(link.title ?? '')
      setUrl(link.url ?? '')
      setCategory(link.category ?? categories[0])
      setDescription(link.description ?? '')
      setTagsStr(Array.isArray(link.tags) ? link.tags.join(', ') : '')
      setPinned(!!link.pinned)
    }
  }, [link, categories])

  const isEdit = !!link?.id
  const valid = url.trim().length > 0

  const handleFetchTitle = async () => {
    const u = normalizeUrl(url)
    if (!u) return
    setLoadingTitle(true)
    try {
      const t = await fetchPageTitle(u)
      if (t) setTitle(t)
    } finally {
      setLoadingTitle(false)
    }
  }

  const handleSave = async () => {
    if (!valid) return
    setSaving(true)
    try {
      const now = Date.now()
      const tags = parseTagsStr(tagsStr)
      const normalizedUrl = normalizeUrl(url)
      const meta = link?.previewImage && link?.favicon
        ? { previewImage: link.previewImage, favicon: link.favicon }
        : await fetchPageMeta(normalizedUrl)
      const previewImage = link?.previewImage ?? meta.previewImage ?? ''
      const faviconUrl = link?.favicon || meta.favicon || getFaviconUrl(normalizedUrl) || ''
      onSave({
        id: link?.id ?? String(now),
        title: title.trim(),
        url: normalizedUrl,
        category,
        tags,
        description: description.trim(),
        pinned,
        order: link?.order ?? 0,
        createdAt: link?.createdAt ?? now,
        favicon: faviconUrl,
        previewImage,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
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
            <div className="field-with-action">
              <input
                autoFocus={isEdit}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              />
              <button
                type="button"
                className="btn-fetch-title"
                onClick={handleFetchTitle}
                disabled={!url.trim() || loadingTitle}
                title="Подставить название со страницы"
              >
                {loadingTitle ? '…' : 'Название'}
              </button>
            </div>
          </div>
          <div className="field">
            <label>Категория</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{getEmoji(c)} {c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Теги (через запятую)</label>
            <input
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="код, репозиторий, open source"
            />
          </div>
          <div className="field">
            <label>Описание (опционально)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание ссылки"
              rows={2}
              className="field-textarea"
            />
          </div>
          <div className="field field-row">
            <label className="field-checkbox-label">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              <span>В избранном</span>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>Отмена</button>
          <button className="btn-save" disabled={!valid || saving} onClick={handleSave}>
            {saving ? 'Загрузка превью…' : isEdit ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}
