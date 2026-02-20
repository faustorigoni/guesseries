import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Series } from './types/series'
import Guesseries from './components/Guesseries'
import SeriesSelector from './components/SeriesSelector'
import AdminPanel from './components/AdminPanel'

const STORAGE_KEY = 'guesseries-series-v2'
const BACKUP_KEY = 'guesseries-series-backup'

function App() {
  const [currentSeries, setCurrentSeries] = useState<Series | null>(null)
  const [currentSeason, setCurrentSeason] = useState<number>(1)
  const [availableSeries, setAvailableSeries] = useState<Series[]>([])
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    // Cargar series guardadas del localStorage
    let stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      stored = localStorage.getItem(BACKUP_KEY)
    }
    if (stored) {
      const series = JSON.parse(stored)
      const valid = series.filter((s: any) => s && s.id && s.title)
      setAvailableSeries(valid)
    }
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

  const handleSeriesAdded = () => {
    // Recargar desde localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const series = JSON.parse(stored)
      const valid = series.filter((s: any) => s && s.id && s.title)
      setAvailableSeries(valid)
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
