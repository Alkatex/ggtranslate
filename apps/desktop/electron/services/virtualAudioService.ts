import * as path from 'path'
import { app } from 'electron'

let virtualAudioAddon: any = null

function loadAddon() {
  if (virtualAudioAddon) return virtualAudioAddon
  try {
    const addonPath = app.isPackaged
      ? path.join(process.resourcesPath, 'native/virtual-audio-device/virtual_audio_device.node')
      : path.join(__dirname, '../native/virtual-audio-device/build/Release/virtual_audio_device.node')
    console.log('🔍 Virtual Audio addon path:', addonPath)
    virtualAudioAddon = require(addonPath)
    console.log('✅ Virtual Audio Device addon chargé')
  } catch (err) {
    console.error('❌ Erreur chargement Virtual Audio addon:', err)
    virtualAudioAddon = null
  }
  return virtualAudioAddon
}

export interface AudioDevice {
  id: string
  name: string
}

export function listAudioDevices(): AudioDevice[] {
  const addon = loadAddon()
  if (!addon) return []
  try {
    return addon.listDevices() as AudioDevice[]
  } catch (err) {
    console.error('❌ Erreur listDevices:', err)
    return []
  }
}

export function playAudioOnDevice(
  deviceId: string,
  pcmData: Buffer,
  sampleRate: number = 48000,
  channels: number = 2
): boolean {
  const addon = loadAddon()
  if (!addon) return false
  try {
    const int16Data = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2)
    const int16Buffer = Buffer.from(int16Data.buffer)
    return addon.playAudio(deviceId, int16Buffer, sampleRate, channels)
  } catch (err) {
    console.error('❌ Erreur playAudio:', err)
    return false
  }
}