// ─── Disable all security warnings ───
// Отключаем все предупреждения безопасности (приложение только для личного использования)
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1'

const { app, BrowserWindow, ipcMain, Menu, shell, session, dialog, globalShortcut, Tray, nativeImage, net } = require('electron')
const path = require('path')
const fs   = require('fs')
const { exec } = require('child_process')
const { parseBookmarksHTML } = require('./bookmarksParser.cjs')

function getDomainFromUrl(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function fetchPageTitle(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  return net
    .fetch(url, { headers: { 'User-Agent': 'LinkShelf/1.0' }, signal: controller.signal })
    .then((res) => (res.ok ? res.text() : ''))
    .then((html) => {
      clearTimeout(timeout)
      const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      return match ? match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200) : ''
    })
    .catch(() => {
      clearTimeout(timeout)
      return ''
    })
}

function getBaseUrlFromHtml(html, pageUrl) {
  const baseMatch = html.match(/<base[^>]+href=["']([^"']+)["']/i)
  if (!baseMatch || !baseMatch[1]) return pageUrl
  try {
    const base = baseMatch[1].trim()
    return base.startsWith('http') ? base : new URL(base, pageUrl).href
  } catch {
    return pageUrl
  }
}

function parseFaviconFromHtml(html, pageUrl) {
  const baseUrl = getBaseUrlFromHtml(html, pageUrl)
  const linkTagRegex = /<link\s[^>]*>/gi
  const candidates = []
  let tagMatch
  while ((tagMatch = linkTagRegex.exec(html)) !== null) {
    const tag = tagMatch[0]
    const relMatch = tag.match(/\brel=["']([^"']*)["']/i)
    const hrefMatch = tag.match(/\bhref=["']([^"']*)["']/i)
    if (!hrefMatch || !hrefMatch[1] || !relMatch) continue
    const rel = (relMatch[1] || '').toLowerCase().trim()
    const href = hrefMatch[1].trim()
    if (!href || href === '#') continue
    const isIcon = (/\bicon\b/.test(rel) && !/mask-icon/.test(rel)) || rel === 'shortcut icon' || rel === 'icon shortcut'
    const isAppleTouch = /apple-touch-icon/.test(rel)
    if (!isIcon && !isAppleTouch) continue
    let size = 0
    const sizesMatch = tag.match(/\bsizes=["']([^"']*)["']/i)
    if (sizesMatch && sizesMatch[1]) {
      const s = sizesMatch[1].trim().toLowerCase()
      const numMatch = s.match(/(\d+)/)
      if (numMatch) size = parseInt(numMatch[1], 10)
      if (s.includes('x') && s.match(/(\d+)\s*x\s*(\d+)/)) {
        const [, w, h] = s.match(/(\d+)\s*x\s*(\d+)/)
        size = Math.max(parseInt(w, 10), parseInt(h, 10))
      }
    }
    try {
      const absolute = href.startsWith('http') ? href : new URL(href, baseUrl).href
      candidates.push({ url: absolute, size: isIcon ? size : 0, isAppleTouch: !!isAppleTouch })
    } catch {}
  }
  if (candidates.length === 0) return ''
  candidates.sort((a, b) => {
    if (a.isAppleTouch && !b.isAppleTouch) return 1
    if (!a.isAppleTouch && b.isAppleTouch) return -1
    return (b.size || 0) - (a.size || 0)
  })
  return candidates[0].url
}

function fetchPageMeta(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  return net
    .fetch(url, {
      headers: { 'User-Agent': 'LinkShelf/1.0' },
      signal: controller.signal,
    })
    .then((res) => (res.ok ? res.text() : Promise.reject(new Error('HTTP ' + res.status))))
    .then((html) => {
      clearTimeout(timeout)
      const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
      const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
      let previewImage = ''
      const rawPreview = (ogMatch && ogMatch[1]) || (twMatch && twMatch[1])
      if (rawPreview && rawPreview.trim()) {
        try {
          previewImage = rawPreview.startsWith('http') ? rawPreview : new URL(rawPreview.trim(), url).href
        } catch {}
      }
      let favicon = parseFaviconFromHtml(html, url)
      if (!favicon) {
        try {
          const u = new URL(url)
          favicon = u.origin + '/favicon.ico'
        } catch {}
      }
      if (!favicon) {
        const domain = getDomainFromUrl(url)
        if (domain) favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
      }
      return { previewImage, favicon: favicon || '' }
    })
    .catch(() => {
      clearTimeout(timeout)
      return { previewImage: '', favicon: '' }
    })
}

