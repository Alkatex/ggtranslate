export type ErrorType =
  | 'STT_ERROR'
  | 'TTS_ERROR'
  | 'WS_ERROR'
  | 'OCR_ERROR'
  | 'TRANSLATION_ERROR'
  | 'AUDIO_ERROR'
  | 'PIPELINE_ERROR'

export type ErrorSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical'

export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  retryable: boolean
  timestamp: number
  context?: Record<string, any>
}

type ErrorHandler = (error: AppError) => void

// ─── ErrorBus centralisé ──────────────────────────────────────────────────────
class ErrorBus {
  private handlers = new Map<ErrorType | '*', ErrorHandler[]>()
  private history: AppError[] = []
  private readonly MAX_HISTORY = 50

  // ─── Émettre une erreur ───────────────────────────────────────────────────
  emit(opts: {
    type: ErrorType
    severity: ErrorSeverity
    message: string
    retryable?: boolean
    context?: Record<string, any>
  }) {
    const error: AppError = {
      type: opts.type,
      severity: opts.severity,
      message: opts.message,
      retryable: opts.retryable ?? false,
      timestamp: Date.now(),
      context: opts.context,
    }

    // Log structuré
    const logFn = opts.severity === 'critical' || opts.severity === 'error'
      ? console.error
      : opts.severity === 'warning'
        ? console.warn
        : console.log

    logFn(`[${error.type}] ${error.severity.toUpperCase()}: ${error.message}`, error.context || '')

    // Historique
    this.history.push(error)
    if (this.history.length > this.MAX_HISTORY) this.history.shift()

    // Notifier handlers spécifiques
    const specificHandlers = this.handlers.get(error.type) || []
    for (const handler of specificHandlers) {
      try { handler(error) } catch {}
    }

    // Notifier handlers globaux
    const globalHandlers = this.handlers.get('*') || []
    for (const handler of globalHandlers) {
      try { handler(error) } catch {}
    }
  }

  // ─── S'abonner à un type d'erreur ────────────────────────────────────────
  on(type: ErrorType | '*', handler: ErrorHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, [])
    this.handlers.get(type)!.push(handler)

    // Retourne une fonction de désabonnement
    return () => {
      const handlers = this.handlers.get(type) || []
      const index = handlers.indexOf(handler)
      if (index > -1) handlers.splice(index, 1)
    }
  }

  // ─── Historique des erreurs ───────────────────────────────────────────────
  getHistory(type?: ErrorType): AppError[] {
    if (type) return this.history.filter(e => e.type === type)
    return [...this.history]
  }

  // ─── Stats erreurs ────────────────────────────────────────────────────────
  getStats(): Record<ErrorType, number> {
    const stats = {} as Record<ErrorType, number>
    for (const error of this.history) {
      stats[error.type] = (stats[error.type] || 0) + 1
    }
    return stats
  }

  clear() {
    this.history = []
  }
}

export const errorBus = new ErrorBus()