import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppLang, translations, TranslationKey } from '../lib/i18n'

interface AppLanguageStore {
  lang: AppLang
  setLang: (lang: AppLang) => void
  t: (key: TranslationKey) => string
}

export const useAppLanguage = create<AppLanguageStore>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      t: (key) => {
        const { lang } = get()
        return translations[lang][key] || translations.fr[key] || key
      },
    }),
    { name: 'ggtranslate-lang' }
  )
)