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
  stt: {
    start: (language: string) => ipcRenderer.invoke('stt:start', language),
    stop: () => ipcRenderer.invoke('stt:stop'),
    sendChunk: (chunk: ArrayBuffer) => ipcRenderer.invoke('stt:sendChunk', chunk),
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
      stt: {
        start: (language: string) => Promise<{ success: boolean }>
        stop: () => Promise<{ success: boolean }>
        sendChunk: (chunk: ArrayBuffer) => void
        onTranscript: (callback: (data: { text: string, isFinal: boolean }) => void) => void
        onState: (callback: (state: string) => void) => void
        onError: (callback: (error: string) => void) => void
        removeListeners: () => void
      }
    }
  }
}