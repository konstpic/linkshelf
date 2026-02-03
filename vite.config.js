import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    host: true, // слушать на 0.0.0.0 — режим хоста, не только localhost (помогает с превью/политиками)
  },
  build: {
    outDir: 'renderer',
    assetsDir: '.',
    rollupOptions: {
      output: {
        // Используем относительные пути для всех ресурсов
        assetFileNames: '[name][extname]',
        entryFileNames: '[name].js',
      },
    },
  },
})
