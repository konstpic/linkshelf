const TARGET_SIZE = 96
const SMALL_THRESHOLD = 48

/**
 * Если иконка мелкая (≤48px), рисует её на canvas с высококачественным сглаживанием
 * в TARGET_SIZE и возвращает blob. Иначе возвращает исходный blob.
 */
export function upscaleFaviconIfNeeded(blob) {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height
      if (w > SMALL_THRESHOLD && h > SMALL_THRESHOLD) {
        resolve(blob)
        return
      }
      try {
        const canvas = document.createElement('canvas')
        canvas.width = TARGET_SIZE
        canvas.height = TARGET_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(blob)
          return
        }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, w, h, 0, 0, TARGET_SIZE, TARGET_SIZE)
        canvas.toBlob(
          (newBlob) => resolve(newBlob || blob),
          'image/png',
          0.92
        )
      } catch {
        resolve(blob)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(blob)
    }
    img.src = objectUrl
  })
}
