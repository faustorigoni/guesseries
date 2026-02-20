import { Series, Season, Episode } from '../types/series'

const OMDB_API_KEY = 'dcc99569' // Necesitarás obtener una API key
const OMDB_BASE_URL = 'http://www.omdbapi.com/'

export interface OMDBSearchResponse {
  Search: Array<{
    Title: string
    Year: string
    imdbID: string
    Type: string
    Poster: string
  }>
  totalResults: string
  Response: string
}

export interface OMDBSeriesResponse {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  Poster: string
  Ratings: Array<{
    Source: string
    Value: string
  }>
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: string
  DVD: string
  BoxOffice: string
  Production: string
  Website: string
  Response: string
  totalSeasons: string
}

export interface OMDBSeasonResponse {
  Title: string
  Season: string
  Episodes: Array<{
    Title: string
    Released: string
    Episode: string
    imdbRating: string
    imdbID: string
  }>
  Response: string
}

class OMDBService {
  private static instance: OMDBService
  private cache: Map<string, any> = new Map()

  static getInstance(): OMDBService {
    if (!OMDBService.instance) {
      OMDBService.instance = new OMDBService()
    }
    return OMDBService.instance
  }

  private async fetchWithCache(url: string): Promise<any> {
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }

    const response = await fetch(url)
    const data = await response.json()
    
    if (data.Response === 'False') {
      throw new Error(data.Error || 'Error en la API')
    }