// Дополнительно отключаем предупреждения через command line
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')

// Имя приложения в меню и Dock (в dev режиме иначе показывается "Electron")
app.setName('LinkShelf')

// ─── Определение режима ───
// isDev будет определен в createWindow на основе наличия собранных файлов
let isDev = !app.isPackaged // По умолчанию

// ─── Debug log ───
function log(msg) {
  const logFile = path.join(require('os').homedir(), 'LinkShelf', 'debug.log')
  try {
    if (!fs.existsSync(path.dirname(logFile))) fs.mkdirSync(path.dirname(logFile), { recursive: true })
    fs.appendFileSync(logFile, new Date().toISOString() + ' ' + msg + '\n')
  } catch(e) {}
}

// ─── Data: ~/LinkShelf/links.json (configurable via config.json) ───
const configDir = path.join(app.getPath('home'), 'LinkShelf')
const configFile = path.join(configDir, 'config.json')

function readConfig() {
  try {
    if (fs.existsSync(configFile)) {
      const raw = fs.readFileSync(configFile, 'utf-8')
      const c = JSON.parse(raw)
      if (c && typeof c.dataPath === 'string' && c.dataPath.trim()) {
        const p = c.dataPath.trim()
        if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return { dataPath: p }
      }
    }
  } catch (e) {}
  return {}
}

function getDataDir() {
  const cfg = readConfig()
  return cfg.dataPath || configDir
}

function ensureDataDir() {
  const dir = getDataDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function getDataFile() {
  return path.join(getDataDir(), 'links.json')
}

function readLinks() {
  ensureDataDir()
  const dataFile = getDataFile()
  if (!fs.existsSync(dataFile)) return { categories: ['Всё'], links: [] }
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
  } catch {
    return { categories: ['Всё'], links: [] }
  }
}

function writeLinks(data) {
  ensureDataDir()
  fs.writeFileSync(getDataFile(), JSON.stringify(data, null, 2), 'utf-8')
}

// ─── IPC ───
ipcMain.handle('links:load', () => readLinks())
ipcMain.handle('links:getPendingAddData', () => consumePendingAddData())
ipcMain.handle('links:openExtensionInBrowser', (_e, browser) => {
  openExtensionInBrowser(browser)
  return true
})
ipcMain.handle('links:save', (_event, data) => { writeLinks(data); return true })
ipcMain.handle('links:open', (_event, url)  => { shell.openExternal(url) })

