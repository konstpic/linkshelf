#!/usr/bin/env node
/**
 * Build browser extensions: resize icons, copy version.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname)
const ICON_SOURCE = path.join(ROOT, 'assets', 'icon.png')
const CHROME_ICONS = path.join(ROOT, 'browser-extensions', 'chrome', 'icons')
const FIREFOX_ICONS = path.join(ROOT, 'browser-extensions', 'firefox', 'icons')
const SIZES = [16, 48, 128]

async function buildIcons() {
  if (!fs.existsSync(ICON_SOURCE)) {
    console.error('Icon not found:', ICON_SOURCE)
    process.exit(1)
  }
  for (const dir of [CHROME_ICONS, FIREFOX_ICONS]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    for (const size of SIZES) {
      await sharp(ICON_SOURCE)
        .resize(size, size)
        .png()
        .toFile(path.join(dir, `${size}.png`))
    }
    console.log('Icons built:', dir)
  }
}

function updateManifestVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'))
  const version = pkg.version || '1.0.0'
  for (const name of ['chrome', 'firefox']) {
    const manifestPath = path.join(ROOT, 'browser-extensions', name, 'manifest.json')
    if (fs.existsSync(manifestPath)) {
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      m.version = version
      fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2), 'utf-8')
      console.log('Updated version in', manifestPath)
    }
  }
}

async function main() {
  await buildIcons()
  updateManifestVersion()
  console.log('Extensions build complete.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
