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

import { app, BrowserWindow, ipcMain, session, Menu } from 'electron'
import Store from 'electron-store'
import { startSTTSession, sendAudioChunk, stopSTTSession } from './sttService'
import { startOtherPlayersPipeline, stopOtherPlayersPipeline } from './services/otherPlayersPipeline'
import { listAudioDevices, playAudioOnDevice } from './services/virtualAudioService'
import { execSync } from 'child_process'

const store = new Store()
const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

// ─── Renommer VB-Audio en "GGTranslate Mic" ───────────────────────────────────
function renameVBAudioDevice() {
  if (process.platform !== 'win32') return

  try {
    // Script PowerShell pour renommer CABLE Output en GGTranslate Mic
    const script = `
      $deviceName = "CABLE Output (VB-Audio Virtual Cable)"
      $newName = "GGTranslate Mic"
      
      # Chercher dans le registre
      $regPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\MediaCategories"
      
      # Utiliser MMDevice API via COM pour renommer
      Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        
        public class AudioDeviceRenamer {
          [DllImport("winmm.dll")]
          public static extern int waveInGetNumDevs();
        }
"@
      
      # Méthode simple via registre audio
      $audioReg = "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Capture"
      if (Test-Path $audioReg) {
        Get-ChildItem $audioReg | ForEach-Object {
          $friendlyName = (Get-ItemProperty -Path "$($_.PSPath)\\Properties" -ErrorAction SilentlyContinue)
          if ($friendlyName -and $friendlyName."{a45c254e-df1c-4efd-8020-67d146a850e0},2" -like "*CABLE Output*") {
            Set-ItemProperty -Path "$($_.PSPath)\\Properties" -Name "{a45c254e-df1c-4efd-8020-67d146a850e0},2" -Value "GGTranslate Mic" -ErrorAction SilentlyContinue
            Write-Host "✅ GGTranslate Mic configuré"
          }
        }
      }
    `

    execSync(`powershell -Command "${script.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`, {
      stdio: 'pipe',
      timeout: 5000,
    })
    console.log('✅ GGTranslate Mic renommé avec succès')
  } catch (err) {
    console.log('⚠️ Renommage GGTranslate Mic — nécessite admin rights')
  }
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#06080f',
    autoHideMenuBar: true,
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

  // Supprimer le menu
  Menu.setApplicationMenu(null)

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

  // Renommer VB-Audio en GGTranslate Mic au démarrage
  renameVBAudioDevice()

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

// ─── IPC Virtual Audio Device ─────────────────────────────────────────────────
ipcMain.handle('virtual-audio:list-devices', async () => {
  const devices = listAudioDevices()
  console.log('🔊 Devices audio disponibles:', devices.map(d => d.name))
  return devices
})

ipcMain.handle('virtual-audio:play', async (_event, deviceId: string, pcmBuffer: ArrayBuffer, sampleRate: number, channels: number) => {
  const buffer = Buffer.from(pcmBuffer)
  const success = playAudioOnDevice(deviceId, buffer, sampleRate, channels)
  return { success }
})