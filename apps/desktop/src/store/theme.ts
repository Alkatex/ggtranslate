import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Theme {
  id: string
  name: string
  emoji: string
  filter: string
  bgStyle: 'cyber' | 'matrix' | 'grid' | 'aurora' | 'minimal' | 'ghost' | 'blood' | 'sunset'
  description: string
}

export const THEMES: Theme[] = [
  {
    id: 'cyber',
    name: 'Cyber',
    emoji: '🔵',
    filter: 'none',
    bgStyle: 'cyber',
    description: 'Le style original — cyan sur fond sombre',
  },
  {
    id: 'clean',
    name: 'Clean',
    emoji: '🩶',
    filter: 'none',
    bgStyle: 'minimal',
    description: 'Style Discord — blurple, gris foncé, propre',
  },
  {
    id: 'neon',
    name: 'Neon',
    emoji: '🟢',
    filter: 'none',
    bgStyle: 'matrix',
    description: 'Matrix vibes — pluie de code vert',
  },
  {
    id: 'blood',
    name: 'Blood',
    emoji: '🔴',
    filter: 'none',
    bgStyle: 'blood',
    description: 'FPS hardcore — rouge sang intense',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '🟣',
    filter: 'none',
    bgStyle: 'aurora',
    description: 'Aurore boréale — vagues violettes et bleues',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🟠',
    filter: 'none',
    bgStyle: 'sunset',
    description: 'Coucher de soleil — orange et rose chaud',
  },
  {
    id: 'ghost',
    name: 'Ghost',
    emoji: '👻',
    filter: 'none',
    bgStyle: 'ghost',
    description: 'Minimaliste — noir et blanc épuré',
  },
  {
    id: 'pro',
    name: 'Pro',
    emoji: '⚡',
    filter: 'none',
    bgStyle: 'grid',
    description: 'Grille tech — indigo professionnel',
  },
]

interface ThemeStore {
  themeId: string
  setTheme: (id: string) => void
  getTheme: () => Theme
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      themeId: 'cyber',
      setTheme: (id) => set({ themeId: id }),
      getTheme: () => THEMES.find(t => t.id === get().themeId) || THEMES[0],
    }),
    { name: 'ggtranslate-theme' }
  )
)