ipcMain.handle('links:export', async () => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(getDataDir(), 'links-export.json'),
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (!filePath) return { ok: false }
  try {
    const data = readLinks()
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('links:import', async () => {
  const { filePath } = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (!filePath || filePath.length === 0) return { ok: false }
  try {
    const raw = fs.readFileSync(filePath[0], 'utf-8')
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object' || !Array.isArray(data.links)) {
      return { ok: false, error: 'Invalid format' }
    }
    writeLinks(data)
    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('links:openDataFolder', () => {
  shell.openPath(getDataDir()).catch(() => {})
  return true
})

ipcMain.handle('links:getDataPath', () => getDataDir())

ipcMain.handle('links:setDataPath', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Выберите папку для хранения данных',
  })
  if (!filePaths || filePaths.length === 0) return { ok: false }
  const selected = filePaths[0]
  if (!fs.existsSync(selected) || !fs.statSync(selected).isDirectory()) {
    return { ok: false, error: 'Неверная папка' }
  }
  try {
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
    const cfg = readConfig()
    const newCfg = { ...cfg, dataPath: selected }
    fs.writeFileSync(configFile, JSON.stringify(newCfg, null, 2), 'utf-8')
    return { ok: true, dataPath: selected }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('links:fetchFavicon', (_event, url) => {
  const domain = getDomainFromUrl(url)
  if (!domain) return ''
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
})

ipcMain.handle('links:fetchImageBlob', async (_event, url) => {
  if (!url || !url.startsWith('http')) return null
  try {
    const res = await net.fetch(url, {
      headers: { 'User-Agent': 'LinkShelf/1.0' },
    })
    if (!res.ok) return null
    const ab = await res.arrayBuffer()
    const mimeType = res.headers.get('content-type') || 'image/png'
    const base64 = Buffer.from(ab).toString('base64')
    return { base64, mimeType: mimeType.split(';')[0].trim() }
  } catch {
    return null
  }
})

ipcMain.handle('links:fetchPageTitle', async (_event, url) => {
  try {
    return await fetchPageTitle(url)
  } catch {
    return ''
  }
})

const PREVIEW_CONCURRENCY = 6
const previewQueue = []
let previewRunning = 0

function processPreviewQueue() {
  if (previewRunning >= PREVIEW_CONCURRENCY || previewQueue.length === 0) return
  const { url, resolve } = previewQueue.shift()
  previewRunning += 1
  if (mainWindow?.webContents && !app.isPackaged) {
    mainWindow.webContents.send('links:fetchPreviewLog', { phase: 'start', url })
  }
  fetchPageMeta(url)
    .then((result) => {
      if (mainWindow?.webContents && !app.isPackaged) {
        mainWindow.webContents.send('links:fetchPreviewLog', { phase: 'end', url, previewUrl: result.previewImage || '', faviconUrl: result.favicon || '' })
      }
      resolve(result)
    })
    .catch((e) => {
      if (mainWindow?.webContents && !app.isPackaged) {
        mainWindow.webContents.send('links:fetchPreviewLog', { phase: 'error', url, err: e?.message || String(e) })
      }
      resolve({ previewImage: '', favicon: '' })
    })
    .finally(() => {
      previewRunning -= 1
      processPreviewQueue()
    })
}

ipcMain.handle('links:fetchPageMeta', (_event, url) => {
  return new Promise((resolve) => {
    previewQueue.push({ url, resolve })
    processPreviewQueue()
  })
})

ipcMain.handle('links:fetchPreviewImage', (_event, url) => {
  return new Promise((resolve) => {
    previewQueue.push({
      url,
      resolve: (result) => resolve(result.previewImage),
    })
    processPreviewQueue()
  })
})

ipcMain.handle('links:importBookmarks', async () => {
  const { filePath } = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
    properties: ['openFile'],
  })
  if (!filePath || filePath.length === 0) return { ok: false }
  try {
    const raw = fs.readFileSync(filePath[0], 'utf-8')
    const entries = parseBookmarksHTML(raw)
    const data = readLinks()
    const categories = Array.isArray(data.categories) && data.categories.length ? data.categories : ['Всё']
    const links = Array.isArray(data.links) ? data.links : []
    const seen = new Set(links.map((l) => l.url))
    const newCategories = [...categories]
    let added = 0
    for (const { title, url, folder } of entries) {
      if (seen.has(url)) continue
      const cat = folder && folder.trim() ? folder.trim() : 'Импорт'
      if (!newCategories.includes(cat) && cat !== 'Всё') newCategories.push(cat)
      const category = newCategories.includes(cat) ? cat : newCategories[1] || 'Всё'
      const now = Date.now()
      links.push({
        id: String(now + added),
        title: title || url,
        url,
        category,
        tags: [],
        description: '',
        pinned: false,
        order: links.length,
        createdAt: now,
        favicon: '',
      })
      seen.add(url)
      added++
    }
    writeLinks({ categories: newCategories, links })
    return { ok: true, data: { categories: newCategories, links }, added }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// ─── Custom URL scheme: linkshelf://add?url=...&title=... ───
let pendingAddData = null

function handleOpenUrl(url) {
  if (!url || !url.startsWith('linkshelf://')) return
  try {
    const u = new URL(url)
    if (u.hostname !== 'add' && u.pathname !== '/add') return
    const rawUrl = u.searchParams.get('url')
    if (!rawUrl) return
    const decoded = decodeURIComponent(rawUrl.trim())
    if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) return
    const rawTitle = u.searchParams.get('title')
    const title = rawTitle ? decodeURIComponent(rawTitle).trim().slice(0, 200) : ''
    const data = { url: decoded, title }
    pendingAddData = data
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('open-add-with-data', data)
    }
  } catch (e) {
    log('open-url parse error: ' + e.message)
  }
}

function consumePendingAddData() {
  const d = pendingAddData
  pendingAddData = null
  return d
}

// ─── Path to browser extensions ───
function getExtensionsBasePath() {
  if (app.isPackaged) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'browser-extensions')
    if (fs.existsSync(unpacked)) return unpacked
    return path.join(process.resourcesPath, 'browser-extensions')
  }
  return path.join(__dirname, 'browser-extensions')
}

function openExtensionInBrowser(browser) {
  const base = getExtensionsBasePath()
  const chromePath = path.join(base, 'chrome')
  const firefoxPath = path.join(base, 'firefox')
  if (!fs.existsSync(base)) {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Расширения не найдены',
      message: 'Папка browser-extensions не найдена. Запустите npm run build:extensions',
    }).catch(() => {})
    return
  }
  if (browser === 'chrome') {
    shell.openPath(chromePath).catch(() => {})
    exec('open -a "Google Chrome" "chrome://extensions"', () => {})
  } else if (browser === 'firefox') {
    shell.openPath(firefoxPath).catch(() => {})
    exec('open -a "Firefox" "about:debugging#/runtime/this-firefox"', () => {})
  } else if (browser === 'safari') {
    shell.openPath(base).catch(() => {})
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Расширение Safari',
      message: 'Для Safari нужен Xcode. Запустите в терминале:\nnpm run build:safari\n\nЗатем откройте созданный проект в Xcode и соберите расширение.',
    }).catch(() => {})
  }
}

