import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Series } from './types/series'
import Guesseries from './components/Guesseries'
import SeriesSelector from './components/SeriesSelector'
import AdminPanel from './components/AdminPanel'
import { seriesApi } from './services/api'

const STORAGE_KEY = 'guesseries-series-v2'
const BACKUP_KEY = 'guesseries-series-backup'

function App() {
  const [currentSeries, setCurrentSeries] = useState<Series | null>(null)
  const [currentSeason, setCurrentSeason] = useState<number>(1)
  const [availableSeries, setAvailableSeries] = useState<Series[]>([])
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    // Cargar series desde la API
    const loadSeries = async () => {
      try {
        const series = await seriesApi.getAllSeries()
        const valid = series.filter((s: any) => s && s.id && s.title)
        setAvailableSeries(valid)
      } catch (error) {
        console.error('Error loading series:', error)
        setAvailableSeries([])
      }
    }
    loadSeries()
  }, [])

  const handleSeriesSelect = (series: Series, seasonNumber: number) => {
    setCurrentSeries(series)
    setCurrentSeason(seasonNumber)
    setGameStarted(true)
  }

  const handleBackToMenu = () => {
    setGameStarted(false)
    setCurrentSeries(null)
    setCurrentSeason(1)
  }

  const handleSeriesAdded = async () => {
    // Recargar desde la API
    try {
      const series = await seriesApi.getAllSeries()
      const valid = series.filter((s: any) => s && s.id && s.title)
      setAvailableSeries(valid)
    } catch (error) {
      console.error('Error reloading series:', error)
    }
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Routes>
          <Route path="/" element={
            !gameStarted ? (
              <SeriesSelector 
                series={availableSeries}
                onSeriesSelect={handleSeriesSelect}
              />
            ) : (
              <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-6xl">
                  <Guesseries 
                    series={currentSeries}
                    season={currentSeason}
                    onBackToMenu={handleBackToMenu}
                  />
                </div>
              </div>
            )
          } />
          <Route path="/admin" element={<AdminPanel onSeriesAdded={handleSeriesAdded} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
