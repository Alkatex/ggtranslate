import { BrowserWindow } from 'electron'

export type OtherPlayersEngineState =
  | 'idle'
  | 'ready'
  | 'capturing'
  | 'processing'
  | 'error'

interface OtherPlayersSession {
  isActive: boolean
  state: OtherPlayersEngineState
  sourceDeviceId: string | null
  ttsOutputDeviceId: string | null
  ttsEnabled: boolean
}

let currentSession: OtherPlayersSession | null = null

function emitState(win: BrowserWindow, state: OtherPlayersEngineState) {
  win.webContents.send('otherPlayers:state', state)
}

function emitError(win: BrowserWindow, message: string) {
  win.webContents.send('otherPlayers:error', message)
}

export async function startOtherPlayersSession(
  win: BrowserWindow,
  payload?: {
    sourceDeviceId?: string | null
    ttsOutputDeviceId?: string | null
    ttsEnabled?: boolean
  }
): Promise<void> {
  if (currentSession?.isActive) {
    stopOtherPlayersSession(win)
  }

  currentSession = {
    isActive: true,
    state: 'ready',
    sourceDeviceId: payload?.sourceDeviceId ?? null,
    ttsOutputDeviceId: payload?.ttsOutputDeviceId ?? null,
    ttsEnabled: payload?.ttsEnabled ?? false,
  }

  emitState(win, 'ready')
}

export function stopOtherPlayersSession(win: BrowserWindow): void {
  if (!currentSession) {
    emitState(win, 'idle')
    return
  }

  currentSession.isActive = false
  currentSession.state = 'idle'
  currentSession = null

  emitState(win, 'idle')
}

export function getOtherPlayersState(): OtherPlayersEngineState {
  return currentSession?.state ?? 'idle'
}

export function updateOtherPlayersRouting(
  win: BrowserWindow,
  payload: {
    sourceDeviceId?: string | null
    ttsOutputDeviceId?: string | null
    ttsEnabled?: boolean
  }
): { success: boolean; unsafe: boolean } {
  if (!currentSession) {
    currentSession = {
      isActive: false,
      state: 'idle',
      sourceDeviceId: payload.sourceDeviceId ?? null,
      ttsOutputDeviceId: payload.ttsOutputDeviceId ?? null,
      ttsEnabled: payload.ttsEnabled ?? false,
    }
  } else {
    currentSession.sourceDeviceId = payload.sourceDeviceId ?? currentSession.sourceDeviceId
    currentSession.ttsOutputDeviceId =
      payload.ttsOutputDeviceId ?? currentSession.ttsOutputDeviceId
    currentSession.ttsEnabled = payload.ttsEnabled ?? currentSession.ttsEnabled
  }

  const unsafe =
    !!currentSession.ttsEnabled &&
    !!currentSession.sourceDeviceId &&
    !!currentSession.ttsOutputDeviceId &&
    currentSession.sourceDeviceId === currentSession.ttsOutputDeviceId

  if (unsafe) {
    currentSession.state = 'error'
    emitState(win, 'error')
    emitError(
      win,
      'Routing audio dangereux : la capture Other Players et la sortie TTS utilisent la même sortie.'
    )
  } else if (currentSession.isActive) {
    currentSession.state = 'ready'
    emitState(win, 'ready')
  }

  return { success: true, unsafe }
}