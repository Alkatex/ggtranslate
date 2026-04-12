import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Cherche le .env en remontant depuis __dirname
let dir = __dirname
for (let i = 0; i < 6; i++) {
  const envPath = path.join(dir, '.env')
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    console.log('✅ .env trouvé:', envPath)
    break
  }
  dir = path.dirname(dir)
}

import { app, BrowserWindow, ipcMain, session } from 'electron'
import Store from 'electron-store'
import { startSTTSession, sendAudioChunk, stopSTTSession } from './sttService'
import { startOtherPlayersPipeline, stopOtherPlayersPipeline } from './services/otherPlayersPipeline'

const store = new Store()
const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#06080f',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      experimentalFeatures: true,
    },
    show: false,
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.once('ready-to-show', () => win.show())
  mainWindow = win
  return win
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const allowed = ['media', 'audioCapture', 'desktopCapture']
      callback(allowed.includes(permission))
    }
  )
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── IPC Settings ─────────────────────────────────────────────────────────────
ipcMain.handle('settings:get', (_event, key: string) => {
  return store.get(key)
})
ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
  store.set(key, value)
  return true
})
ipcMain.handle('settings:getAll', () => store.store)
ipcMain.handle('app:getVersion', () => app.getVersion())
ipcMain.handle('app:getPlatform', () => process.platform)

// ─── IPC STT ──────────────────────────────────────────────────────────────────
ipcMain.handle('stt:start', async (_event, language: string) => {
  if (!mainWindow) throw new Error('Fenêtre non disponible')
  await startSTTSession(mainWindow, language)
  return { success: true }
})

ipcMain.handle('stt:stop', async () => {
  stopSTTSession()
  return { success: true }
})

ipcMain.on('stt:sendChunk', (_event, chunk: ArrayBuffer) => {
  sendAudioChunk(Buffer.from(chunk))
})

// ─── IPC Other Players ────────────────────────────────────────────────────────
ipcMain.handle('other-players:start', async (_event, language: string, targetLang: string) => {
  if (!mainWindow) throw new Error('Fenêtre non disponible')
  await startOtherPlayersPipeline({
    win: mainWindow,
    language,
    targetLang,
  })
  return { success: true }
})

ipcMain.handle('other-players:stop', async () => {
  stopOtherPlayersPipeline()
  return { success: true }
})