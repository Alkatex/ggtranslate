import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

let dir = __dirname
for (let i = 0; i < 6; i++) {
  const envPath = path.join(dir, '.env')
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
  dir = path.dirname(dir)
}

import { app, BrowserWindow, ipcMain, session, Menu, screen, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import Store from 'electron-store'
import { startSTTSession, sendAudioChunk, stopSTTSession } from './sttService'
import { startOtherPlayersPipeline, stopOtherPlayersPipeline } from './services/otherPlayersPipeline'
import { listAudioDevices, playAudioOnDevice } from './services/virtualAudioService'
import { initOCR, startCapture, stopCapture, destroyOCR } from './services/ocrService'
import { execSync } from 'child_process'

const store = new Store()
const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let selectionWindow: BrowserWindow | null = null
let gameDetectionInterval: ReturnType<typeof setInterval> | null = null
let lastDetectedGame: string | null = null

const SUPPORTED_GAMES: Record<string, { name: string; emoji: string; phrases: string[] }> = {
  'valorant': {
    name: 'Valorant', emoji: '🎯',
    phrases: ['❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '💜 Grenade !', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On pousse', '🛡️ Défendez le site', '💣 Spike posé', '🔍 Clear !'],
  },
  'csgo': {
    name: 'CS2', emoji: '💣',
    phrases: ['❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '💜 Flash !', '✅ Bien joué', '🔫 Rechargement', '💣 Bombe posée', '🔍 Clear !', '🪟 Fenêtre !', '⚡ Eco round'],
  },
  'cs2': {
    name: 'CS2', emoji: '💣',
    phrases: ['❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '💜 Flash !', '✅ Bien joué', '🔫 Rechargement', '💣 Bombe posée', '🔍 Clear !', '🪟 Fenêtre !', '⚡ Eco round'],
  },
  'leagueoflegends': {
    name: 'League of Legends', emoji: '⚔️',
    phrases: ['🔴 Regroupez-vous', '🏃 Suivez-moi', '🎯 Ennemi repéré', '🗼 Défendez la tour', '⚡ On pousse', '🔵 Objectif', '💀 Attention jungle', '🐉 Dragon bientôt', '🏰 Baron bientôt', '📦 On recule', '✅ Bien joué'],
  },
  'riotclientservices': {
    name: 'League of Legends', emoji: '⚔️',
    phrases: ['🔴 Regroupez-vous', '🏃 Suivez-moi', '🎯 Ennemi repéré', '🗼 Défendez la tour', '⚡ On pousse', '🔵 Objectif', '💀 Attention jungle', '🐉 Dragon bientôt', '🏰 Baron bientôt', '📦 On recule', '✅ Bien joué'],
  },
  'fortnite': {
    name: 'Fortnite', emoji: '🏗️',
    phrases: ['🎯 Ennemi repéré', '🏗️ On construit', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On rush', '🪂 Atterrissage'],
  },
  'fortniteclient': {
    name: 'Fortnite', emoji: '🏗️',
    phrases: ['🎯 Ennemi repéré', '🏗️ On construit', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On rush', '🪂 Atterrissage'],
  },
  'warzone': {
    name: 'Warzone', emoji: '🪂',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push', '🚗 Véhicule', '🪂 Gulag'],
  },
  'modernwarfare': {
    name: 'Call of Duty', emoji: '🔫',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push'],
  },
  'cod': {
    name: 'Call of Duty', emoji: '🔫',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push'],
  },
  'codmw': {
    name: 'Call of Duty', emoji: '🔫',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push'],
  },
  'overwatch': {
    name: 'Overwatch 2', emoji: '🦸',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔴 Regroupez-vous', '⚡ On pousse', '🛡️ Groupez-vous', '💜 Ultimate prêt'],
  },
  'overwatch2': {
    name: 'Overwatch 2', emoji: '🦸',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔴 Regroupez-vous', '⚡ On pousse', '🛡️ Groupez-vous', '💜 Ultimate prêt'],
  },
  'apexlegends': {
    name: 'Apex Legends', emoji: '⚡',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push', '💀 Revive', '🏆 Champion'],
  },
  'r5apex': {
    name: 'Apex Legends', emoji: '⚡',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push', '💀 Revive', '🏆 Champion'],
  },
  'tslgame': {
    name: 'PUBG', emoji: '🐔',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On loot', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Zone', '🚗 Véhicule', '🏠 On entre'],
  },
  'dota2': {
    name: 'Dota 2', emoji: '🏰',
    phrases: ['🎯 Ennemi repéré', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔴 Regroupez-vous', '⚡ On pousse', '🐉 Roshan bientôt', '💀 Attention', '🗼 Défendez'],
  },
  'javaw': {
    name: 'Minecraft', emoji: '⛏️',
    phrases: ['🏃 Suivez-moi', '⛏️ On mine', '🏠 On build', '✅ Bien joué', '💀 Attention mob', '🌙 Nuit bientôt', '🔴 Danger'],
  },
  'rocketleague': {
    name: 'Rocket League', emoji: '🚗',
    phrases: ['🎯 Shot !', '🚗 Centering', '✅ Bien joué', '🔴 Defend', '⚡ Boost', '💨 Fast', '🏆 GG'],
  },
  'rainbow6': {
    name: 'Rainbow Six Siege', emoji: '🛡️',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '💣 Bombe', '🔍 Clear !'],
  },
  'r6siege': {
    name: 'Rainbow Six Siege', emoji: '🛡️',
    phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '💣 Bombe', '🔍 Clear !'],
  },
}

const DEFAULT_PHRASES = ['❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '💜 Grenade !', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On pousse']

function detectActiveGame(): string | null {
  if (process.platform !== 'win32') return null
  try {
    // Méthode 1 — scan des processus
    const output = execSync('powershell -Command "Get-Process | Select-Object -ExpandProperty Name"', {
      stdio: 'pipe', timeout: 3000, encoding: 'utf8',
    })
    const processes = output.split('\n').map(p => p.trim().toLowerCase().replace(/\.exe$/, ''))

    for (const [processName] of Object.entries(SUPPORTED_GAMES)) {
      if (processes.some(p => p === processName.toLowerCase())) {
        return processName
      }
    }

    // Méthode 2 — fallback sur la fenêtre active
    try {
      const activeWindow = execSync(
        'powershell -Command "(Get-Process | Where-Object {$_.MainWindowTitle -ne \'\'} | Sort-Object CPU -Descending | Select-Object -First 1).Name"',
        { stdio: 'pipe', timeout: 3000, encoding: 'utf8' }
      ).trim().toLowerCase().replace(/\.exe$/, '')

      for (const [processName] of Object.entries(SUPPORTED_GAMES)) {
        if (activeWindow.includes(processName.toLowerCase()) || processName.toLowerCase().includes(activeWindow)) {
          return processName
        }
      }
    } catch {}

    return null
  } catch {
    return null
  }
}

function startGameDetection() {
  if (gameDetectionInterval) return
  gameDetectionInterval = setInterval(() => {
    const detectedGame = detectActiveGame()
    if (detectedGame !== lastDetectedGame) {
      lastDetectedGame = detectedGame
      const gameInfo = detectedGame ? SUPPORTED_GAMES[detectedGame] : null
      if (mainWindow) {
        mainWindow.webContents.send('game:detected', {
          game: gameInfo ? gameInfo.name : null,
          emoji: gameInfo ? gameInfo.emoji : null,
          phrases: gameInfo ? gameInfo.phrases : DEFAULT_PHRASES,
          processName: detectedGame,
        })
      }
    }
  }, 5000)
}

function stopGameDetection() {
  if (gameDetectionInterval) {
    clearInterval(gameDetectionInterval)
    gameDetectionInterval = null
  }
}

ipcMain.handle('game:detect', () => {
  const detectedGame = detectActiveGame()
  const gameInfo = detectedGame ? SUPPORTED_GAMES[detectedGame] : null
  return {
    game: gameInfo ? gameInfo.name : null,
    emoji: gameInfo ? gameInfo.emoji : null,
    phrases: gameInfo ? gameInfo.phrases : DEFAULT_PHRASES,
    processName: detectedGame,
  }
})

function setupAutoUpdater(win: BrowserWindow) {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('update-available', (info) => {
    win.webContents.send('update:available', info.version)
  })
  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('update:downloaded')
  })
  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err.message)
  })
  autoUpdater.checkForUpdates()
  setInterval(() => autoUpdater.checkForUpdates(), 30 * 60 * 1000)
}

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall()
})

