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

3. **Для создания DMG (опционально):**
```bash
npm run build
```

## Важно:
- После любых изменений в `src/` нужно запускать `npm run build:renderer`
- Изменения в `main.cjs` или `preload.cjs` применяются сразу при `npm start`
- Системные кнопки macOS уже настроены через `trafficLightPosition` в `main.cjs`
