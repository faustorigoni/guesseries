// Servicio especializado para obtener imágenes de series y episodios
// Combina múltiples APIs para maximizar la disponibilidad de imágenes

interface ImageResult {
  url: string
  source: string
  quality: 'high' | 'medium' | 'low'
}

class ImageService {
  private readonly TVMAZE_BASE = 'https://api.tvmaze.com'
  private readonly TMDB_BASE = 'https://api.themoviedb.org/3'
  private readonly TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

  // Obtener imagen de episodio desde múltiples fuentes
  async getEpisodeImage(seriesName: string, season: number, episode: number): Promise<ImageResult | null> {
    try {
      // 1. Intentar con TVMaze (gratuito y buena cobertura)
      const tvmazeResult = await this.getTVMazeEpisodeImage(seriesName, season, episode)
      if (tvmazeResult) return tvmazeResult

      // 2. Intentar con TMDB (requiere API key pero mejor calidad)
      const tmdbResult = await this.getTMDBEpisodeImage(seriesName, season, episode)
      if (tmdbResult) return tmdbResult

      // 3. Fallback a poster de serie
      const seriesPoster = await this.getSeriesPoster(seriesName)
      if (seriesPoster) return seriesPoster

      return null
    } catch (error) {
      console.error('Error obteniendo imagen de episodio:', error)
      return null
    }
  }

  // TVMaze API - gratuita y buena para series
  private async getTVMazeEpisodeImage(seriesName: string, season: number, episode: number): Promise<ImageResult | null> {
    try {
      // Buscar serie
      const searchResponse = await fetch(`${this.TVMAZE_BASE}/search/shows?q=${encodeURIComponent(seriesName)}`)
      const searchData = await searchResponse.json()
      
      if (!searchData.length) return null

      const showId = searchData[0].show.id

      // Obtener episodios
      const episodesResponse = await fetch(`${this.TVMAZE_BASE}/shows/${showId}/episodes`)
      const episodes = await episodesResponse.json()

      // Buscar episodio específico
      const targetEpisode = episodes.find((ep: any) => 
        ep.season === season && ep.number === episode
      )

      if (targetEpisode?.image?.medium) {
        return {
          url: targetEpisode.image.medium,
          source: 'tvmaze',
          quality: 'medium'
        }
      }

      return null
    } catch (error) {
      console.error('Error con TVMaze:', error)
      return null
    }
  }

  // TMDB API - mejor calidad pero requiere API key
  private async getTMDBEpisodeImage(seriesName: string, season: number, episode: number): Promise<ImageResult | null> {
    try {
      // Nota: Necesitarías una API key de TMDB
      const apiKey = process.env.REACT_APP_TMDB_API_KEY
      if (!apiKey) return null

      // Buscar serie
      const searchResponse = await fetch(
        `${this.TMDB_BASE}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(seriesName)}`
      )
      const searchData = await searchResponse.json()
      
      if (!searchData.results.length) return null

      const seriesId = searchData.results[0].id

      // Obtener detalles del episodio
      const episodeResponse = await fetch(
        `${this.TMDB_BASE}/tv/${seriesId}/season/${season}/episode/${episode}?api_key=${apiKey}`
      )
      const episodeData = await episodeResponse.json()

      if (episodeData.still_path) {
        return {
          url: `${this.TMDB_IMAGE_BASE}${episodeData.still_path}`,
          source: 'tmdb',
          quality: 'high'
        }
      }

      return null
    } catch (error) {
      console.error('Error con TMDB:', error)
      return null
    }
  }

  // Obtener poster de la serie como fallback
  private async getSeriesPoster(seriesName: string): Promise<ImageResult | null> {
    try {
      // Intentar con TVMaze primero
      const searchResponse = await fetch(`${this.TVMAZE_BASE}/search/shows?q=${encodeURIComponent(seriesName)}`)
      const searchData = await searchResponse.json()
      
      if (searchData.length && searchData[0].show.image?.medium) {
        return {
          url: searchData[0].show.image.medium,
          source: 'tvmaze-series',
          quality: 'medium'
        }
      }

      return null
    } catch (error) {
      console.error('Error obteniendo poster de serie:', error)
      return null
    }
  }

  // Método de prueba para verificar disponibilidad
  async testImageAvailability(seriesName: string): Promise<{
    tvmaze: boolean
    tmdb: boolean
    totalImages: number
  }> {
    const results = {
      tvmaze: false,
      tmdb: false,
      totalImages: 0
    }

    try {
      // Probar TVMaze
      const searchResponse = await fetch(`${this.TVMAZE_BASE}/search/shows?q=${encodeURIComponent(seriesName)}`)
      const searchData = await searchResponse.json()
      
      if (searchData.length) {
        results.tvmaze = true
        const showId = searchData[0].show.id
        const episodesResponse = await fetch(`${this.TVMAZE_BASE}/shows/${showId}/episodes`)
        const episodes = await episodesResponse.json()
        
        results.totalImages = episodes.filter((ep: any) => ep.image?.medium).length
      }
    } catch (error) {
      console.error('Error probando TVMaze:', error)
    }

    return results
  }
}

export const imageService = new ImageService()
export type { ImageResult }
