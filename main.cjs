// ─── Disable all security warnings ───
// Отключаем все предупреждения безопасности (приложение только для личного использования)
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1'

const { app, BrowserWindow, ipcMain, Menu, shell, session } = require('electron')
const path = require('path')
const fs   = require('fs')

// Дополнительно отключаем предупреждения через command line
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')

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

// ─── Data: ~/LinkShelf/links.json ───
const dataDir  = path.join(app.getPath('home'), 'LinkShelf')
const dataFile = path.join(dataDir, 'links.json')

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
}

function readLinks() {
  ensureDataDir()
  if (!fs.existsSync(dataFile)) return { categories: ['Всё'], links: [] }
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
  } catch {
    return { categories: ['Всё'], links: [] }
  }
}

function writeLinks(data) {
  ensureDataDir()
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8')
}

// ─── IPC ───
ipcMain.handle('links:load', () => readLinks())
ipcMain.handle('links:save', (_event, data) => { writeLinks(data); return true })
ipcMain.handle('links:open', (_event, url)  => { shell.openExternal(url) })

// ─── Window ───
let mainWindow

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
    width: 960,
    height: 680,
    minWidth: 720,
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

  const menu = Menu.buildFromTemplate([
    {
      label: 'LinkShelf',
      submenu: [
        { role: 'about' },
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
    // Dev режим - подключаемся к Vite dev-серверу
    log('Loading from Vite dev server: http://localhost:5173')
    mainWindow.loadURL('http://localhost:5173').catch(err => {
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
}

app.whenReady().then(() => {
  // ─── Убираем CSP ограничения (приложение только для личного использования) ───
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders }
    // Удаляем CSP заголовки если они есть
    delete responseHeaders['content-security-policy']
    delete responseHeaders['Content-Security-Policy']
    callback({ responseHeaders })
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})