// ─── Window & Tray ───
let mainWindow
let tray = null

function toggleWindow() {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

function createWindow() {
  // В пакетированном приложении ресурсы лежат внутри .app bundle:
  // MyApp.app/Contents/Resources/app/
  // Vite кладёт сборку в renderer/, electron-builder копирует её внутрь
  const currentAppRoot = !app.isPackaged 
    ? path.resolve(__dirname)                                          // папка проекта
    : path.resolve(app.getAppPath())                                   // внутрь .app bundle

  // Проверяем наличие собранных файлов для определения режима
  const indexPath = path.join(currentAppRoot, 'renderer', 'index.html')
  const hasBuiltFiles = fs.existsSync(indexPath)
  
  // Проверяем, запущен ли Vite dev-сервер (для dev режима)
  // Если приложение не упаковано И есть переменная окружения или явный запрос dev режима
  const forceDev = process.env.FORCE_DEV === '1' || (!app.isPackaged && !hasBuiltFiles)
  isDev = !app.isPackaged && (forceDev || !hasBuiltFiles) // Dev режим если не упаковано и нет файлов или принудительно

  const preloadPath = path.join(currentAppRoot, 'preload.cjs')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 860,
    minHeight: 500,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    // Используем стандартный titlebar для видимости кнопок
    // titleBarStyle: 'hiddenInsetMac', // Закомментировано для видимости кнопок
    transparent: false, // Отключаем прозрачность для видимости titlebar
    backgroundColor: '#14141a', // Темный фон для titlebar
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      enableWebSecurity: false,
      allowRunningInsecureContent: true,
      webSecurity: false,
    },
  })

  const iconPath = path.join(currentAppRoot, 'assets', 'icon.png')
  if (fs.existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath)
    mainWindow.setIcon(icon)
    if (process.platform === 'darwin' && app.dock) app.dock.setIcon(icon)
  }

  const menu = Menu.buildFromTemplate([
    {
      label: 'LinkShelf',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Add Link', accelerator: 'Cmd+N', click: () => mainWindow?.webContents?.send('open-add-modal') },
        { type: 'separator' },
        { label: 'Import…', click: () => mainWindow?.webContents?.send('open-import') },
        { label: 'Export…', click: () => mainWindow?.webContents?.send('open-export') },
        { label: 'Open Data Folder', click: () => mainWindow?.webContents?.send('open-data-folder') },
        { type: 'separator' },
        { label: 'Справка', click: () => mainWindow?.webContents?.send('open-help') },
        { label: 'Показать обучение', click: () => mainWindow?.webContents?.send('open-onboarding') },
        {
          label: 'Добавить расширение',
          submenu: [
            { label: 'Chrome', click: () => openExtensionInBrowser('chrome') },
            { label: 'Firefox', click: () => openExtensionInBrowser('firefox') },
            { label: 'Safari', click: () => openExtensionInBrowser('safari') },
          ],
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'toggleDevTools' },
      ],
    },
  ])
  Menu.setApplicationMenu(menu)
  log('isDev: ' + isDev)
  log('appRoot: ' + currentAppRoot)
  log('__dirname: ' + __dirname)
  log('getAppPath: ' + app.getAppPath())
  log('isPackaged: ' + app.isPackaged)
  log('hasBuiltFiles: ' + hasBuiltFiles)
  log('renderer exists: ' + fs.existsSync(path.join(currentAppRoot, 'renderer')))
  log('index.html exists: ' + fs.existsSync(indexPath))

  // Добавляем обработчики ошибок загрузки
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log('FAILED TO LOAD: ' + validatedURL + ' | Error: ' + errorCode + ' - ' + errorDescription)
    // DevTools открывается только при ошибках в dev режиме
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    log('Page loaded successfully')
  })

  if (isDev) {
    // Dev режим — загружаем с 127.0.0.1 (режим хоста), не localhost, чтобы не нарваться на политики/ограничения
    const devHost = 'http://127.0.0.1:5173'
    log('Loading from Vite dev server: ' + devHost)
    mainWindow.loadURL(devHost).catch(err => {
      log('Error loading dev server: ' + err.message)
      if (isDev) mainWindow.webContents.openDevTools()
    })
    // DevTools открывается только в dev режиме по умолчанию (можно убрать эту строку)
    // mainWindow.webContents.openDevTools()
  } else {
    // Production режим - загружаем собранные файлы
    log('Loading from file: ' + indexPath)
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath).catch(err => {
        log('Error loading file: ' + err.message)
      })
    } else {
      log('ERROR: index.html not found at ' + indexPath)
      mainWindow.loadURL('data:text/html,<h1>Error: index.html not found</h1><p>Path: ' + indexPath + '</p><p>Please run: npm run build:renderer</p>')
    }
  }

  mainWindow.on('close', (event) => {
    if (tray && !app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  // Tray
  const trayIconPath = path.join(currentAppRoot, 'assets', 'tray.png')
  if (fs.existsSync(trayIconPath)) {
    tray = new Tray(nativeImage.createFromPath(trayIconPath))
    tray.setToolTip('LinkShelf')
    tray.on('click', () => toggleWindow())
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Открыть LinkShelf', click: () => toggleWindow() },
      { label: 'Добавить ссылку', click: () => { mainWindow?.show(); mainWindow?.focus(); mainWindow?.webContents?.send('open-add-modal') } },
      { type: 'separator' },
      { label: 'Выход', click: () => { app.isQuitting = true; app.quit() } },
    ]))
  }
}

app.whenReady().then(() => {
  app.setAsDefaultProtocolClient('linkshelf')

  // ─── Убираем CSP ограничения (приложение только для личного использования) ───
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders }
    // Удаляем CSP заголовки если они есть
    delete responseHeaders['content-security-policy']
    delete responseHeaders['Content-Security-Policy']
    callback({ responseHeaders })
  })

  createWindow()

  globalShortcut.register('CommandOrControl+Shift+L', () => {
    toggleWindow()
  })

  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleOpenUrl(url)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else mainWindow?.show()
  })

  if (process.platform === 'darwin') {
    const protocolUrl = process.argv.find((arg) => arg.startsWith('linkshelf://'))
    if (protocolUrl) handleOpenUrl(protocolUrl)
  }
})

app.on('window-all-closed', () => {
  // Не закрываем приложение на всех платформах - оно остается в фоне для работы горячих клавиш
  // Приложение закрывается только через меню трея или Cmd+Q / Ctrl+Q
})

app.on('before-quit', () => {
  app.isQuitting = true
})