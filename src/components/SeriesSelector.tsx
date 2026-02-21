import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Series, getLocalizedText } from '../types/series'
import LanguageSelector from './LanguageSelector'
import { getTranslation } from '../utils/translations'

interface SeriesSelectorProps {
  series: Series[]
  onSeriesSelect: (series: Series, seasonNumber: number) => void
  currentLanguage?: 'en' | 'es'
  onLanguageChange?: (language: 'en' | 'es') => void
}

export default function SeriesSelector({ series, onSeriesSelect, currentLanguage = 'en', onLanguageChange }: SeriesSelectorProps) {
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [showSeasonModal, setShowSeasonModal] = useState<Series | null>(null)
  const [language, setLanguage] = useState<'en' | 'es'>(currentLanguage)

  // Cargar preferencia de idioma desde localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('guesseries-language') as 'en' | 'es' | null
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Sincronizar con el prop currentLanguage si cambia
  useEffect(() => {
    if (currentLanguage !== language) {
      setLanguage(currentLanguage)
    }
  }, [currentLanguage])

  const handleSeriesSelect = (series: Series) => {
    setSelectedSeries(series)
  }

  const handleSeasonSelect = (seasonNumber: number) => {
    if (selectedSeries) {
      onSeriesSelect(selectedSeries, seasonNumber)
      setShowSeasonModal(null)
    }
  }

  const handlePlay = (series: Series) => {
    setShowSeasonModal(series)
  }

  const closeModal = () => {
    setShowSeasonModal(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Selector de idiomas flotante a la izquierda */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
        <LanguageSelector 
          currentLanguage={language} 
          onLanguageChange={setLanguage}
        />
      </div>
      
      {/* Título de la página */}
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-6xl font-bold text-white mb-8 tracking-tight text-center"
      >
        {getTranslation('guesseries', language)}
      </motion.h1>
      
      <div className="max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8"
        >
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-semibold text-purple-200 mb-8 text-center"
          >
            {getTranslation('selectSeries', language)}
          </motion.h1>
          
          {series.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-purple-300 mb-4">
                {getTranslation('noSeriesAvailable', language)}
              </p>
              <p className="text-purple-200">
                {getTranslation('contactAdmin', language)}
              </p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {series.filter((s): s is NonNullable<typeof s> => s != null).map((s) => (
                <div key={s.id} className="contents">
                  <motion.div
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
                        alt={getLocalizedText(s.title, language)}
                        className="w-32 h-48 object-cover rounded-lg mb-4"
                      />
                      <h3 className="text-xl font-bold text-white mb-2">{getLocalizedText(s.title, language)}</h3>
                      {selectedSeries?.id === s.id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlay(s)
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                        >
                          {getTranslation('play', language)}
                        </button>
                      ) : (
                        <>
                          <p className="text-purple-300 text-sm mb-2">{s.year}</p>
                          <p className="text-purple-200 text-xs">{s.seasons.length} {getTranslation('seasons', language)}</p>
                        </>
                      )}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
            </>
          )}
        </motion.div>
      </div>
      
      {/* Season Modal */}
      {showSeasonModal && (
        <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={closeModal}
      >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-2xl border-2 border-purple-400/50 p-8 mx-4 max-w-2xl w-full shadow-2xl"
          >
            <div className="flex gap-6">
              {/* Poster on the left */}
              <div className="flex-shrink-0">
                <img
                  src={showSeasonModal.poster}
                  alt={getLocalizedText(showSeasonModal.title, language)}
                  className="w-48 h-72 object-cover rounded-lg"
                />
              </div>
              
              {/* Content on the right */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {getLocalizedText(showSeasonModal.title, language)}
                    </h2>
                    <p className="text-purple-200">
                      {showSeasonModal.year} • {showSeasonModal.seasons.length} {getTranslation('seasons', language)}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div>
                  <label className="block text-lg font-medium text-purple-200 mb-4">
                    {getTranslation('selectSeason', language)}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {showSeasonModal.seasons.map((season) => (
                      <button
                        key={season.seasonNumber}
                        onClick={() => handleSeasonSelect(season.seasonNumber)}
                        className="px-4 py-3 rounded-lg font-medium transition-all bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-600 text-white"
                      >
                        {getTranslation('season', language)} {season.seasonNumber}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
