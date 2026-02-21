export interface Episode {
  id: string
  title: LocalizedString
  episode: number
  season: number
  image: string
  description: LocalizedString
}

export interface Season {
  seasonNumber: number
  episodes: Episode[]
}

export interface Series {
  id: string
  title: LocalizedString
  year?: string
  poster: string
  plot: LocalizedString
  seasons: Season[]
}

export interface SeriesData {
  [seriesId: string]: Series
}

// Tipos de utilidad para manejo bilingüe
export type LocalizedString = string | { en: string; es: string }

export interface LanguageConfig {
  code: 'en' | 'es'
  name: string
}

// Función de utilidad para obtener texto en idioma específico
export function getLocalizedText(
  text: LocalizedString, 
  language: 'en' | 'es' = 'en'
): string {
  if (typeof text === 'string') {
    return text // Mantener compatibilidad con datos existentes
  }
  return text[language] || text.en || text.es || ''
}
