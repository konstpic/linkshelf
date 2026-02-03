# 📚 LinkShelf

**Быстрый менеджер ссылок для macOS** — храните закладки в одном месте, с превью сайтов и категориями. Локально, без облака и подписок.

![macOS](https://img.shields.io/badge/platform-macOS-000000?style=flat-square&logo=apple)
![Electron](https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)

---

## ✨ Возможности

| Функция | Описание |
|--------|----------|
| **Категории** | Создавайте папки с эмодзи (Работа, Развлечения, Учёба и т.д.) |
| **Карточки ссылок** | Название, URL, превью сайта в iframe (если сайт разрешает) |
| **Поиск** | По названию и URL по всем ссылкам |
| **Один клик** | Открытие ссылки в Safari/Chrome по клику на карточку |
| **macOS-стиль** | Vibrancy (матовое стекло), нативный менюбар |
| **Локальные данные** | Всё хранится в `~/LinkShelf/links.json` — никаких облаков |

---

## 🚀 Установка и запуск

### Требования

- **Node.js** 18+
- **macOS** (Apple Silicon или Intel)

### Клонирование и запуск в режиме разработки

```bash
git clone https://github.com/konstpic/linkshelf.git
cd linkshelf
npm install
npm run dev
```

Откроется окно приложения, Vite подхватит горячую перезагрузку. DevTools доступны по умолчанию.

### Сборка .dmg для установки

```bash
npm run build
```

Готовый образ появится в папке `release/`. Перенесите **LinkShelf.app** в **Programs** (или смонтируйте `.dmg` и перетащите оттуда).

> **Если macOS блокирует запуск (Gatekeeper):**  
> Системные настройки → Конфиденциальность и безопасность → «Всё равно открыть»,  
> или в терминале:  
> `xattr -r -d com.apple.quarantine /Applications/LinkShelf.app`

---

## 📁 Структура проекта

| Путь | Назначение |
|------|------------|
| `main.cjs` | Electron main: окно, IPC, чтение/запись JSON |
| `preload.cjs` | Мост renderer ↔ main через `contextBridge` |
| `src/main.jsx` | Точка входа React |
| `src/App.jsx` | UI: сайдбар, карточки, модалки, логика |
| `src/styles.css` | Стили (тёмная тема, glass-эффект) |
| `vite.config.js` | Конфигурация Vite и сборки |
| `renderer/` | Собранный фронт для production |

---

## 📄 Данные

Файл: **`~/LinkShelf/links.json`**

Формат:

```json
{
  "categories": ["Всё", "Работа", "Развлечения"],
  "links": [
    {
      "id": "1234567890",
      "title": "GitHub",
      "url": "https://github.com",
      "category": "Работа",
      "tags": ["код", "репозиторий"],
      "description": "",
      "pinned": false,
      "order": 0,
      "createdAt": 1700000000000,
      "favicon": ""
    }
  ]
}
```

Поля `tags`, `description`, `pinned`, `order`, `createdAt`, `favicon` опциональны; старые данные без них остаются валидными.

Файл можно править вручную — при следующем открытии приложения изменения подхватятся.

---

## 🛠 Стек

- **Electron** — десктопное приложение
- **React 18** — интерфейс
- **Vite 6** — сборка и dev-сервер
- **electron-builder** — упаковка в .dmg

---

## 📜 Лицензия

MIT (или укажите свою).  
Автор: [k.pichugin](https://github.com/konstpic).

---

**LinkShelf** — простой и быстрый способ держать ссылки под рукой. 🚀
