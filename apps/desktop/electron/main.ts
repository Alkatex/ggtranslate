import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import * as https from 'https'

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

const KNOWN_GAMES: Record<string, { name: string; emoji: string; phrases: string[] }> = {
  'valorant': { name: 'Valorant', emoji: '🎯', phrases: ['❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '💜 Grenade !', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On pousse', '🛡️ Défendez le site', '💣 Spike posé', '🔍 Clear !'] },
  'csgo': { name: 'CS2', emoji: '💣', phrases: ['❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '💜 Flash !', '✅ Bien joué', '🔫 Rechargement', '💣 Bombe posée', '🔍 Clear !', '🪟 Fenêtre !', '⚡ Eco round'] },
  'cs2': { name: 'CS2', emoji: '💣', phrases: ['❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '💜 Flash !', '✅ Bien joué', '🔫 Rechargement', '💣 Bombe posée', '🔍 Clear !', '🪟 Fenêtre !', '⚡ Eco round'] },
  'leagueoflegends': { name: 'League of Legends', emoji: '⚔️', phrases: ['🔴 Regroupez-vous', '🏃 Suivez-moi', '🎯 Ennemi repéré', '🗼 Défendez la tour', '⚡ On pousse', '🔵 Objectif', '💀 Attention jungle', '🐉 Dragon bientôt', '🏰 Baron bientôt', '📦 On recule', '✅ Bien joué'] },
  'riotclientservices': { name: 'League of Legends', emoji: '⚔️', phrases: ['🔴 Regroupez-vous', '🏃 Suivez-moi', '🎯 Ennemi repéré', '🗼 Défendez la tour', '⚡ On pousse', '🔵 Objectif', '💀 Attention jungle', '🐉 Dragon bientôt', '🏰 Baron bientôt', '📦 On recule', '✅ Bien joué'] },
  'fortnite': { name: 'Fortnite', emoji: '🏗️', phrases: ['🎯 Ennemi repéré', '🏗️ On construit', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On rush', '🪂 Atterrissage'] },
  'fortniteclient': { name: 'Fortnite', emoji: '🏗️', phrases: ['🎯 Ennemi repéré', '🏗️ On construit', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On rush', '🪂 Atterrissage'] },
  'warzone': { name: 'Warzone', emoji: '🪂', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push', '🚗 Véhicule', '🪂 Gulag'] },
  'modernwarfare': { name: 'Call of Duty', emoji: '🔫', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push'] },
  'cod': { name: 'Call of Duty', emoji: '🔫', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push'] },
  'codmw': { name: 'Call of Duty', emoji: '🔫', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push'] },
  'overwatch': { name: 'Overwatch 2', emoji: '🦸', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔴 Regroupez-vous', '⚡ On pousse', '🛡️ Groupez-vous', '💜 Ultimate prêt'] },
  'overwatch2': { name: 'Overwatch 2', emoji: '🦸', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔴 Regroupez-vous', '⚡ On pousse', '🛡️ Groupez-vous', '💜 Ultimate prêt'] },
  'apexlegends': { name: 'Apex Legends', emoji: '⚡', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push', '💀 Revive', '🏆 Champion'] },
  'r5apex': { name: 'Apex Legends', emoji: '⚡', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On push', '💀 Revive', '🏆 Champion'] },
  'tslgame': { name: 'PUBG', emoji: '🐔', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On loot', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Zone', '🚗 Véhicule', '🏠 On entre'] },
  'dota2': { name: 'Dota 2', emoji: '🏰', phrases: ['🎯 Ennemi repéré', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔴 Regroupez-vous', '⚡ On pousse', '🐉 Roshan bientôt', '💀 Attention', '🗼 Défendez'] },
  'javaw': { name: 'Minecraft', emoji: '⛏️', phrases: ['🏃 Suivez-moi', '⛏️ On mine', '🏠 On build', '✅ Bien joué', '💀 Attention mob', '🌙 Nuit bientôt', '🔴 Danger'] },
  'rocketleague': { name: 'Rocket League', emoji: '🚗', phrases: ['🎯 Shot !', '🚗 Centering', '✅ Bien joué', '🔴 Defend', '⚡ Boost', '💨 Fast', '🏆 GG'] },
  'rainbow6': { name: 'Rainbow Six Siege', emoji: '🛡️', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '💣 Bombe', '🔍 Clear !'] },
  'r6siege': { name: 'Rainbow Six Siege', emoji: '🛡️', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '💣 Bombe', '🔍 Clear !'] },
  'genshinimpact': { name: 'Genshin Impact', emoji: '✨', phrases: ['🏃 Suivez-moi', '⚔️ On attaque', '💉 Soins', '📦 On recule', '✅ Bien joué', '🌟 Burst prêt'] },
  'eldenring': { name: 'Elden Ring', emoji: '⚔️', phrases: ['💀 Boss ici', '🏃 Suivez-moi', '⚔️ On attaque', '📦 On recule', '✅ Bien joué', '🔥 Attention'] },
  'destiny2': { name: 'Destiny 2', emoji: '🚀', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '⚡ Super prêt'] },
  'deadbydaylight': { name: 'Dead by Daylight', emoji: '🔦', phrases: ['🏃 Fuyez', '🔦 Killer ici', '🚪 Porte ouverte', '💉 Soins', '✅ Bien joué'] },
  'newworld': { name: 'New World', emoji: '🌍', phrases: ['🏃 Suivez-moi', '⚔️ On attaque', '💉 Soins', '📦 On recule', '✅ Bien joué'] },
  'tarkov': { name: 'Escape from Tarkov', emoji: '🎒', phrases: ['🎯 Contact', '📦 On loot', '🏃 Suivez-moi', '💉 Soins', '🔴 Danger'] },
  'battlefieldv': { name: 'Battlefield V', emoji: '💣', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement'] },
  'battlefield2042': { name: 'Battlefield 2042', emoji: '💣', phrases: ['🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔫 Rechargement'] },
  'starcraft2': { name: 'StarCraft II', emoji: '🛸', phrases: ['⚔️ On attaque', '📦 On recule', '🏃 Suivez-moi', '✅ Bien joué', '🔵 Expansion'] },
  'hearthstone': { name: 'Hearthstone', emoji: '🃏', phrases: ['✅ Bien joué', '🎴 Mon tour', '⚔️ Attaque', '🛡️ Défends'] },
  'worldofwarcraft': { name: 'World of Warcraft', emoji: '🐉', phrases: ['🏃 Suivez-moi', '⚔️ Pull', '💉 Soins', '📦 On recule', '✅ Bien joué', '💀 Mort'] },
  'wow': { name: 'World of Warcraft', emoji: '🐉', phrases: ['🏃 Suivez-moi', '⚔️ Pull', '💉 Soins', '📦 On recule', '✅ Bien joué', '💀 Mort'] },
  'ffxiv': { name: 'Final Fantasy XIV', emoji: '🌙', phrases: ['🏃 Suivez-moi', '⚔️ DPS', '💉 Soins', '🛡️ Tank', '✅ Bien joué'] },
  'gtav': { name: 'GTA V', emoji: '🚗', phrases: ['🚗 En route', '🏃 Suivez-moi', '💰 Casse', '🚔 Police', '✅ Bien joué'] },
  'rdr2': { name: 'Red Dead Redemption 2', emoji: '🤠', phrases: ['🤠 En selle', '🏃 Suivez-moi', '🔫 Embuscade', '✅ Bien joué'] },
  'cyberpunk2077': { name: 'Cyberpunk 2077', emoji: '🌆', phrases: ['🏃 En mouvement', '🎯 Cible', '💉 Soins', '📦 On recule', '✅ Bien joué'] },
  'witcher3': { name: 'The Witcher 3', emoji: '🗡️', phrases: ['🏃 Suivez-moi', '⚔️ Monstre', '💉 Soins', '✅ Bien joué'] },
}

const SYSTEM_BLACKLIST = new Set([
  'explorer', 'svchost', 'system', 'idle', 'registry', 'smss', 'csrss',
  'wininit', 'winlogon', 'services', 'lsass', 'spoolsv', 'taskhost',
  'dwm', 'conhost', 'rundll32', 'msiexec', 'wuauclt', 'searchui',
  'shellexperiencehost', 'runtimebroker', 'taskmgr', 'sihost', 'fontdrvhost',
  'chrome', 'firefox', 'msedge', 'opera', 'brave', 'iexplore', 'safari',
  'code', 'cursor', 'devenv', 'rider', 'webstorm', 'phpstorm', 'idea',
  'notepad', 'notepad++', 'sublime_text', 'atom', 'wordpad',
  'slack', 'discord', 'teams', 'zoom', 'skype', 'telegram', 'whatsapp',
  'spotify', 'vlc', 'mpv', 'wmplayer', 'itunes',
  'word', 'excel', 'powerpnt', 'onenote', 'outlook', 'acrobat',
  'steam', 'epicgameslauncher', 'origin', 'uplay', 'battlenet', 'gog',
  'nvidia', 'geforce', 'amd', 'msi', 'afterburner', 'rivatuner',
  'obs', 'obs64', 'streamlabs', 'xsplit',
  'node', 'python', 'powershell', 'cmd', 'wt', 'windowsterminal',
  'ggtranslate', 'electron',
])

const DEFAULT_PHRASES = ['❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '💜 Grenade !', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On pousse']

interface DetectedGame {
  name: string
  emoji: string
  phrases: string[]
  processName: string
}

function detectActiveGame(): DetectedGame | null {
  if (process.platform !== 'win32') return null
  try {
    const psOutput = execSync(
      'powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -ne \'\'} | Select-Object Name, MainWindowTitle, CPU | ConvertTo-Json"',
      { stdio: 'pipe', timeout: 5000, encoding: 'utf8' }
    ).trim()
    if (!psOutput) return null
    let processes: Array<{ Name: string; MainWindowTitle: string; CPU: number }> = []
    try {
      const parsed = JSON.parse(psOutput)
      processes = Array.isArray(parsed) ? parsed : [parsed]
    } catch { return null }
    const filtered = processes.filter(p => {
      const name = (p.Name || '').toLowerCase().replace(/\.exe$/, '')
      return !SYSTEM_BLACKLIST.has(name) && p.MainWindowTitle && p.MainWindowTitle.trim().length > 0
    })
    if (filtered.length === 0) return null
    filtered.sort((a, b) => (b.CPU || 0) - (a.CPU || 0))
    for (const proc of filtered) {
      const procName = (proc.Name || '').toLowerCase().replace(/\.exe$/, '')
      if (KNOWN_GAMES[procName]) return { ...KNOWN_GAMES[procName], processName: procName }
    }
    for (const proc of filtered) {
      const procName = (proc.Name || '').toLowerCase().replace(/\.exe$/, '')
      for (const [key, game] of Object.entries(KNOWN_GAMES)) {
        if (procName.includes(key) || key.includes(procName)) return { ...game, processName: procName }
      }
    }
    const topProcess = filtered[0]
    if (topProcess) {
      const procName = (topProcess.Name || '').toLowerCase().replace(/\.exe$/, '')
      const windowTitle = topProcess.MainWindowTitle || procName
      const cleanTitle = windowTitle
        .replace(/\s*-\s*(Steam|Epic Games|Ubisoft Connect|Battle\.net|GOG).*$/i, '')
        .replace(/\s*\[\s*\].*$/, '')
        .trim().slice(0, 40) || procName
      return { name: cleanTitle, emoji: '🎮', phrases: DEFAULT_PHRASES, processName: procName }
    }
    return null
  } catch { return null }
}

function startGameDetection() {
  if (gameDetectionInterval) return
  gameDetectionInterval = setInterval(() => {
    const detected = detectActiveGame()
    const key = detected ? detected.processName : null
    if (key !== lastDetectedGame) {
      lastDetectedGame = key
      if (mainWindow) {
        mainWindow.webContents.send('game:detected', {
          game: detected ? detected.name : null,
          emoji: detected ? detected.emoji : null,
          phrases: detected ? detected.phrases : DEFAULT_PHRASES,
          processName: detected ? detected.processName : null,
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
  const detected = detectActiveGame()
  return {
    game: detected ? detected.name : null,
    emoji: detected ? detected.emoji : null,
    phrases: detected ? detected.phrases : DEFAULT_PHRASES,
    processName: detected ? detected.processName : null,
  }
})

function setupAutoUpdater(win: BrowserWindow) {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('update-available', (info) => { win.webContents.send('update:available', info.version) })
  autoUpdater.on('update-downloaded', () => { win.webContents.send('update:downloaded') })
  autoUpdater.on('error', (err) => { console.error('Auto-updater error:', err.message) })
  autoUpdater.checkForUpdates()
  setInterval(() => autoUpdater.checkForUpdates(), 30 * 60 * 1000)
}

ipcMain.handle('update:install', () => { autoUpdater.quitAndInstall() })

function createOverlayWindow() {
  if (overlayWindow) { overlayWindow.show(); overlayWindow.focus(); return }
  const { width } = screen.getPrimaryDisplay().workAreaSize
  overlayWindow = new BrowserWindow({
    width: 320, height: 200, x: width - 340, y: 20,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, resizable: true, hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false },
  })
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.setVisibleOnAllWorkspaces(true)
  if (isDev) { overlayWindow.loadURL('http://localhost:5173/#/overlay') }
  else { overlayWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/overlay' }) }
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

// ─── Helper: rend la fenêtre principale invisible sans suspendre le renderer ──
function hideMainWindow() {
  if (!mainWindow) return
  mainWindow.setOpacity(0)
  mainWindow.setIgnoreMouseEvents(true)
}

// ─── Helper: restaure la fenêtre principale ───────────────────────────────────
function showMainWindow() {
  if (!mainWindow) return
  mainWindow.setOpacity(1)
  mainWindow.setIgnoreMouseEvents(false)
  mainWindow.show()
}

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
    skipTaskbar: true, resizable: false, movable: false, enableLargerThanScreen: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false },
  })
  selectionWindow.setAlwaysOnTop(true, 'screen-saver')
  selectionWindow.setVisibleOnAllWorkspaces(true)
  selectionWindow.setBounds({ x: minX, y: minY, width: totalWidth, height: totalHeight })
  if (isDev) { selectionWindow.loadURL('http://localhost:5173/#/ocr-select') }
  else { selectionWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/ocr-select' }) }
  selectionWindow.on('closed', () => {
    selectionWindow = null
    // ─── FIX: Restaure la fenêtre principale sans suspendre le renderer ───────
    showMainWindow()
  })
}

function closeSelectionWindow() {
  if (selectionWindow) { selectionWindow.close(); selectionWindow = null }
}

ipcMain.handle('ocr:init', async () => { await initOCR(); return { success: true } })

// ─── FIX: setOpacity(0) au lieu de hide() — évite la suspension du renderer ──
// hide() suspend Electron → Supabase perd la session JWT → stats/profile à 0
ipcMain.handle('ocr:openSelection', async () => {
  hideMainWindow()
  await new Promise(resolve => setTimeout(resolve, 100))
  createSelectionWindow()
  return { success: true }
})

// ─── FIX: showMainWindow() restaure opacity + mouseEvents ─────────────────────
ipcMain.handle('ocr:closeSelection', () => {
  closeSelectionWindow()
  showMainWindow()
  return { success: true }
})

ipcMain.handle('ocr:zoneSelected', async (_event, zone) => {
  closeSelectionWindow()
  await new Promise(resolve => setTimeout(resolve, 200))
  showMainWindow()
  if (mainWindow) {
    mainWindow.webContents.send('ocr:capturing', true)
  }
  await startCapture(zone, (buffer) => {
    if (mainWindow) mainWindow.webContents.send('ocr:image', buffer)
  })
  return { success: true }
})

ipcMain.handle('ocr:start', async (_event, zone: { x: number; y: number; width: number; height: number }) => {
  await startCapture(zone, (buffer) => { if (mainWindow) mainWindow.webContents.send('ocr:image', buffer) })
  return { success: true }
})

ipcMain.handle('ocr:stop', () => { stopCapture(); return { success: true } })

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

ipcMain.handle('shell:openExternal', (_event, url: string) => { shell.openExternal(url) })

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

ipcMain.handle('virtual-audio:list-devices', async () => { return listAudioDevices() })
ipcMain.handle('virtual-audio:play', async (_event, deviceId: string, pcmBuffer: ArrayBuffer, sampleRate: number, channels: number) => {
  const buffer = Buffer.from(pcmBuffer)
  const success = playAudioOnDevice(deviceId, buffer, sampleRate, channels)
  return { success }
})

// ─── Pont HTTPS Railway → bypass CORS en dev ET en production ─────────────────
const RAILWAY_HOST = 'ggtranslatebackend-production.up.railway.app'

function railwayPost(apiPath: string, body: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body, 'utf8')
    const req = https.request(
      { hostname: RAILWAY_HOST, path: apiPath, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': buf.length } },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(Buffer.concat(chunks))
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString('utf8').slice(0, 200)}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(buf)
    req.end()
  })
}

// JSON endpoint (translate, discord, billing…)
ipcMain.handle('railway:post', async (_event, apiPath: string, bodyObj: unknown) => {
  const raw = await railwayPost(apiPath, JSON.stringify(bodyObj))
  return JSON.parse(raw.toString('utf8'))
})

// Binary endpoint (TTS — retourne les bytes MP3 au renderer)
ipcMain.handle('railway:post-binary', async (_event, apiPath: string, bodyObj: unknown) => {
  return await railwayPost(apiPath, JSON.stringify(bodyObj))
})