import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Theme {
  id: string
  name: string
  emoji: string
  hue: number
  filter: string
  bgStyle: 'particles' | 'matrix' | 'grid' | 'aurora' | 'minimal' | 'ghost'
  description: string
}

export const THEMES: Theme[] = [
  {
    id: 'cyber',
    name: 'Cyber',
    emoji: '🔵',
    hue: 0,
    filter: 'none',
    bgStyle: 'particles',
    description: 'Le style original — cyan sur fond sombre',
  },
  {
    id: 'clean',
    name: 'Clean',
    emoji: '🩶',
    hue: 0,
    filter: 'hue-rotate(230deg) saturate(0.7) brightness(0.95)',
    bgStyle: 'minimal',
    description: 'Style Discord — blurple, gris foncé, propre',
  },
  {
    id: 'neon',
    name: 'Neon',
    emoji: '🟢',
    hue: 80,
    filter: 'hue-rotate(80deg)',
    bgStyle: 'matrix',
    description: 'Matrix vibes — pluie de code vert',
  },
  {
    id: 'blood',
    name: 'Blood',
    emoji: '🔴',
    hue: 180,
    filter: 'hue-rotate(180deg)',
    bgStyle: 'particles',
    description: 'FPS hardcore — rouge sang',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '🟣',
    hue: 200,
    filter: 'hue-rotate(200deg)',
    bgStyle: 'aurora',
    description: 'Aurore boréale — vagues violettes et bleues',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🟠',
    hue: -40,
    filter: 'hue-rotate(-40deg)',
    bgStyle: 'particles',
    description: 'Coucher de soleil — orange chaleureux',
  },
  {
    id: 'ghost',
    name: 'Ghost',
    emoji: '👻',
    hue: 0,
    filter: 'grayscale(0.8) brightness(1.1)',
    bgStyle: 'ghost',
    description: 'Minimaliste — noir et blanc épuré',
  },
  {
    id: 'pro',
    name: 'Pro',
    emoji: '⚡',
    hue: 180,
    filter: 'hue-rotate(180deg)',
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