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
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: screen.getPrimaryDisplay().bounds.width,
          height: screen.getPrimaryDisplay().bounds.height,
        },
      })
      if (!sources.length) return
      const thumbnail = sources[0].thumbnail
      const cropped = thumbnail.crop(zone)
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