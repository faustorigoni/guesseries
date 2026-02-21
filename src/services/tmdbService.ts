// Servicio TMDB para obtener textos en español
// Se usará complementariamente con TVmaze para imágenes

import { LocalizedString } from '../types/series'

interface TMDBSearchResult {
  id: number
  name: string
  overview: string
  first_air_date?: string
  poster_path?: string
}

interface TMDBSeason {
  id: number
  season_number: number
  overview?: string
}

interface TMDBEpisode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
}

class TMDBService {
  private readonly API_BASE = 'https://api.themoviedb.org/3'
  private readonly API_KEY = import.meta.env.VITE_TMDB_API_KEY || ''
  private readonly LANGUAGE_ES = 'es-ES' // Español de España
  private readonly LANGUAGE_EN = 'en-US' // Inglés de EE.UU.

  // Buscar serie en español
  async searchSeries(query: string): Promise<TMDBSearchResult | null> {
    try {
      if (!this.API_KEY) {
        console.warn('TMDB API key no configurada')
        return null
      }

      const response = await fetch(
        `${this.API_BASE}/search/tv?api_key=${this.API_KEY}&language=${this.LANGUAGE_ES}&query=${encodeURIComponent(query)}`
      )
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.results?.[0] || null
    } catch (error) {
      console.error('Error buscando serie en TMDB:', error)
      return null
    }
  }

  // Obtener detalles de serie en español
  async getSeriesDetails(tmdbId: number): Promise<TMDBSearchResult | null> {
    try {
      if (!this.API_KEY) return null

      const response = await fetch(
        `${this.API_BASE}/tv/${tmdbId}?api_key=${this.API_KEY}&language=${this.LANGUAGE_ES}`
      )
      
      if (!response.ok) return null
      
      return await response.json()
    } catch (error) {
      console.error('Error obteniendo detalles de serie TMDB:', error)
      return null
    }
  }

  // Obtener episodios de una temporada en español
  async getSeasonEpisodes(tmdbId: number, seasonNumber: number): Promise<TMDBEpisode[]> {
    try {
      if (!this.API_KEY) return []

      const response = await fetch(
        `${this.API_BASE}/tv/${tmdbId}/season/${seasonNumber}?api_key=${this.API_KEY}&language=${this.LANGUAGE_ES}`
      )
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.episodes || []
    } catch (error) {
      console.error('Error obteniendo episodios TMDB:', error)
      return []
    }
  }

  // Obtener episodios de una temporada en inglés
  async getSeasonEpisodesEnglish(tmdbId: number, seasonNumber: number): Promise<TMDBEpisode[]> {
    try {
      if (!this.API_KEY) return []

      const response = await fetch(
        `${this.API_BASE}/tv/${tmdbId}/season/${seasonNumber}?api_key=${this.API_KEY}&language=${this.LANGUAGE_EN}`
      )
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.episodes || []
    } catch (error) {
      console.error('Error obteniendo episodios TMDB en inglés:', error)
      return []
    }
  }

  // Obtener detalles de serie en inglés
  async getSeriesDetailsEnglish(tmdbId: number): Promise<TMDBSearchResult | null> {
    try {
      if (!this.API_KEY) return null

      const response = await fetch(
        `${this.API_BASE}/tv/${tmdbId}?api_key=${this.API_KEY}&language=${this.LANGUAGE_EN}`
      )
      
      if (!response.ok) return null
      
      return await response.json()
    } catch (error) {
      console.error('Error obteniendo detalles de serie TMDB en inglés:', error)
      return null
    }
  }

  // Función para convertir datos TMDB a formato LocalizedString
  private toLocalizedString(spanishText: string, englishText: string = ''): LocalizedString {
    return { 
      en: englishText || spanishText, // Usar español como fallback si no hay inglés
      es: spanishText 
    }
  }

  // Buscar y obtener datos completos de serie en ambos idiomas
  async getCompleteSeriesData(query: string): Promise<{
    title: LocalizedString
    plot: LocalizedString
    episodes: Array<{
      season: number
      episode: number
      title: LocalizedString
      description: LocalizedString
    }>
  } | null> {
    try {
      // Buscar serie en español
      const searchResult = await this.searchSeries(query)
      if (!searchResult) return null

      // Obtener detalles en ambos idiomas
      const [detailsEs, detailsEn] = await Promise.all([
        this.getSeriesDetails(searchResult.id),
        this.getSeriesDetailsEnglish(searchResult.id)
      ])
      
      if (!detailsEs) return null

      // Obtener información de temporadas
      const seasonsResponse = await fetch(
        `${this.API_BASE}/tv/${searchResult.id}?api_key=${this.API_KEY}&language=${this.LANGUAGE_ES}`
      )
      const seriesData = await seasonsResponse.json()
      
      const allEpisodes: Array<{
        season: number
        episode: number
        title: LocalizedString
        description: LocalizedString
      }> = []

      // Para cada temporada, obtener sus episodios en ambos idiomas
      for (const season of seriesData.seasons || []) {
        if (season.season_number === 0) continue // Ignorar especiales
        
        const [episodesEs, episodesEn] = await Promise.all([
          this.getSeasonEpisodes(searchResult.id, season.season_number),
          this.getSeasonEpisodesEnglish(searchResult.id, season.season_number)
        ])
        
        episodesEs.forEach(episodeEs => {
          const episodeEn = episodesEn.find(ep => ep.episode_number === episodeEs.episode_number)
          
          allEpisodes.push({
            season: episodeEs.season_number,
            episode: episodeEs.episode_number,
            title: this.toLocalizedString(
              episodeEs.name,
              episodeEn?.name || ''
            ),
            description: this.toLocalizedString(
              episodeEs.overview,
              episodeEn?.overview || ''
            )
          })
        })
      }

      return {
        title: this.toLocalizedString(
          detailsEs.name,
          detailsEn?.name || ''
        ),
        plot: this.toLocalizedString(
          detailsEs.overview,
          detailsEn?.overview || ''
        ),
        episodes: allEpisodes
      }
    } catch (error) {
      console.error('Error obteniendo datos completos de TMDB:', error)
      return null
    }
  }
}

export const tmdbService = new TMDBService()
export type { TMDBSearchResult, TMDBSeason, TMDBEpisode }
