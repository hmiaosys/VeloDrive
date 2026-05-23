import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="flex items-center gap-1">
      <Globe className="h-3.5 w-3.5 text-slate-400" />
      {languages.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            i18n.language === code
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title={label}
        >
          {flag} {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
