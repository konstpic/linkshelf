import { useState, useEffect } from 'react'

const BOOKMARKLET_CODE = "javascript:location.href='linkshelf://add?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title);"

export default function BookmarkletModal({ onClose }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Добавить из браузера</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="bookmarklet-instruction">
            Создайте закладку в браузере, замените её URL на скопированный код — при клике на закладку страница добавится в LinkShelf.
          </p>
          <div className="field">
            <label>Код букмарклета</label>
            <div className="bookmarklet-code-wrap">
              <code className="bookmarklet-code">{BOOKMARKLET_CODE}</code>
              <button
                type="button"
                className={`btn-copy-bookmarklet ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? 'Скопировано' : 'Скопировать'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
