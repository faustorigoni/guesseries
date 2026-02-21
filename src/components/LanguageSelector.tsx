import { useState, useEffect } from 'react'
import { LanguageConfig } from '../types/series'

interface LanguageSelectorProps {
  currentLanguage: 'en' | 'es'
  onLanguageChange: (language: 'en' | 'es') => void
  className?: string
}

export default function LanguageSelector({ currentLanguage, onLanguageChange, className = '' }: LanguageSelectorProps) {
  const [language, setLanguage] = useState<'en' | 'es'>(currentLanguage)

  const languages: LanguageConfig[] = [
    { 
      code: 'en', 
      name: 'English',
      flag: 'https://flagcdn.com/w40/gb.png' // Bandera del Reino Unido para inglés
    },
    { 
      code: 'es', 
      name: 'Español',
      flag: 'https://flagcdn.com/w40/es.png' // Bandera de España para español
    }
  ]

  useEffect(() => {
    setLanguage(currentLanguage)
  }, [currentLanguage])

  const handleLanguageChange = (langCode: 'en' | 'es') => {
    setLanguage(langCode)
    onLanguageChange(langCode)
    localStorage.setItem('guesseries-language', langCode)
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
            language === lang.code
              ? 'bg-purple-600 shadow-lg scale-110 ring-2 ring-purple-400'
              : 'bg-white/20 hover:bg-white/30'
          }`}
          title={lang.name}
        >
          <img 
            src={lang.flag} 
            alt={lang.name}
            className="w-8 h-6 object-cover rounded"
          />
        </button>
      ))}
    </div>
  )
}