function createOverlayWindow() {
  if (overlayWindow) { overlayWindow.show(); overlayWindow.focus(); return }
  const { width } = screen.getPrimaryDisplay().workAreaSize
  overlayWindow = new BrowserWindow({
    width: 320, height: 200, x: width - 340, y: 20,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, resizable: true, hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  })
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.setVisibleOnAllWorkspaces(true)
  if (isDev) {
    overlayWindow.loadURL('http://localhost:5173/#/overlay')
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/overlay' })
  }
  overlayWindow.on('closed', () => { overlayWindow = null })
}

function closeOverlayWindow() {
  if (overlayWindow) { overlayWindow.close(); overlayWindow = null }
}

ipcMain.handle('overlay:open', () => { createOverlayWindow(); return { success: true } })
ipcMain.handle('overlay:close', () => { closeOverlayWindow(); return { success: true } })
ipcMain.handle('overlay:setPosition', (_event, x: number, y: number) => {
  if (overlayWindow) overlayWindow.setPosition(x, y)
  return { success: true }
})
ipcMain.on('overlay:translation', (_event, data) => {
  if (overlayWindow) overlayWindow.webContents.send('overlay:translation', data)
})

function createSelectionWindow() {
  if (selectionWindow) return
  const displays = screen.getAllDisplays()
  const minX = Math.min(...displays.map(d => d.bounds.x))
  const minY = Math.min(...displays.map(d => d.bounds.y))
  const maxX = Math.max(...displays.map(d => d.bounds.x + d.bounds.width))
  const maxY = Math.max(...displays.map(d => d.bounds.y + d.bounds.height))
  const totalWidth = maxX - minX
  const totalHeight = maxY - minY

  selectionWindow = new BrowserWindow({
    width: totalWidth, height: totalHeight, x: minX, y: minY,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, movable: false,
    enableLargerThanScreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  })
  selectionWindow.setAlwaysOnTop(true, 'screen-saver')
  selectionWindow.setVisibleOnAllWorkspaces(true)
  selectionWindow.setBounds({ x: minX, y: minY, width: totalWidth, height: totalHeight })
  if (isDev) {
    selectionWindow.loadURL('http://localhost:5173/#/ocr-select')
  } else {
    selectionWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/ocr-select' })
  }
  selectionWindow.on('closed', () => { selectionWindow = null })
}

