import { useEffect } from 'react'

export default function ContextMenu({ x, y, link, onOpen, onEdit, onCopyUrl, onDelete, onTogglePinned, onClose }) {
  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.closest?.('.context-menu')) return
      onClose?.()
    }
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (!link) return null

  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={() => { onOpen?.(link.url); onClose?.() }}>
        Открыть
      </button>
      <button type="button" onClick={() => { onEdit?.(link); onClose?.() }}>
        Редактировать
      </button>
      <button type="button" onClick={() => { onCopyUrl?.(link.url); onClose?.() }}>
        Копировать URL
      </button>
      <button type="button" onClick={() => { onTogglePinned?.(link); onClose?.() }}>
        {link.pinned ? 'Убрать из избранного' : 'В избранное'}
      </button>
      <button type="button" className="danger" onClick={() => { onDelete?.(link.id); onClose?.() }}>
        Удалить
      </button>
    </div>
  )
}
