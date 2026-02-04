# Инструкция по сборке

## Для разработки:
```bash
npm run dev
```
Запускает Vite dev-сервер и Electron одновременно.

## Для production (после изменений):

1. **Соберите renderer часть:**
```bash
npm run build:renderer
```
Это соберет React приложение и исправит пути в HTML.

2. **Запустите приложение:**
```bash
npm start
```

## Сборка для разных платформ:

### macOS:
```bash
npm run build:mac
```
Создает DMG файл в папке `release/`.

### Windows 11:
```bash
npm run build:win
```
Создает:
- NSIS установщик (`.exe`) для x64 и ia32 архитектур
- Portable версию (`.exe`) для x64 архитектуры

Файлы будут в папке `release/`.

### Linux:
```bash
npm run build:linux
```
Создает:
- AppImage для x64 архитектуры
- DEB пакет для x64 архитектуры

Файлы будут в папке `release/`.

### Все платформы сразу:
```bash
npm run build:all
```
Соберет приложение для macOS, Windows и Linux одновременно.

## Автоматическая сборка через GitHub Actions:

При создании тега вида `v1.0.0` автоматически запускается сборка для всех платформ и создается GitHub Release.

### Как использовать:

1. **Создайте тег:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. **GitHub Actions автоматически:**
   - Соберет приложение для macOS, Windows и Linux
   - Загрузит все артефакты в GitHub Release
   - Создаст релиз с описанием

### Настройка подписи macOS:

Приложение настроено на самоподпись для macOS:
- Используется `App Self Signed` identity
- Включен `hardenedRuntime`
- Настроены `entitlements.mac.plist` с необходимыми правами

Для использования реального сертификата Apple Developer:
1. Создайте сертификат в Apple Developer Portal
2. Добавьте его в Keychain
3. Установите переменную окружения: `CSC_IDENTITY_AUTO_DISCOVERY=true`
4. Или укажите конкретный identity в `osxSign.identity`

## Важно:
- После любых изменений в `src/` нужно запускать `npm run build:renderer`
- Изменения в `main.cjs` или `preload.cjs` применяются сразу при `npm start`
- Системные кнопки macOS уже настроены через `trafficLightPosition` в `main.cjs`
- Для сборки Windows на macOS/Linux может потребоваться Wine (для NSIS)
- Для сборки Linux на macOS/Windows может потребоваться дополнительная настройка окружения
- Файл `entitlements.mac.plist` содержит права доступа для macOS приложения
