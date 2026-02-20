import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { seriesApi } from '../services/api'

type AdminPanelProps = {
  onSeriesAdded: () => void
}

const TVMAZE_BASE_URL = 'https://api.tvmaze.com'

const STORAGE_KEY = 'guesseries-series-v2'
const BACKUP_KEY = 'guesseries-series-backup'
const SESSION_KEY = 'guesseries-admin-session'
const SESSION_DURATION = 10 * 60 * 1000 // 10 minutos en milisegundos

export default function AdminPanel({ onSeriesAdded }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [selectedSeries, setSelectedSeries] = useState<any>(null)
  const [selectedSeasons, setSelectedSeasons] = useState<number[]>([])
  const [savedSeries, setSavedSeries] = useState<any[]>([])
  const [editingEpisode, setEditingEpisode] = useState<any>(null)
  const [editingSeriesPoster, setEditingSeriesPoster] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ADMIN_PASSWORD = 'admin123'

  // Verificar si la sesión está activa
  const checkSession = () => {
    const sessionData = localStorage.getItem(SESSION_KEY)
    if (sessionData) {
      const { timestamp } = JSON.parse(sessionData)
      const now = Date.now()
      if (now - timestamp < SESSION_DURATION) {
        setIsAuthenticated(true)
        return true
      } else {
        // Sesión expirada, limpiar
        localStorage.removeItem(SESSION_KEY)
        setIsAuthenticated(false)
        return false
      }
    }
    return false
  }

  // Iniciar sesión
  const startSession = () => {
    const sessionData = {
      timestamp: Date.now()
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
    setIsAuthenticated(true)
  }

  // Verificar sesión periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      checkSession()
    }, 60000) // Verificar cada minuto

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Verificar sesión al cargar el componente
    checkSession()
    
    console.log('🔍 === CARGANDO DATOS ===')
    
    // Cargar desde la API
    const loadSeries = async () => {
      try {
        const series = await seriesApi.getAllSeries()
        console.log('🔍 Series from API:', series.length)
        
        const valid = series.filter((s: any) => s && s.id && s.title)
        console.log('🔍 Valid series:', valid.length)
        
        if (valid.length > 0) {
          setSavedSeries(valid)
        } else {
          setSavedSeries([])
        }
      } catch (e) {
        console.error('❌ API error:', e)
        // Fallback a localStorage
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          const valid = parsed.filter((s: any) => s && s.id && s.title)
          setSavedSeries(valid)
        } else {
          setSavedSeries([])
        }
      }
    }
    
    loadSeries()
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      startSession()
      setError('')
    } else {
      setError('Contraseña incorrecta')
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    try {
      console.log('=== INICIANDO BÚSQUEDA ===')
      console.log('Query:', searchQuery)
      
      const response = await fetch(`${TVMAZE_BASE_URL}/search/shows?q=${encodeURIComponent(searchQuery)}`)
      console.log('URL búsqueda:', `${TVMAZE_BASE_URL}/search/shows?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      console.log('Respuesta completa:', data)
      
      if (data && data.length > 0) {
        console.log('Resultados encontrados:', data.length)
        setSearchResults(data)
      } else {
        console.log('No se encontraron resultados')
        setError('No se encontraron resultados')
      }
    } catch (err) {
      console.error('Error en búsqueda:', err)
      setError('Error al buscar series')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSeries = async (showId: number) => {
    setLoading(true)
    setError('')
    try {
      console.log('=== SELECCIONANDO SERIE ===')
      console.log('Show ID:', showId)
      
      const response = await fetch(`${TVMAZE_BASE_URL}/shows/${showId}?embed=seasons`)
      console.log('URL serie:', `${TVMAZE_BASE_URL}/shows/${showId}?embed=seasons`)
      const data = await response.json()
      console.log('Datos serie:', data)
      
      if (data) {
        setSelectedSeries(data)
        setSelectedSeasons([])
      } else {
        setError('Error al cargar detalles de la serie')
      }
    } catch (err) {
      console.error('Error al seleccionar serie:', err)
      setError('Error al cargar detalles de la serie')
    } finally {
      setLoading(false)
    }
  }

  const toggleSeasonSelection = (seasonNumber: number) => {
    setSelectedSeasons(prev => 
      prev.includes(seasonNumber) 
        ? prev.filter(s => s !== seasonNumber)
        : [...prev, seasonNumber]
    )
  }

  const handleSaveSeries = async () => {
    if (!selectedSeries || selectedSeasons.length === 0) {
      console.log('No se puede guardar: selectedSeries es null o no hay temporadas seleccionadas')
      return
    }

    setLoading(true)
    setError('')
    try {
      console.log('=== INICIANDO GUARDADO DE SERIE ===')
      console.log('Serie seleccionada:', selectedSeries?.name)
      console.log('ID:', selectedSeries?.id)
      console.log('Temporadas seleccionadas:', selectedSeasons)
      
      const seasons = []
      
      // Obtener todas las temporadas con sus episodios
      const seasonsResponse = await fetch(`${TVMAZE_BASE_URL}/shows/${selectedSeries.id}/seasons`)
      const allSeasons = await seasonsResponse.json()
      console.log('Todas las temporadas (raw):', allSeasons)
      console.log('Tipo de allSeasons:', typeof allSeasons)
      console.log('Es array:', Array.isArray(allSeasons))
      
      if (allSeasons === null || allSeasons === undefined) {
        throw new Error('La API devolvió null/undefined para temporadas')
      }
      
      if (!Array.isArray(allSeasons)) {
        console.error('allSeasons no es un array:', allSeasons)
        throw new Error(`No se pudieron obtener las temporadas. Respuesta: ${JSON.stringify(allSeasons)}`)
      }
      
      if (allSeasons.length === 0) {
        throw new Error('La serie no tiene temporadas disponibles')
      }
      
      // Filtrar solo temporadas válidas
      const validSeasons = allSeasons.filter((s: any) => s && typeof s === 'object' && s.id && s.number)
      console.log('Temporadas válidas:', validSeasons.length)
      
      for (const seasonNumber of selectedSeasons) {
        console.log(`--- Procesando temporada ${seasonNumber} ---`)
        
        // Encontrar la temporada por número usando solo temporadas válidas
        const seasonInfo = validSeasons.find((s: any) => s && s.number === seasonNumber)
        if (!seasonInfo || !seasonInfo.id) {
          console.warn(`Temporada ${seasonNumber} no encontrada o sin ID válido`)
          console.log('Temporadas válidas disponibles:', validSeasons.map((s: any) => ({id: s.id, number: s.number})))
          continue
        }
        
        // Obtener episodios de esta temporada
        const episodesResponse = await fetch(`${TVMAZE_BASE_URL}/seasons/${seasonInfo.id}/episodes`)
        const episodesData = await episodesResponse.json()
        console.log(`Episodios temporada ${seasonNumber}:`, episodesData)
        
        if (episodesData && Array.isArray(episodesData)) {
          const episodes = episodesData.map((ep: any) => ({
            id: `${selectedSeries.id}-S${seasonNumber}E${ep?.number || 0}`,
            title: ep?.name || `Episodio ${ep?.number || 0}`,
            episode: ep?.number || 0,
            season: seasonNumber,
            image: ep?.image?.medium || selectedSeries?.image?.medium || 'https://picsum.photos/300/450?text=No+Poster',
            description: ep?.summary?.replace(/<[^>]*>/g, '') || `Episodio ${ep?.number || 0} de la temporada ${seasonNumber}`
          }))
          
          seasons.push({
            seasonNumber,
            episodes
          })
        }
      }

      console.log('Total temporadas procesadas:', seasons.length)

      if (seasons.length === 0) {
        throw new Error('No se pudieron obtener episodios de ninguna temporada seleccionada')
      }

      const newSeries = {
        id: String(selectedSeries?.id || Date.now()),
        title: selectedSeries?.name || 'Sin título',
        year: selectedSeries?.premiered?.substring(0, 4) || 'N/A',
        poster: selectedSeries?.image?.medium || 'https://picsum.photos/300/450?text=No+Poster',
        plot: selectedSeries?.summary?.replace(/<[^>]*>/g, '') || 'Sin descripción',
        seasons
      }

      console.log('Nueva serie creada:', newSeries)
      console.log('Estructura completa:', JSON.stringify(newSeries, null, 2))
      console.log('Verificación de campos:')
      console.log('- id:', newSeries.id, typeof newSeries.id)
      console.log('- title:', newSeries.title, typeof newSeries.title)
      console.log('- year:', newSeries.year, typeof newSeries.year)
      console.log('- poster:', newSeries.poster ? 'Presente' : 'Ausente')
      console.log('- plot:', newSeries.plot ? 'Presente' : 'Ausente')
      console.log('- seasons:', newSeries.seasons.length, 'temporadas')

      const existingSeries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      console.log('Series existentes antes de guardar:', existingSeries.length)
      
      // Verificar que existingSeries sea un array válido
      if (!Array.isArray(existingSeries)) {
        console.error('existingSeries no es un array:', existingSeries)
        throw new Error('Datos corruptos en localStorage')
      }
      
      // Log para debug de duplicados
      console.log('Buscando duplicado de ID:', newSeries.id)
      console.log('Series existentes con mismo ID:', existingSeries.filter((s: any) => s && s.id === newSeries.id).length)
      
      const updatedSeries = [...existingSeries.filter((s: any) => s && s.id !== newSeries.id), newSeries]
      console.log('Series después de actualizar:', updatedSeries.length)
      
      // Guardar via API
      try {
        await seriesApi.saveSeries(newSeries)
        console.log('✅ Guardado en API:', updatedSeries.length, 'series')
      } catch (apiError) {
        console.error('❌ API Error, fallback to localStorage:', apiError)
        // Fallback a localStorage
        const jsonString = JSON.stringify(updatedSeries)
        localStorage.setItem(STORAGE_KEY, jsonString)
        localStorage.setItem(BACKUP_KEY, jsonString)
      }
      
      console.log('Series guardadas en localStorage:', updatedSeries.length)
      
      setSavedSeries(updatedSeries)
      onSeriesAdded()
      setSelectedSeries(null)
      setSelectedSeasons([])
      setSearchResults(null)
      setSearchQuery('')
    } catch (err) {
      console.error('Error completo al guardar la serie:', err)
      setError(`Error al guardar la serie: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSeries = async (seriesId: string) => {
    try {
      await seriesApi.deleteSeries(seriesId)
      console.log('✅ Serie eliminada de API')
    } catch (apiError) {
      console.error('❌ API Error, fallback to localStorage:', apiError)
      const existingSeries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      const updatedSeries = existingSeries.filter((s: any) => s && s.id !== seriesId)
      const jsonString = JSON.stringify(updatedSeries)
      localStorage.setItem(STORAGE_KEY, jsonString)
      localStorage.setItem(BACKUP_KEY, jsonString)
    }
    
    // Recargar desde API
    try {
      const series = await seriesApi.getAllSeries()
      const valid = series.filter((s: any) => s && s.id && s.title)
      setSavedSeries(valid)
    } catch (e) {
      console.error('❌ Error reloading after delete:', e)
    }
    onSeriesAdded()
  }

  const handleClearAllSeries = async () => {
    if (window.confirm('¿Limpiar todas las series?')) {
      try {
        await seriesApi.clearAllSeries()
        console.log('✅ Todas las series eliminadas de API')
      } catch (apiError) {
        console.error('❌ API Error, fallback to localStorage:', apiError)
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(BACKUP_KEY)
        localStorage.removeItem('guesseries-series')
      }
      setSavedSeries([])
      onSeriesAdded()
    }
  }

  const handleEditEpisodeNew = (episode: any) => {
    setEditingEpisode(episode)
  }

  const handleSaveEpisodeEdit = async () => {
    if (!editingEpisode || !editingEpisode.id) {
      console.log('❌ No episode to save or missing ID')
      return
    }
    
    console.log('💾 Saving episode edit:', editingEpisode.id)
    console.log('💾 Episode has image:', editingEpisode.image ? 'YES' : 'NO')
    
    const updatedSeries = savedSeries.map(series => ({
      ...series,
      seasons: series.seasons.map(season => ({
        ...season,
        episodes: season.episodes.map(ep => 
          ep && ep.id === editingEpisode.id ? editingEpisode : ep
        )
      }))
    }))
    
    // Guardar cada serie modificada en la API
    try {
      for (const series of updatedSeries) {
        await seriesApi.saveSeries(series)
      }
      console.log('✅ Episode saved via API')
    } catch (apiError) {
      console.error('❌ API Error, fallback to localStorage:', apiError)
      const jsonString = JSON.stringify(updatedSeries)
      localStorage.setItem(STORAGE_KEY, jsonString)
      localStorage.setItem(BACKUP_KEY, jsonString)
    }
    
    setSavedSeries(updatedSeries)
    setEditingEpisode(null)
    onSeriesAdded()
  }

  const handleEditSeriesPoster = (series: any) => {
    console.log('🎬 Editing series poster:', series.id, series.title)
    setEditingSeriesPoster({ ...series })
  }

  const handleSeriesPosterImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('📷 Poster upload started:', file?.name, file?.type, file?.size)
    
    if (!file) {
      console.error('❌ No file selected')
      return
    }
    
    if (!editingSeriesPoster) {
      console.error('❌ No series being edited')
      return
    }

    const reader = new FileReader()
    
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error)
    }
    
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      console.log('📷 Poster base64 generated:', base64?.substring(0, 50) + '...')
      console.log('📷 Poster base64 length:', base64?.length)
      
      if (base64) {
        setEditingSeriesPoster({ ...editingSeriesPoster, poster: base64 })
        console.log('✅ Poster image set on series')
      } else {
        console.error('❌ Failed to generate base64 for poster')
      }
    }
    
    reader.readAsDataURL(file)
  }

  const handleSaveSeriesPoster = async () => {
    if (!editingSeriesPoster || !editingSeriesPoster.id) {
      console.log('❌ No series poster to save or missing ID')
      return
    }
    
    console.log('💾 Saving series poster:', editingSeriesPoster.id)
    
    const updatedSeries = savedSeries.map(series => 
      series.id === editingSeriesPoster.id ? editingSeriesPoster : series
    )
    
    // Guardar en API
    try {
      await seriesApi.saveSeries(editingSeriesPoster)
      console.log('✅ Series poster saved via API')
    } catch (apiError) {
      console.error('❌ API Error, fallback to localStorage:', apiError)
      const jsonString = JSON.stringify(updatedSeries)
      localStorage.setItem(STORAGE_KEY, jsonString)
      localStorage.setItem(BACKUP_KEY, jsonString)
    }
    
    setSavedSeries(updatedSeries)
    setEditingSeriesPoster(null)
    onSeriesAdded()
  }

  const handleCancelSeriesPosterEdit = () => {
    setEditingSeriesPoster(null)
  }

  const handleCancelEdit = () => {
    setEditingEpisode(null)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('📷 Image upload started:', file?.name, file?.type, file?.size)
    
    if (!file) {
      console.error('❌ No file selected')
      return
    }
    
    if (!editingEpisode) {
      console.error('❌ No episode being edited')
      return
    }

    const reader = new FileReader()
    
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error)
    }
    
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      console.log('📷 Base64 generated:', base64?.substring(0, 50) + '...')
      console.log('📷 Base64 length:', base64?.length)
      
      if (base64) {
        setEditingEpisode({ ...editingEpisode, image: base64 })
        console.log('✅ Image set on episode')
      } else {
        console.error('❌ Failed to generate base64')
      }
    }
    
    reader.readAsDataURL(file)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-md w-full"
        >
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Panel Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-300"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg">
              Ingresar
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Buscador */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6"
        >
          <h1 className="text-3xl font-bold text-white mb-6">Agregar Nueva Serie</h1>
          
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar serie..."
              className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-300"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          {/* Resultados de búsqueda */}
          {searchResults && Array.isArray(searchResults) && searchResults.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Resultados</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {searchResults.map((result) => (
                  <motion.div
                    key={result.show.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 border border-white/20 rounded-lg p-4 cursor-pointer hover:bg-white/10"
                    onClick={() => handleSelectSeries(result.show.id)}
                  >
                    <img 
                      src={result.show.image?.medium || 'https://picsum.photos/300/450?text=No+Poster'} 
                      alt={result.show.name} 
                      className="w-full h-48 object-cover rounded mb-3" 
                    />
                    <h3 className="text-white font-semibold">{result.show.name}</h3>
                    <p className="text-purple-300 text-sm">{result.show.premiered?.substring(0, 4) || 'N/A'}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Detalles de serie seleccionada */}
          {selectedSeries && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <img 
                  src={selectedSeries.image?.medium || 'https://picsum.photos/300/450?text=No+Poster'} 
                  alt={selectedSeries.name} 
                  className="w-32 h-48 object-cover rounded-lg" 
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedSeries.name}</h2>
                  <p className="text-purple-200 mb-4">{selectedSeries.summary?.replace(/<[^>]*>/g, '') || 'Sin descripción'}</p>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">Seleccionar Temporadas:</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedSeries._embedded?.seasons?.map((season: any) => (
                      <button
                        key={season.id}
                        onClick={() => toggleSeasonSelection(season.number)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedSeasons.includes(season.number)
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-purple-200 border border-white/20 hover:bg-white/10'
                        }`}
                      >
                        Temporada {season.number}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleSaveSeries}
                    disabled={loading || selectedSeasons.length === 0}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar Serie'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Series guardadas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Series Guardadas</h2>
            <button
              onClick={handleClearAllSeries}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Limpiar Todo
            </button>
          </div>

          {savedSeries.length === 0 ? (
            <p className="text-purple-300">No hay series guardadas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSeries.filter((s): s is NonNullable<typeof s> => s != null).map((series) => (
                <motion.div
                  key={series.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 border border-white/20 rounded-lg p-4"
                >
                  <img src={series?.poster || 'https://picsum.photos/300/450?text=No+Poster'} alt={series?.title || 'Serie'} className="w-full h-48 object-cover rounded mb-3" />
                  <button
                    onClick={() => handleEditSeriesPoster(series)}
                    className="mb-2 w-full py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Editar Poster
                  </button>
                  <h3 className="font-semibold text-white">{series?.title || 'Sin título'}</h3>
                  <p className="text-purple-300 text-sm">{series?.seasons?.length || 0} temporadas</p>
                  <button
                    onClick={() => handleDeleteSeries(series?.id)}
                    className="mt-3 w-full py-2 bg-red-600 text-white text-sm rounded"
                  >
                    Eliminar Serie
                  </button>
                  
                  {/* Episodios editables */}
                  <div className="mt-4 space-y-3">
                    {series?.seasons?.map((season: any) => (
                      <div key={season?.seasonNumber} className="border-t border-white/10 pt-2">
                        <h4 className="text-white text-sm font-medium mb-2">Temporada {season?.seasonNumber}</h4>
                        {season?.episodes?.map((episode: any) => (
                          <div key={episode?.id} className="flex items-center justify-between py-1">
                            <span className="text-purple-200 text-xs truncate flex-1">{episode?.title || 'Episodio sin título'}</span>
                            <button
                              onClick={() => handleEditEpisodeNew(episode)}
                              className="px-2 py-1 bg-purple-600 text-white text-xs rounded ml-2"
                            >
                              Editar
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Modal de edición de poster de serie */}
        {editingSeriesPoster && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Poster de Serie</h3>
              <p className="text-gray-600 mb-4">{editingSeriesPoster.title}</p>
              
              {editingSeriesPoster.poster && (
                <img src={editingSeriesPoster.poster} alt="" className="w-full h-48 object-cover rounded-lg mb-4" />
              )}
              
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSeriesPosterImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveSeriesPoster}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    Guardar Poster
                  </button>
                  <button
                    onClick={handleCancelSeriesPosterEdit}
                    className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de edición de episodio */}
        {editingEpisode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Episodio</h3>
              
              {editingEpisode.image && (
                <img src={editingEpisode.image} alt="" className="w-full h-32 object-cover rounded-lg mb-4" />
              )}
              
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={editingEpisode.title}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Título"
                />
                <textarea
                  value={editingEpisode.description}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Descripción"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={handleCancelEdit} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button onClick={handleSaveEpisodeEdit} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Guardar</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
