import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  },
  audio: {
    requestPermission: () => ipcRenderer.invoke('audio:requestPermission'),
  },
})