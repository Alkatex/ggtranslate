export interface Language {
    code: string
    flag: string
    name: string
    plan: 'free' | 'starter' | 'pro'
  }
  
  export const ALL_LANGUAGES: Language[] = [
    // FREE — 2 langues
    { code: 'fr', flag: '🇫🇷', name: 'Français', plan: 'free' },
    { code: 'en', flag: '🇬🇧', name: 'English', plan: 'free' },
  
    // STARTER — 7 langues
    { code: 'es', flag: '🇪🇸', name: 'Español', plan: 'starter' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch', plan: 'starter' },
    { code: 'pt', flag: '🇧🇷', name: 'Português', plan: 'starter' },
    { code: 'it', flag: '🇮🇹', name: 'Italiano', plan: 'starter' },
    { code: 'nl', flag: '🇳🇱', name: 'Nederlands', plan: 'starter' },
    { code: 'pl', flag: '🇵🇱', name: 'Polski', plan: 'starter' },
    { code: 'ru', flag: '🇷🇺', name: 'Русский', plan: 'starter' },
  
    // PRO — toutes les langues
    { code: 'ko', flag: '🇰🇷', name: '한국어', plan: 'pro' },
    { code: 'ja', flag: '🇯🇵', name: '日本語', plan: 'pro' },
    { code: 'zh', flag: '🇨🇳', name: '中文', plan: 'pro' },
    { code: 'ar', flag: '🇸🇦', name: 'العربية', plan: 'pro' },
    { code: 'tr', flag: '🇹🇷', name: 'Türkçe', plan: 'pro' },
    { code: 'sv', flag: '🇸🇪', name: 'Svenska', plan: 'pro' },
    { code: 'no', flag: '🇳🇴', name: 'Norsk', plan: 'pro' },
    { code: 'da', flag: '🇩🇰', name: 'Dansk', plan: 'pro' },
    { code: 'fi', flag: '🇫🇮', name: 'Suomi', plan: 'pro' },
    { code: 'cs', flag: '🇨🇿', name: 'Čeština', plan: 'pro' },
    { code: 'sk', flag: '🇸🇰', name: 'Slovenčina', plan: 'pro' },
    { code: 'hu', flag: '🇭🇺', name: 'Magyar', plan: 'pro' },
    { code: 'ro', flag: '🇷🇴', name: 'Română', plan: 'pro' },
    { code: 'bg', flag: '🇧🇬', name: 'Български', plan: 'pro' },
    { code: 'hr', flag: '🇭🇷', name: 'Hrvatski', plan: 'pro' },
    { code: 'uk', flag: '🇺🇦', name: 'Українська', plan: 'pro' },
    { code: 'el', flag: '🇬🇷', name: 'Ελληνικά', plan: 'pro' },
    { code: 'he', flag: '🇮🇱', name: 'עברית', plan: 'pro' },
    { code: 'th', flag: '🇹🇭', name: 'ภาษาไทย', plan: 'pro' },
    { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt', plan: 'pro' },
    { code: 'id', flag: '🇮🇩', name: 'Bahasa Indonesia', plan: 'pro' },
    { code: 'ms', flag: '🇲🇾', name: 'Bahasa Melayu', plan: 'pro' },
    { code: 'hi', flag: '🇮🇳', name: 'हिन्दी', plan: 'pro' },
    { code: 'bn', flag: '🇧🇩', name: 'বাংলা', plan: 'pro' },
    { code: 'fa', flag: '🇮🇷', name: 'فارسی', plan: 'pro' },
    { code: 'ur', flag: '🇵🇰', name: 'اردو', plan: 'pro' },
    { code: 'lt', flag: '🇱🇹', name: 'Lietuvių', plan: 'pro' },
    { code: 'lv', flag: '🇱🇻', name: 'Latviešu', plan: 'pro' },
    { code: 'et', flag: '🇪🇪', name: 'Eesti', plan: 'pro' },
    { code: 'sl', flag: '🇸🇮', name: 'Slovenščina', plan: 'pro' },
    { code: 'sr', flag: '🇷🇸', name: 'Српски', plan: 'pro' },
    { code: 'ca', flag: '🏴', name: 'Català', plan: 'pro' },
  ]
  
  export function getAvailableLanguages(plan: 'free' | 'starter' | 'pro' | 'trial'): Language[] {
    if (plan === 'pro' || plan === 'trial') return ALL_LANGUAGES
    if (plan === 'starter') return ALL_LANGUAGES.filter(l => l.plan !== 'pro')
    return ALL_LANGUAGES.filter(l => l.plan === 'free')
  }