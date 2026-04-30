const API_URL = import.meta.env.VITE_API_URL || 'https://ggtranslatebackend-production.up.railway.app'

const DB_NAME = 'ggtranslate-cache'
const DB_VERSION = 1
const STORE_NAME = 'translations'
const LRU_MAX = 200
const DB_MAX_AGE_DAYS = 30
const DB_TIMEOUT_MS = 1000 // timeout réduit à 1s

// ─── LRU Cache en mémoire ─────────────────────────────────────────────────────
class LRUCache {
  private map = new Map<string, string>()
  private max: number

  constructor(max: number) {
    this.max = max
  }

  get(key: string): string | undefined {
    if (!this.map.has(key)) return undefined
    const val = this.map.get(key)!
    this.map.delete(key)
    this.map.set(key, val)
    return val
  }

  set(key: string, value: string) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.max) {
      const oldestKey = this.map.keys().next().value
      if (oldestKey) this.map.delete(oldestKey)
    }
  }

  has(key: string): boolean {
    return this.map.has(key)
  }

  get size(): number {
    return this.map.size
  }
}

const lruCache = new LRUCache(LRU_MAX)

// ─── IndexedDB — avec timeout et fallback silencieux ─────────────────────────
let db: IDBDatabase | null = null
let dbFailed = false // si DB a échoué on arrête d'essayer

async function openDB(): Promise<IDBDatabase> {
  if (db) return db
  if (dbFailed) throw new Error('IndexedDB non disponible')

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      dbFailed = true
      reject(new Error('IndexedDB timeout'))
    }, DB_TIMEOUT_MS)

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'key' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      clearTimeout(timeout)
      db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onerror = () => {
      clearTimeout(timeout)
      dbFailed = true
      reject(request.error)
    }
  })
}

async function getFromDB(key: string): Promise<string | null> {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 500)
      const tx = database.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => {
        clearTimeout(timeout)
        const result = request.result
        if (!result) { resolve(null); return }
        const ageMs = Date.now() - result.timestamp
        if (ageMs > DB_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
          resolve(null)
          return
        }
        resolve(result.value)
      }
      request.onerror = () => { clearTimeout(timeout); resolve(null) }
    })
  } catch {
    return null
  }
}

async function saveToDB(key: string, value: string): Promise<void> {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put({ key, value, timestamp: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {}
}

async function cleanOldEntries(): Promise<void> {
  try {
    const database = await openDB()
    const cutoff = Date.now() - DB_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(cutoff)
      const request = index.openCursor(range)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) { cursor.delete(); cursor.continue() }
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {}
}

// Nettoyage au démarrage — non bloquant
setTimeout(() => cleanOldEntries().catch(() => {}), 5000)

function buildCacheKey(text: string, sourceLang: string, targetLang: string): string {
  return `${sourceLang}:${targetLang}:${text.trim().toLowerCase()}`
}

// ─── Export principal ─────────────────────────────────────────────────────────
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (sourceLang === targetLang) return text
  if (!text.trim()) return text

  const key = buildCacheKey(text, sourceLang, targetLang)

  // ─── 1. LRU mémoire (instantané) ─────────────────────────────────────────
  if (lruCache.has(key)) {
    console.log('⚡ LRU hit:', text.slice(0, 30))
    return lruCache.get(key)!
  }

  // ─── 2. IndexedDB — non bloquant, timeout court ───────────────────────────
  if (!dbFailed) {
    const cached = await getFromDB(key)
    if (cached) {
      console.log('💾 DB hit:', text.slice(0, 30))
      lruCache.set(key, cached)
      return cached
    }
  }

  // ─── 3. API DeepL ─────────────────────────────────────────────────────────
  const res = await fetch(`${API_URL}/ai/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  })

  if (!res.ok) throw new Error('Erreur traduction')

  const data = await res.json() as any
  const translated = data.translated || data.translatedText

  if (!translated) throw new Error('Réponse traduction invalide')

  lruCache.set(key, translated)
  saveToDB(key, translated).catch(() => {})

  console.log(`✅ Traduit: "${text.slice(0, 20)}" → "${translated.slice(0, 20)}"`)
  return translated
}

export function clearTranslationCache() {
  lruCache['map'].clear()
  db = null
  dbFailed = false
  console.log('🧹 Cache vidé')
}

export async function getCacheStats(): Promise<{ lruSize: number; dbSize: number }> {
  try {
    const database = await openDB()
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const countReq = store.count()
      countReq.onsuccess = () => resolve({ lruSize: lruCache.size, dbSize: countReq.result })
      countReq.onerror = () => resolve({ lruSize: lruCache.size, dbSize: 0 })
    })
  } catch {
    return { lruSize: lruCache.size, dbSize: 0 }
  }
}