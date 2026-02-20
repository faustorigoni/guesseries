import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Series } from '../types/series'

interface SeriesSelectorProps {
  series: Series[]
  onSeriesSelect: (series: Series, seasonNumber: number) => void
}

export default function SeriesSelector({ series, onSeriesSelect }: SeriesSelectorProps) {
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<number>(1)

  const handleSeriesSelect = (series: Series) => {
    setSelectedSeries(series)
    setSelectedSeason(1)
  }

  const handleSeasonSelect = (seasonNumber: number) => {
    if (selectedSeries) {
      onSeriesSelect(selectedSeries, seasonNumber)
    }
  }

  const handlePlay = () => {
    if (selectedSeries) {
      onSeriesSelect(selectedSeries, selectedSeason)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8"
        >
          {/* Enlace al panel de administración */}
          <div className="flex justify-end mb-4">
            <Link
              to="/admin"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
            >
              Panel de Administración
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Selecciona una Serie</h1>
          
          {series.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-purple-300 mb-4">
                No hay series disponibles todavía.
              </p>
              <p className="text-purple-200">
                Contacta al administrador para agregar series al juego.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {series.filter((s): s is NonNullable<typeof s> => s != null).map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`bg-white/5 border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    selectedSeries?.id === s.id 
                      ? 'border-purple-400 bg-purple-500/20' 
                      : 'border-white/20 hover:border-purple-300 hover:bg-white/10'
                  }`}
                  onClick={() => handleSeriesSelect(s)}
                >
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={s.poster}
                      alt={s.title}
                      className="w-32 h-48 object-cover rounded-lg mb-4"
                    />
                    <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                    <p className="text-purple-300 text-sm mb-2">{s.year}</p>
                    <p className="text-purple-200 text-xs">{s.seasons.length} temporadas</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {selectedSeries && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/20 rounded-xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                {selectedSeries.title}
              </h2>
              
              <div className="mb-6">
                <label className="block text-lg font-medium text-purple-200 mb-3">
                  Selecciona una temporada:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {selectedSeries.seasons.map((season) => (
                    <button
                      key={season.seasonNumber}
                      onClick={() => setSelectedSeason(season.seasonNumber)}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        selectedSeason === season.seasonNumber
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-purple-300 hover:bg-white/20'
                      }`}
                    >
                      Temporada {season.seasonNumber}
                      <span className="block text-xs mt-1">
                        {season.episodes.length} episodios
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handlePlay}
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl transition-colors"
                >
                  Jugar con Temporada {selectedSeason}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
