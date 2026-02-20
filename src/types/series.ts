export interface Episode {
  id: string
  title: string
  episode: number
  season: number
  image: string
  description: string
}

export interface Season {
  seasonNumber: number
  episodes: Episode[]
}

export interface Series {
  id: string
  title: string
  year?: string
  poster: string
  plot: string
  seasons: Season[]
}

export interface SeriesData {
  [seriesId: string]: Series
}
