import { useEffect } from 'react'

export default function HelpModal({ onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide modal-help" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Справка</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body help-body">
          <section className="help-section">
            <h4>Горячие клавиши</h4>
            <ul>
              <li><kbd>⌘N</kbd> — добавить ссылку</li>
              <li><kbd>⌘⇧L</kbd> — показать/скрыть LinkShelf</li>
            </ul>
          </section>
          <section className="help-section">
            <h4>Добавление ссылок</h4>
            <ul>
              <li><strong>+ Добавить</strong> — вручную ввести URL</li>
              <li><strong>⋮ → Добавить из браузера</strong> — букмарклет для любого браузера</li>
              <li><strong>Расширения</strong> — Chrome, Firefox, Safari (см. папку browser-extensions)</li>
              <li><strong>Импорт</strong> — JSON или HTML-закладки из браузера</li>
            </ul>
          </section>
          <section className="help-section">
            <h4>Категории</h4>
            <p>Создавайте папки для организации ссылок. «Всё» показывает все ссылки, «Избранное» — закреплённые (★).</p>
          </section>
          <section className="help-section">
            <h4>Сортировка и вид</h4>
            <p><strong>Сетка</strong> / <strong>Список</strong> — режим отображения. <strong>Дата</strong>, <strong>Имя</strong>, <strong>Вручную</strong> — порядок карточек. В режиме «Вручную» можно перетаскивать.</p>
          </section>
          <section className="help-section">
            <h4>Данные</h4>
            <p>Всё хранится локально в <code>~/LinkShelf/links.json</code>. Папку можно изменить через ⋮ → Изменить папку данных.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
