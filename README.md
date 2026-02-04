# 📚 LinkShelf

**Быстрый менеджер ссылок** — храните закладки в одном месте, с превью сайтов и категориями. Локально, без облака и подписок.

![macOS](https://img.shields.io/badge/platform-macOS-000000?style=flat-square&logo=apple)
![Windows](https://img.shields.io/badge/platform-Windows-0078D6?style=flat-square&logo=windows)
![Linux](https://img.shields.io/badge/platform-Linux-FCC624?style=flat-square&logo=linux)
![Electron](https://img.shields.io/badge/Electron-40-47848F?style=flat-square&logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)

---

## ✨ Возможности

| Функция | Описание |
|--------|----------|
| **Категории** | Создавайте папки с эмодзи (Работа, Развлечения, Учёба и т.д.) |
| **Карточки ссылок** | Название, URL, превью сайта в iframe (если сайт разрешает) |
| **Поиск** | По названию и URL по всем ссылкам |
| **Один клик** | Открытие ссылки в браузере по клику на карточку |
| **Сортировка** | Перетаскивание карточек для изменения порядка |
| **Локальные данные** | Всё хранится в `~/LinkShelf/links.json` — никаких облаков |
| **Добавить из браузера** | Букмарклет и расширения для Chrome, Firefox, Safari |
| **Папка данных** | Настраиваемый путь к `links.json` |
| **Кроссплатформенность** | Работает на macOS, Windows и Linux |

---

## 🚀 Установка

### Скачать готовую сборку

Перейдите в [Releases](https://github.com/konstpic/linkshelf/releases) и скачайте установщик для вашей платформы:

- **macOS**: `LinkShelf-*.dmg` — смонтируйте и перетащите в Applications
- **Windows**: `LinkShelf Setup *.exe` — запустите установщик или используйте portable версию
- **Linux**: `LinkShelf-*.AppImage` — сделайте исполняемым (`chmod +x`) и запустите, или установите `.deb` пакет

### Требования для разработки

- **Node.js** 20+
- **npm** или **yarn**

---

## 🛠 Разработка

### Клонирование и запуск в режиме разработки

```bash
git clone https://github.com/konstpic/linkshelf.git
cd linkshelf
npm install
npm run dev
```

Откроется окно приложения, Vite подхватит горячую перезагрузку. DevTools доступны по умолчанию.

### Сборка для разных платформ

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux

# Все платформы сразу
npm run build:all
```

Готовые сборки появятся в папке `release/`.

> **macOS:** Если система блокирует запуск (Gatekeeper):  
> Системные настройки → Конфиденциальность и безопасность → «Всё равно открыть»,  
> или в терминале:  
> `xattr -r -d com.apple.quarantine /Applications/LinkShelf.app`

Подробнее о сборке см. [BUILD.md](BUILD.md).

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
| `browser-extensions/` | Расширения для браузеров |

---

## 🌐 Добавить из браузера

### Букмарклет

Нажмите кнопку **«Браузер»** в приложении, скопируйте код букмарклета. Создайте закладку в браузере и замените её URL на скопированный код. При клике на закладку текущая страница добавится в LinkShelf.

### Расширения для браузеров

Расширения с кнопкой «Add to LinkShelf» в панели инструментов:

- **Chrome / Edge / Brave:** `npm run build:extensions`, затем «Load unpacked» в `chrome://extensions` → выберите `browser-extensions/chrome/`
- **Firefox:** `npm run build:extensions`, затем `about:debugging` → «Load Temporary Add-on» → выберите `browser-extensions/firefox/manifest.json`
- **Safari:** `npm run build:safari` создаст Xcode-проект; см. `browser-extensions/README.md`

Подробности в [browser-extensions/README.md](browser-extensions/README.md).

---

## 📂 Папка данных

По умолчанию данные хранятся в `~/LinkShelf/links.json`. Папку можно изменить:

1. Кнопка **«Папка»** в топбаре → **«Изменить папку данных»**
2. Выберите другую папку (например, в iCloud Drive для синхронизации)
3. Файл `links.json` будет создан в выбранной папке

Конфиг: `~/LinkShelf/config.json` с полем `dataPath`.

---

## 📄 Формат данных

Файл: **`~/LinkShelf/links.json`** (путь настраивается в «Папка» → «Изменить папку данных»)

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

## 🛠 Технологический стек

- **Electron 40** — десктопное приложение
- **React 18** — интерфейс
- **Vite 6** — сборка и dev-сервер
- **electron-builder** — упаковка для всех платформ
- **@dnd-kit** — drag & drop для сортировки

---

## 🤖 Автоматическая сборка

При создании тега вида `v1.0.0` автоматически запускается сборка для всех платформ через GitHub Actions. Готовые артефакты публикуются в [Releases](https://github.com/konstpic/linkshelf/releases).

---

## 📜 Лицензия

MIT License

Copyright (c) 2026 k.pichugin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

**LinkShelf** — простой и быстрый способ держать ссылки под рукой. 🚀

Автор: [k.pichugin](https://github.com/konstpic)
