#!/usr/bin/env node
/**
 * Готовит иконку приложения для macOS:
 * 1. Делает белый фон прозрачным (маска).
 * 2. Сохраняет PNG 1024×1024 в assets/icon.png.
 * electron-builder при сборке сам сгенерирует .icns из этого PNG.
 *
 * Использование: node build-icons.js [путь/к/исходнику.png]
 * По умолчанию: assets/icon-source.png
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname)
const ASSETS = path.join(ROOT, 'assets')
const SOURCE = path.resolve(ROOT, process.argv[2] || path.join(ASSETS, 'icon-source.png'))
const ICON_PNG = path.join(ASSETS, 'icon.png')

// Порог: пиксели ярче этого считаем «белым» и делаем прозрачными
const WHITE_THRESHOLD = 250

async function makeWhiteTransparent(inputPath, outputPath, size = 1024) {
  const meta = await sharp(inputPath).metadata()
  const { width, height } = meta
  if (!width || !height) throw new Error('Не удалось прочитать размер изображения')

  const scale = Math.min(size / width, size / height)
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const left = Math.max(0, Math.floor((size - w) / 2))
  const top = Math.max(0, Math.floor((size - h) / 2))

  const resized = await sharp(inputPath)
    .resize(w, h)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const raw = resized.data
  const out = Buffer.alloc(size * size * 4)
  out.fill(0)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const outIdx = (y * size + x) * 4
      const sy = y - top
      const sx = x - left
      if (sy >= 0 && sy < h && sx >= 0 && sx < w) {
        const srcIdx = (sy * w + sx) * 4
        const r = raw[srcIdx]
        const g = raw[srcIdx + 1]
        const b = raw[srcIdx + 2]
        const a = raw[srcIdx + 3]
        const isWhite = r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD
        out[outIdx] = r
        out[outIdx + 1] = g
        out[outIdx + 2] = b
        out[outIdx + 3] = isWhite ? 0 : (a ?? 255)
      }
    }
  }

  await sharp(out, {
    raw: { width: size, height: size, channels: 4 },
  })
    .png()
    .toFile(outputPath)
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error('Исходный файл не найден:', SOURCE)
    process.exit(1)
  }

  console.log('Исходник:', SOURCE)
  console.log('Делаю белый фон прозрачным и сохраняю 1024×1024…')
  await makeWhiteTransparent(SOURCE, ICON_PNG, 1024)
  console.log('Сохранено:', ICON_PNG)
  console.log('При сборке (npm run build) electron-builder создаст .icns из этого PNG.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
