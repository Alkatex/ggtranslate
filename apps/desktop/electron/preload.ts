import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  },
  audio: {
    requestPermission: () => ipcRenderer.invoke('audio:requestPermission'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  updater: {
    install: () => ipcRenderer.invoke('update:install'),
    onUpdateAvailable: (callback: (version: string) => void) => {
      ipcRenderer.on('update:available', (_event, version) => callback(version))
    },
    onUpdateDownloaded: (callback: () => void) => {
      ipcRenderer.on('update:downloaded', () => callback())
    },
    removeListeners: () => {
      ipcRenderer.removeAllListeners('update:available')
      ipcRenderer.removeAllListeners('update:downloaded')
    },
  },
  overlay: {
    open: () => ipcRenderer.invoke('overlay:open'),
    close: () => ipcRenderer.invoke('overlay:close'),
    sendTranslation: (data: any) => ipcRenderer.send('overlay:translation', data),
    onTranslation: (callback: (data: any) => void) => {
      ipcRenderer.on('overlay:translation', (_event, data) => callback(data))
    },
    removeListeners: () => {
      ipcRenderer.removeAllListeners('overlay:translation')
    },
  },
  game: {
    detect: () => ipcRenderer.invoke('game:detect'),
    onDetected: (callback: (data: any) => void) => {
      ipcRenderer.on('game:detected', (_event, data) => callback(data))
    },
    removeListeners: () => {
      ipcRenderer.removeAllListeners('game:detected')
    },
  },
  ocr: {
    init: () => ipcRenderer.invoke('ocr:init'),
    start: (zone: { x: number; y: number; width: number; height: number }) =>
      ipcRenderer.invoke('ocr:start', zone),
    stop: () => ipcRenderer.invoke('ocr:stop'),
    openSelection: () => ipcRenderer.invoke('ocr:openSelection'),
    closeSelection: () => ipcRenderer.invoke('ocr:closeSelection'),
    zoneSelected: (zone: { x: number; y: number; width: number; height: number }) =>
      ipcRenderer.invoke('ocr:zoneSelected', zone),
    onImage: (callback: (buffer: any) => void) => {
      ipcRenderer.on('ocr:image', (_event, buffer) => callback(buffer))
    },
    onCapturing: (callback: (active: boolean) => void) => {
      ipcRenderer.on('ocr:capturing', (_event, active) => callback(active))
    },
    removeListeners: () => {
      ipcRenderer.removeAllListeners('ocr:image')
      ipcRenderer.removeAllListeners('ocr:capturing')
    },
  },
  stt: {
    start: (language: string) => ipcRenderer.invoke('stt:start', language),
    stop: () => ipcRenderer.invoke('stt:stop'),
    sendChunk: (chunk: ArrayBuffer) => ipcRenderer.send('stt:sendChunk', chunk),
    onTranscript: (callback: (data: { text: string, isFinal: boolean }) => void) => {
      ipcRenderer.on('stt:transcript', (_event, data) => callback(data))
    },
    onState: (callback: (state: string) => void) => {
      ipcRenderer.on('stt:state', (_event, state) => callback(state))
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('stt:error', (_event, error) => callback(error))
    },
    removeListeners: () => {
      ipcRenderer.removeAllListeners('stt:transcript')
      ipcRenderer.removeAllListeners('stt:state')
      ipcRenderer.removeAllListeners('stt:error')
    },
  },
  otherPlayers: {
    start: (language: string, targetLang: string) =>
      ipcRenderer.invoke('other-players:start', language, targetLang),
    stop: () => ipcRenderer.invoke('other-players:stop'),
    onChunk: (callback: (chunk: Buffer) => void) => {
      ipcRenderer.on('other-players:chunk', (_event, chunk) => callback(chunk))
    },
    onState: (callback: (state: string) => void) => {
      ipcRenderer.on('other-players:state', (_event, state) => callback(state))
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('other-players:error', (_event, error) => callback(error))
    },
    onTranscript: (callback: (data: { text: string, isFinal: boolean }) => void) => {
      ipcRenderer.on('other-players:transcript', (_event, data) => callback(data))
    },
    onTranslated: (callback: (text: string) => void) => {
      ipcRenderer.on('other-players:translated', (_event, text) => callback(text))
    },
    removeListeners: () => {
      ipcRenderer.removeAllListeners('other-players:chunk')
      ipcRenderer.removeAllListeners('other-players:state')
      ipcRenderer.removeAllListeners('other-players:error')
      ipcRenderer.removeAllListeners('other-players:transcript')
      ipcRenderer.removeAllListeners('other-players:translated')
    },
  },
  virtualAudio: {
    listDevices: () => ipcRenderer.invoke('virtual-audio:list-devices'),
    play: (deviceId: string, pcmBuffer: ArrayBuffer, sampleRate: number, channels: number) =>
      ipcRenderer.invoke('virtual-audio:play', deviceId, pcmBuffer, sampleRate, channels),
  },
})

declare global {
  interface Window {
    electron: {
      settings: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<boolean>
        getAll: () => Promise<Record<string, unknown>>
      }
      app: {
        getVersion: () => Promise<string>
        getPlatform: () => Promise<string>
      }
      audio: {
        requestPermission: () => Promise<boolean>
      }
      shell: {
        openExternal: (url: string) => Promise<void>
      }
      updater: {
        install: () => Promise<void>
        onUpdateAvailable: (callback: (version: string) => void) => void
        onUpdateDownloaded: (callback: () => void) => void
        removeListeners: () => void
      }
      overlay: {
        open: () => Promise<void>
        close: () => Promise<void>
        sendTranslation: (data: any) => void
        onTranslation: (callback: (data: any) => void) => void
        removeListeners: () => void
      }
      game: {
        detect: () => Promise<any>
        onDetected: (callback: (data: any) => void) => void
        removeListeners: () => void
      }
      ocr: {
        init: () => Promise<void>
        start: (zone: { x: number; y: number; width: number; height: number }) => Promise<void>
        stop: () => Promise<void>
        openSelection: () => Promise<void>
        closeSelection: () => Promise<void>
        zoneSelected: (zone: { x: number; y: number; width: number; height: number }) => Promise<void>
        onImage: (callback: (buffer: any) => void) => void
        onCapturing: (callback: (active: boolean) => void) => void
        removeListeners: () => void
      }
      stt: {
        start: (language: string) => Promise<{ success: boolean }>
        stop: () => Promise<{ success: boolean }>
        sendChunk: (chunk: ArrayBuffer) => void
        onTranscript: (callback: (data: { text: string, isFinal: boolean }) => void) => void
        onState: (callback: (state: string) => void) => void
        onError: (callback: (error: string) => void) => void
        removeListeners: () => void
      }
      otherPlayers: {
        start: (language: string, targetLang: string) => Promise<{ success: boolean }>
        stop: () => Promise<{ success: boolean }>
        onChunk: (callback: (chunk: Buffer) => void) => void
        onState: (callback: (state: string) => void) => void
        onError: (callback: (error: string) => void) => void
        onTranscript: (callback: (data: { text: string, isFinal: boolean }) => void) => void
        onTranslated: (callback: (text: string) => void) => void
        removeListeners: () => void
      }
      virtualAudio: {
        listDevices: () => Promise<Array<{ id: string, name: string }>>
        play: (deviceId: string, pcmBuffer: ArrayBuffer, sampleRate: number, channels: number) => Promise<{ success: boolean }>
      }
    }
  }
}