    this.cache.set(url, data)
    return data
  }

  // Método para obtener imágenes de episodios desde TVMaze
  private async getTVMazeEpisodeImage(seriesName: string, season: number, episode: number): Promise<string | null> {
    try {
      console.log(`🔍 Buscando imagen en TVMaze: ${seriesName} S${season}E${episode}`)
      
      // Buscar serie en TVMaze
      const searchResponse = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(seriesName)}`)
      const searchData = await searchResponse.json()
      
      console.log(`📡 TVMaze search results:`, searchData.length, 'series encontradas')
      
      if (!searchData.length) {
        console.log(`❌ No se encontró la serie en TVMaze: ${seriesName}`)
        return null
      }

      const showId = searchData[0].show.id
      console.log(`🎬 TVMaze show ID: ${showId}`)

      // Obtener episodios
      const episodesResponse = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
      const episodes = await episodesResponse.json()
      
      console.log(`📺 TVMaze episodes found:`, episodes.length)

      // Buscar episodio específico
      const targetEpisode = episodes.find((ep: any) => 
        ep.season === season && ep.number === episode
      )

      console.log(`🎯 Target episode found:`, !!targetEpisode)
      if (targetEpisode?.image) {
        console.log(`🖼️ TVMaze image URLs:`, {
          original: targetEpisode.image.original,
          medium: targetEpisode.image.medium
        })
      }

      if (targetEpisode?.image?.original) {
        return targetEpisode.image.original // Alta calidad
      } else if (targetEpisode?.image?.medium) {
        return targetEpisode.image.medium // Calidad media
      }

      console.log(`❌ No se encontró imagen para episodio ${season}x${episode}`)
      return null
    } catch (error) {
      console.error('❌ Error con TVMaze:', error)
      return null
    }
  }

  async searchSeries(query: string): Promise<OMDBSearchResponse> {
    const url = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=series`
    return this.fetchWithCache(url)
  }

  async getSeriesDetails(imdbId: string): Promise<OMDBSeriesResponse> {
    const url = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbId}`
    return this.fetchWithCache(url)
  }

  async getSeasonEpisodes(imdbId: string, seasonNumber: number): Promise<OMDBSeasonResponse> {
    const url = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbId}&Season=${seasonNumber}`
    return this.fetchWithCache(url)
  }

  async getEpisodeDetails(imdbId: string, seasonNumber: number, episodeNumber: number): Promise<any> {
    const url = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbId}&Season=${seasonNumber}&Episode=${episodeNumber}`
    return this.fetchWithCache(url)
  }

  async getFullSeriesData(imdbId: string): Promise<Series> {
    try {
      // Obtener detalles básicos de la serie
      const seriesDetails = await this.getSeriesDetails(imdbId)
      
      // Obtener información de temporadas (necesitamos hacer múltiples llamadas)
      const seasons: Season[] = []
      let seasonNumber = 1
      
      // Intentar obtener hasta 10 temporadas (la mayoría de las series no tienen más)
      while (seasonNumber <= 10) {
        try {
          const seasonData = await this.getSeasonEpisodes(imdbId, seasonNumber)
          
          if (seasonData.Response === 'False') {
            break // No hay más temporadas
          }

          const episodes: Episode[] = []
          
          for (const ep of seasonData.Episodes) {
            try {
              // Obtener detalles individuales de cada episodio
              const episodeDetails = await this.getEpisodeDetails(imdbId, seasonNumber, parseInt(ep.Episode))
              
              episodes.push({
                id: `${imdbId}-S${seasonNumber}E${ep.Episode}`,
                title: episodeDetails.Title || ep.Title,
                episode: parseInt(ep.Episode),
                season: seasonNumber,
                image: episodeDetails.Poster || seriesDetails.Poster || 'https://picsum.photos/300/450?random=1',
                description: episodeDetails.Plot || `Episodio ${ep.Episode} de la temporada ${seasonNumber}`
              })
            } catch (error) {
              console.warn(`Error obteniendo detalles del episodio ${ep.Episode}:`, error)
              // Usar datos básicos si falla el detalle
              episodes.push({
                id: `${imdbId}-S${seasonNumber}E${ep.Episode}`,
                title: ep.Title,
                episode: parseInt(ep.Episode),
                season: seasonNumber,
                image: 'https://via.placeholder.com/300x450?text=No+Image',
                description: `Episodio ${ep.Episode} de la temporada ${seasonNumber}`
              })
            }
          }

          seasons.push({
            seasonNumber,
            episodes
          })

          seasonNumber++
        } catch (error) {
          console.warn(`Error obteniendo temporada ${seasonNumber}:`, error)
          break
        }
      }

      return {
        id: imdbId,
        title: seriesDetails.Title,
        year: seriesDetails.Year,
        poster: seriesDetails.Poster || 'https://via.placeholder.com/300x450?text=No+Poster',
        plot: seriesDetails.Plot,
        seasons
      }
    } catch (error) {
      console.error('Error obteniendo datos completos de la serie:', error)
      throw error
    }
  }

  async getSeriesBasicInfo(imdbId: string): Promise<Series> {
    try {
      // Obtener detalles básicos de la serie
      const seriesResponse = await this.getSeriesDetails(imdbId)
      const seriesDetails = seriesResponse

      if (seriesDetails.Response === 'False') {
        throw new Error('Serie no encontrada')
      }

      // Obtener información básica de temporadas disponibles (sin detalles de episodios)
      const seasons: Season[] = []
      let seasonNumber = 1

      // Intentar obtener hasta 10 temporadas para saber cuántas existen
      while (seasonNumber <= 10) {
        try {
          const seasonData = await this.getSeasonEpisodes(imdbId, seasonNumber)
          
          if (seasonData.Response === 'False') {
            break // No hay más temporadas
          }

          // Solo guardar información básica de la temporada, sin detalles de episodios
          seasons.push({
            seasonNumber,
            episodes: seasonData.Episodes.map((ep) => ({
              id: `${imdbId}-S${seasonNumber}E${ep.Episode}`,
              title: ep.Title,
              episode: parseInt(ep.Episode),
              season: seasonNumber,
              image: 'https://via.placeholder.com/300x450?text=No+Image',
              description: `Episodio ${ep.Episode} de la temporada ${seasonNumber}`
            }))
          })

          seasonNumber++
        } catch (error) {
          console.warn(`Error verificando temporada ${seasonNumber}:`, error)
          break
        }
      }

      return {
        id: imdbId,
        title: seriesDetails.Title,
        year: seriesDetails.Year,
        poster: seriesDetails.Poster || 'https://via.placeholder.com/300x450?text=No+Poster',
        plot: seriesDetails.Plot,
        seasons
      }
    } catch (error) {
      console.error('Error obteniendo información básica de la serie:', error)
      throw error
    }
  }

  async getSeriesWithSpecificSeasons(imdbId: string, seasonNumbers: number[]): Promise<Series> {
    try {
      // Obtener detalles básicos de la serie
      const seriesResponse = await this.getSeriesDetails(imdbId)
      const seriesDetails = seriesResponse

      if (seriesDetails.Response === 'False') {
        throw new Error('Serie no encontrada')
      }

      const seasons: Season[] = []

      // Obtener solo las temporadas seleccionadas
      for (const seasonNumber of seasonNumbers) {
        try {
          const seasonData = await this.getSeasonEpisodes(imdbId, seasonNumber)
          
          if (seasonData.Response === 'False') {
            console.warn(`Temporada ${seasonNumber} no disponible`)
            continue
          }

          const episodes: Episode[] = []
          
          for (const ep of seasonData.Episodes) {
            try {
              // Obtener detalles individuales de cada episodio
              const episodeDetails = await this.getEpisodeDetails(imdbId, seasonNumber, parseInt(ep.Episode))
              
              // Prioridad: poster del episodio OMDb (alta calidad) > poster de la serie
              let episodeImage = episodeDetails.Poster
              
              // Mejorar la calidad de la imagen de OMDb
              if (episodeImage) {
                // Reemplazar el tamaño pequeño por uno mayor
                episodeImage = episodeImage.replace('._V1_SX300.jpg', '._V1_SX1280.jpg')
                episodeImage = episodeImage.replace('._V1_SX300', '._V1_SX1280')
                episodeImage = episodeImage.replace('@._V1_SX300', '@._V1_SX1280')
                episodeImage = episodeImage.replace('SX300', 'SX1280')
                console.log(`Episodio ${seasonNumber}x${ep.Episode}: Imagen mejorada a alta resolución`)
              }
              
              if (!episodeImage) {
                episodeImage = seriesDetails.Poster
                // Mejorar la calidad del poster de la serie también
                if (episodeImage) {
                  episodeImage = episodeImage.replace('._V1_SX300.jpg', '._V1_SX1280.jpg')
                  episodeImage = episodeImage.replace('._V1_SX300', '._V1_SX1280')
                  episodeImage = episodeImage.replace('@._V1_SX300', '@._V1_SX1280')
                  episodeImage = episodeImage.replace('SX300', 'SX1280')
                }
                console.log(`Episodio ${seasonNumber}x${ep.Episode}: Sin imagen individual, usando poster de serie (alta resolución)`)
              }
              
              console.log(`Episodio ${seasonNumber}x${ep.Episode}:`, {
                episodePoster: episodeDetails.Poster,
                seriesPoster: seriesDetails.Poster,
                finalImage: episodeImage
              })
              
              episodes.push({
                id: `${imdbId}-S${seasonNumber}E${ep.Episode}`,
                title: episodeDetails.Title || ep.Title,
                episode: parseInt(ep.Episode),
                season: seasonNumber,
                image: episodeImage,
                description: episodeDetails.Plot || `Episodio ${ep.Episode} de la temporada ${seasonNumber}`
              })
            } catch (error) {
              console.warn(`Error obteniendo detalles del episodio ${ep.Episode}:`, error)
              // Usar datos básicos si falla el detalle
              const fallbackImage = seriesDetails.Poster
              
              episodes.push({
                id: `${imdbId}-S${seasonNumber}E${ep.Episode}`,
                title: ep.Title,
                episode: parseInt(ep.Episode),
                season: seasonNumber,
                image: fallbackImage,
                description: `Episodio ${ep.Episode} de la temporada ${seasonNumber}`
              })
            }
          }

          seasons.push({
            seasonNumber,
            episodes
          })

        } catch (error) {
          console.warn(`Error obteniendo temporada ${seasonNumber}:`, error)
          continue
        }
      }

      if (seasons.length === 0) {
        throw new Error('No se pudieron obtener las temporadas seleccionadas')
      }

      return {
        id: imdbId,
        title: seriesDetails.Title,
        year: seriesDetails.Year,
        poster: seriesDetails.Poster || 'https://picsum.photos/300/450?text=No+Poster',
        plot: seriesDetails.Plot,
        seasons
      }
    } catch (error) {
      console.error('Error obteniendo datos de la serie:', error)
      throw error
    }
  }
}

export default OMDBService
