// Простой скрипт для исправления абсолютных путей на относительные в собранном HTML
const fs = require('fs')
const path = require('path')

const htmlPath = path.join(__dirname, 'renderer', 'index.html')

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf-8')
  // Заменяем абсолютные пути на относительные
  html = html.replace(/src="\/([^"]+)"/g, 'src="./$1"')
  html = html.replace(/href="\/([^"]+)"/g, 'href="./$1"')
  fs.writeFileSync(htmlPath, html, 'utf-8')
  console.log('✓ Fixed paths in renderer/index.html')
} else {
  console.log('⚠ renderer/index.html not found')
}
