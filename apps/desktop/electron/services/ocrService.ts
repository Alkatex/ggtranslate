import { screen, desktopCapturer } from 'electron'

let captureInterval: ReturnType<typeof setInterval> | null = null

export async function initOCR() {
  console.log('✅ OCR prêt')
}

export async function startCapture(
  zone: { x: number; y: number; width: number; height: number },
  onImage: (buffer: Buffer) => void
) {
  if (captureInterval) clearInterval(captureInterval)

  captureInterval = setInterval(async () => {
    try {
      const displays = screen.getAllDisplays()

      // Trouver quel écran contient la zone (zone en pixels logiques)
      const targetDisplay = displays.find(d => {
        return zone.x >= d.bounds.x &&
               zone.x < d.bounds.x + d.bounds.width &&
               zone.y >= d.bounds.y &&
               zone.y < d.bounds.y + d.bounds.height
      }) || displays[0]

      const sf = targetDisplay.scaleFactor

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: Math.round(targetDisplay.bounds.width * sf),
          height: Math.round(targetDisplay.bounds.height * sf),
        },
      })

      // Trouver la source correspondant à l'écran cible
      let source = sources[0]
      if (sources.length > 1) {
        const idx = displays.indexOf(targetDisplay)
        if (idx >= 0 && idx < sources.length) {
          source = sources[idx]
        }
      }

      if (!source) return

      // Convertit les coordonnées logiques en physiques pour le crop
      const relX = Math.round((zone.x - targetDisplay.bounds.x) * sf)
      const relY = Math.round((zone.y - targetDisplay.bounds.y) * sf)
      const physWidth = Math.round(zone.width * sf)
      const physHeight = Math.round(zone.height * sf)

      const thumbnail = source.thumbnail
      const thumbSize = thumbnail.getSize()

      const cropped = thumbnail.crop({
        x: Math.max(0, relX),
        y: Math.max(0, relY),
        width: Math.min(physWidth, thumbSize.width - Math.max(0, relX)),
        height: Math.min(physHeight, thumbSize.height - Math.max(0, relY)),
      })

      const buffer = cropped.toPNG()
      onImage(buffer)
    } catch (err) {
      console.error('OCR capture error:', err)
    }
  }, 2500)

  console.log('✅ Capture OCR démarrée:', zone)
}

export function stopCapture() {
  if (captureInterval) {
    clearInterval(captureInterval)
    captureInterval = null
  }
  console.log('🔌 Capture OCR arrêtée')
}

export async function destroyOCR() {
  stopCapture()
}