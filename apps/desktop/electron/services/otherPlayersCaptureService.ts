import * as path from 'path'
import { BrowserWindow, app } from 'electron'

let captureAddon: any = null

function loadAddon() {
  if (captureAddon) return captureAddon
  try {
    // En production, extraResources place les .node dans resources/native/...
    // En dev, ils sont dans electron/native/...
    const addonPath = app.isPackaged
      ? path.join(process.resourcesPath, 'native/loopback-capture/loopback_capture.node')
      : path.join(__dirname, '../native/loopback-capture/build/Release/loopback_capture.node')
    console.log('🔍 Addon path:', addonPath)
    captureAddon = require(addonPath)
    console.log('✅ Loopback capture addon chargé')
  } catch (err) {
    console.error('❌ Erreur chargement addon:', err)
    captureAddon = null
  }
  return captureAddon
}

export function startOtherPlayersCapture(
  win: BrowserWindow,
  onChunk: (chunk: Buffer) => void
): boolean {
  const addon = loadAddon()
  if (!addon) {
    console.error('❌ Addon non disponible')
    return false
  }

  try {
    addon.startCapture(0, process.pid, (chunk: Buffer) => {
      onChunk(chunk)
    })
    console.log('✅ Capture Other Players démarrée — PID exclu:', process.pid)
    return true
  } catch (err) {
    console.error('❌ Erreur démarrage capture:', err)
    return false
  }
}

export function stopOtherPlayersCapture(): void {
  const addon = loadAddon()
  if (!addon) return
  try {
    addon.stopCapture()
    console.log('🔌 Capture Other Players arrêtée')
  } catch (err) {
    console.error('❌ Erreur arrêt capture:', err)
  }
}