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

      // Trouver quel écran contient la zone
      const targetDisplay = displays.find(d => {
        return zone.x >= d.bounds.x * d.scaleFactor &&
               zone.x < (d.bounds.x + d.bounds.width) * d.scaleFactor &&
               zone.y >= d.bounds.y * d.scaleFactor &&
               zone.y < (d.bounds.y + d.bounds.height) * d.scaleFactor
      }) || displays[0]

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: targetDisplay.bounds.width * targetDisplay.scaleFactor,
          height: targetDisplay.bounds.height * targetDisplay.scaleFactor,
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

      // Coordonnées relatives à l'écran cible
      const relX = zone.x - targetDisplay.bounds.x * targetDisplay.scaleFactor
      const relY = zone.y - targetDisplay.bounds.y * targetDisplay.scaleFactor

      const thumbnail = source.thumbnail
      const thumbSize = thumbnail.getSize()

      const cropped = thumbnail.crop({
        x: Math.max(0, Math.round(relX)),
        y: Math.max(0, Math.round(relY)),
        width: Math.min(Math.round(zone.width), thumbSize.width - Math.round(relX)),
        height: Math.min(Math.round(zone.height), thumbSize.height - Math.round(relY)),
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