function closeSelectionWindow() {
  if (selectionWindow) { selectionWindow.close(); selectionWindow = null }
}

ipcMain.handle('ocr:init', async () => { await initOCR(); return { success: true } })
ipcMain.handle('ocr:openSelection', () => { createSelectionWindow(); return { success: true } })
ipcMain.handle('ocr:closeSelection', () => { closeSelectionWindow(); return { success: true } })

ipcMain.handle('ocr:zoneSelected', async (_event, zone) => {
  closeSelectionWindow()
  if (mainWindow) mainWindow.hide()
  await new Promise(resolve => setTimeout(resolve, 500))
  if (mainWindow) {
    mainWindow.show()
    mainWindow.webContents.send('ocr:capturing', true)
  }
  await startCapture(zone, (buffer) => {
    if (mainWindow) mainWindow.webContents.send('ocr:image', buffer)
  })
  return { success: true }
})

ipcMain.handle('ocr:start', async (_event, zone: { x: number; y: number; width: number; height: number }) => {
  await startCapture(zone, (buffer) => {
    if (mainWindow) mainWindow.webContents.send('ocr:image', buffer)
  })
  return { success: true }
})

ipcMain.handle('ocr:stop', () => {
  stopCapture()
  return { success: true }
})

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    backgroundColor: '#06080f', autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
      sandbox: false, experimentalFeatures: true,
    },
    show: false,
  })
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
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(['media', 'audioCapture', 'desktopCapture'].includes(permission))
  })
  createWindow()
  startGameDetection()
  if (!isDev) setupAutoUpdater(mainWindow!)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopGameDetection()
  destroyOCR()
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('settings:get', (_event, key: string) => store.get(key))
ipcMain.handle('settings:set', (_event, key: string, value: unknown) => { store.set(key, value); return true })
ipcMain.handle('settings:getAll', () => store.store)
ipcMain.handle('app:getVersion', () => app.getVersion())
ipcMain.handle('app:getPlatform', () => process.platform)

ipcMain.handle('shell:openExternal', (_event, url: string) => {
  shell.openExternal(url)
})

ipcMain.handle('stt:start', async (_event, language: string) => {
  if (!mainWindow) throw new Error('Fenêtre non disponible')
  await startSTTSession(mainWindow, language)
  return { success: true }
})
ipcMain.handle('stt:stop', async () => { stopSTTSession(); return { success: true } })
ipcMain.on('stt:sendChunk', (_event, chunk: ArrayBuffer) => { sendAudioChunk(Buffer.from(chunk)) })

ipcMain.handle('other-players:start', async (_event, language: string, targetLang: string) => {
  if (!mainWindow) throw new Error('Fenêtre non disponible')
  await startOtherPlayersPipeline({ win: mainWindow, language, targetLang })
  return { success: true }
})
ipcMain.handle('other-players:stop', async () => { stopOtherPlayersPipeline(); return { success: true } })

ipcMain.handle('virtual-audio:list-devices', async () => {
  return listAudioDevices()
})
ipcMain.handle('virtual-audio:play', async (_event, deviceId: string, pcmBuffer: ArrayBuffer, sampleRate: number, channels: number) => {
  const buffer = Buffer.from(pcmBuffer)
  const success = playAudioOnDevice(deviceId, buffer, sampleRate, channels)
  return { success }
})