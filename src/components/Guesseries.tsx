import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { paquitaSalasEpisodes, Episode } from '../data/episodes'
import { Series, getLocalizedText } from '../types/series'
import { playCorrectSound, playIncorrectSound } from '../utils/sounds'
import LanguageSelector from './LanguageSelector'
import { getTranslation } from '../utils/translations'

type CheckResult = 'correct' | 'incorrect' | null

interface GuesseriesProps {
  series?: Series | null
  season?: number
  onBackToMenu?: () => void
  currentLanguage: 'en' | 'es'
  onLanguageChange: (language: 'en' | 'es') => void
}

function Guesseries({ series, season = 1, onBackToMenu, currentLanguage, onLanguageChange }: GuesseriesProps) {
  // Usar episodios de la serie proporcionada
  const currentSeriesEpisodes = series ? 
    series.seasons.find(s => s.seasonNumber === season)?.episodes || [] :
    paquitaSalasEpisodes
  
  // Mezclar los episodios
  const [shuffledEpisodes, setShuffledEpisodes] = useState(() => 
    [...currentSeriesEpisodes].sort(() => Math.random() - 0.5)
  )
  
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0)
  const [editingEpisodes, setEditingEpisodes] = useState<any[]>([])
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [orderedEpisodes, setOrderedEpisodes] = useState<(Episode | null)[]>(Array(currentSeriesEpisodes.length).fill(null))
  const [draggedEpisode, setDraggedEpisode] = useState<Episode | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [episodePlaced, setEpisodePlaced] = useState(false)
  const [checkResults, setCheckResults] = useState<CheckResult[]>(Array(currentSeriesEpisodes.length).fill(null))
  const [isChecking, setIsChecking] = useState(false)
  const [draggedFromSlot, setDraggedFromSlot] = useState<number | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [isOverCarousel, setIsOverCarousel] = useState(false)
  const [score, setScore] = useState(0)
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showScore, setShowScore] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [finalMultiplier, setFinalMultiplier] = useState(2.0)
  const hasCheckedRef = useRef(false)
  
  const languages = [
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w40/es.png' }
  ]

  // Actualizar episodios cuando cambia la serie o temporada
  useEffect(() => {
    const episodes = series ? 
      series.seasons.find(s => s.seasonNumber === season)?.episodes || [] :
      paquitaSalasEpisodes
    
    setShuffledEpisodes([...episodes].sort(() => Math.random() - 0.5))
    setCurrentEpisodeIndex(0)
    // Resetear el juego con el nuevo número de episodios
    setEditingEpisodes(Array(episodes.length).fill(null))
    setImageErrors(new Set())
    setOrderedEpisodes(Array(episodes.length).fill(null))
    setCheckResults(Array(episodes.length).fill(null))
    setEpisodePlaced(false)
    setDraggedEpisode(null)
    setDragOverSlot(null)
    setIsDragging(false)
    setDraggedFromSlot(null)
    setShowResetModal(false)
    setDragPosition({ x: 0, y: 0 })
    setIsOverCarousel(false)
    setScore(0)
    setGameStartTime(null)
    setElapsedTime(0)
    setShowScore(false)
    setGameFinished(false)
    setFinalMultiplier(2.0)
    hasCheckedRef.current = false
  }, [series, season])

  const currentEpisode = shuffledEpisodes[currentEpisodeIndex]

  // Determinar el número de columnas del grid según el número de episodios
  const getGridCols = (episodeCount: number) => {
    if (episodeCount <= 3) return 'md:grid-cols-3'
    if (episodeCount <= 5) return 'md:grid-cols-5'
    if (episodeCount <= 8) return 'md:grid-cols-4'
    if (episodeCount <= 12) return 'md:grid-cols-6'
    return 'md:grid-cols-8'
  }

  const handleImageError = (episodeId: string) => {
    setImageErrors(prev => new Set([...prev, episodeId]))
  }

  const getEpisodeImage = (episode: any) => {
    // Si la imagen usa la URL vieja que no funciona, reemplazarla
    if (episode.image && episode.image.includes('via.placeholder.com')) {
      return `https://picsum.photos/300/450?text=Episodio+${episode.episode || episode.number || Math.random()}`
    }
    
    if (imageErrors.has(episode.id)) {
      // Usar imagen de fallback si hay error
      return `https://picsum.photos/300/450?text=Episodio+${episode.episode || episode.number || Math.random()}`
    }
    
    // Permitir todas las imágenes reales (OMDb, TVMaze, etc.)
    console.log('🖼️ Imagen del episodio:', episode.image)
    return episode.image
  }

  const nextEpisode = () => {
    const currentIndex = shuffledEpisodes.findIndex(ep => ep.id === currentEpisode.id)
    let nextIndex = (currentIndex + 1) % shuffledEpisodes.length
    // Buscar el siguiente episodio que no esté en los slots
    let attempts = 0
    while (orderedEpisodes.some(ep => ep && ep.id === shuffledEpisodes[nextIndex].id) && attempts < shuffledEpisodes.length) {
      nextIndex = (nextIndex + 1) % shuffledEpisodes.length
      attempts++
    }
    setCurrentEpisodeIndex(nextIndex)
  }

  const prevEpisode = () => {
    const currentIndex = shuffledEpisodes.findIndex(ep => ep.id === currentEpisode.id)
    let prevIndex = (currentIndex - 1 + shuffledEpisodes.length) % shuffledEpisodes.length
    // Buscar el episodio anterior que no esté en los slots
    let attempts = 0
    while (orderedEpisodes.some(ep => ep && ep.id === shuffledEpisodes[prevIndex].id) && attempts < shuffledEpisodes.length) {
      prevIndex = (prevIndex - 1 + shuffledEpisodes.length) % shuffledEpisodes.length
      attempts++
    }
    setCurrentEpisodeIndex(prevIndex)
  }

  const handleDragStart = (e: React.DragEvent, episode: Episode) => {
    if (gameFinished) return
    setDraggedEpisode(episode)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    // Crear una imagen personalizada para el drag
    const dragImage = document.createElement('div')
    dragImage.style.width = '200px'
    dragImage.style.height = '150px'
    dragImage.style.background = `url(${episode.image}) center/cover`
    dragImage.style.borderRadius = '12px'
    dragImage.style.opacity = '0'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 100, 75)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }
  
  // Verificar si el episodio actual ya está en algún espacio ordenado
  const isCurrentEpisodeInSlots = orderedEpisodes.some(
    ep => ep && ep.id === currentEpisode.id
  )
  
  // Obtener episodios disponibles (que no están en los espacios)
  const availableEpisodes = shuffledEpisodes.filter(
    ep => !orderedEpisodes.some(orderedEp => orderedEp && orderedEp.id === ep.id)
  )
  
  // Encontrar el siguiente episodio disponible si el actual se arrastra
  const getNextAvailableEpisode = () => {
    if (availableEpisodes.length === 0) return null
    const currentIndex = availableEpisodes.findIndex(ep => ep.id === currentEpisode.id)
    if (currentIndex === -1) return availableEpisodes[0]
    return availableEpisodes[(currentIndex + 1) % availableEpisodes.length]
  }

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSlot(slotIndex)
  }

  const handleDragLeave = () => {
    setDragOverSlot(null)
  }

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    
    if (!draggedEpisode) return
    
    const newOrdered = [...orderedEpisodes]
    let replacedEpisode: Episode | null = null
    
    // Si se arrastra desde un slot (intercambio o movimiento)
    if (draggedFromSlot !== null) {
      const sourceEpisode = newOrdered[draggedFromSlot]
      const targetEpisode = newOrdered[slotIndex]
      
      // Si es el mismo slot, no hacer nada
      if (draggedFromSlot === slotIndex) {
        setDragOverSlot(null)
        setDraggedFromSlot(null)
        setIsDragging(false)
        setDraggedEpisode(null)
        return
      }
      
      // Intercambio de posiciones
      newOrdered[draggedFromSlot] = targetEpisode
      newOrdered[slotIndex] = sourceEpisode
    } else {
      // Arrastre desde arriba (nueva tarjeta)
      // Guardar la tarjeta que será reemplazada
      replacedEpisode = newOrdered[slotIndex]
      
      // Colocar la nueva tarjeta
      newOrdered[slotIndex] = draggedEpisode
      
      // Si había una tarjeta en ese lugar, hacer que vuelva arriba
      if (replacedEpisode) {
        // Cambiar al episodio reemplazado para que aparezca arriba
        const replacedIndex = shuffledEpisodes.findIndex(ep => ep.id === replacedEpisode!.id)
        if (replacedIndex !== -1) {
          setCurrentEpisodeIndex(replacedIndex)
        }
      } else {
        // Si el episodio arrastrado es el que está mostrado, cambiar al siguiente disponible
        if (draggedEpisode.id === currentEpisode.id) {
          const nextEpisode = getNextAvailableEpisode()
          if (nextEpisode) {
            const nextIndex = shuffledEpisodes.findIndex(ep => ep.id === nextEpisode.id)
            if (nextIndex !== -1) {
              setCurrentEpisodeIndex(nextIndex)
            }
          }
        }
      }
    }
    
    setOrderedEpisodes(newOrdered)
    setDragOverSlot(null)
    setIsDragging(false)
    setEpisodePlaced(true)
    setDraggedFromSlot(null)
    
    // Resetear resultados si había comprobación previa
    if (checkResults.some(r => r !== null)) {
      setCheckResults(Array(currentSeriesEpisodes.length).fill(null))
      hasCheckedRef.current = false
    }
    
    // Limpiar después de un pequeño delay para permitir la animación
    setTimeout(() => {
      setDraggedEpisode(null)
      setEpisodePlaced(false)
    }, 100)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    // Solo limpiar el estado si no se colocó en ningún lugar
    // El handleDrop ya maneja cuando se coloca correctamente
    if (!episodePlaced) {
      // Si se arrastra desde arriba y no se colocó, restaurar la visibilidad
      if (draggedFromSlot === null) {
        setIsDragging(false)
      }
      // Si se arrastra desde un slot y no se colocó, la tarjeta ya está visible
      setDraggedEpisode(null)
    }
    
    setDragOverSlot(null)
    setDraggedFromSlot(null)
    setIsDragging(false)
    setDragPosition({ x: 0, y: 0 })
    setIsOverCarousel(false)
    
    // Resetear episodePlaced después de un pequeño delay
    setTimeout(() => {
      setEpisodePlaced(false)
    }, 150)
  }

  const handleSlotDragStart = (e: React.DragEvent, episode: Episode, slotIndex: number) => {
    setDraggedEpisode(episode)
    setDraggedFromSlot(slotIndex)
    setIsDragging(true)
    setDragPosition({ x: e.clientX, y: e.clientY })
    e.dataTransfer.effectAllowed = 'move'
    // Crear una imagen personalizada para el drag
    const dragImage = document.createElement('div')
    dragImage.style.width = '200px'
    dragImage.style.height = '150px'
    dragImage.style.background = `url(${episode.image}) center/cover`
    dragImage.style.borderRadius = '12px'
    dragImage.style.opacity = '0'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 100, 75)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  useEffect(() => {
    if (draggedFromSlot === null) {
      setDragPosition({ x: 0, y: 0 })
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      setDragPosition({ x: e.clientX, y: e.clientY })
    }

    const handleDrag = (e: DragEvent) => {
      if (e.clientX && e.clientY) {
        setDragPosition({ x: e.clientX, y: e.clientY })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('drag', handleDrag)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('drag', handleDrag)
    }
  }, [draggedFromSlot])

  const removeFromSlot = (slotIndex: number) => {
    if (isChecking || gameFinished) return
    const newOrdered = [...orderedEpisodes]
    const removedEpisode = newOrdered[slotIndex]
    newOrdered[slotIndex] = null
    setOrderedEpisodes(newOrdered)
    
    // Si se eliminó una tarjeta, cambiar al episodio eliminado si está disponible
    if (removedEpisode) {
      const removedIndex = shuffledEpisodes.findIndex(ep => ep.id === removedEpisode.id)
      if (removedIndex !== -1) {
        setCurrentEpisodeIndex(removedIndex)
      }
    }
    
    // Resetear el resultado de la comprobación
    setCheckResults(prev => {
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
  }

  const resetGame = () => {
    if (isChecking) return
    setShowResetModal(true)
  }

  const confirmReset = () => {
    // Mezclar los episodios aleatoriamente
    const newShuffledEpisodes = [...currentSeriesEpisodes].sort(() => Math.random() - 0.5)
    setShuffledEpisodes(newShuffledEpisodes)
    
    setOrderedEpisodes(Array(currentSeriesEpisodes.length).fill(null))
    setCheckResults(Array(currentSeriesEpisodes.length).fill(null))
    setCurrentEpisodeIndex(0)
    setDraggedEpisode(null)
    setDragOverSlot(null)
    setIsDragging(false)
    setEpisodePlaced(false)
    setIsChecking(false)
    setScore(0)
    setGameStartTime(null)
    setElapsedTime(0)
    setShowScore(false)
    setGameFinished(false)
    setFinalMultiplier(2.0)
    hasCheckedRef.current = false
    setShowResetModal(false)
  }

  const cancelReset = () => {
    setShowResetModal(false)
  }

  // Comprobar cuando todas las tarjetas están colocadas
  const allPlaced = orderedEpisodes.every(ep => ep !== null)

  // Temporizador para contar el tiempo transcurrido
  useEffect(() => {
    if (!gameStartTime || isChecking || showScore || gameFinished) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStartTime, isChecking, showScore, gameFinished])

  // Iniciar temporizador cuando se coloca la primera tarjeta
  useEffect(() => {
    const hasAnyCard = orderedEpisodes.some(ep => ep !== null)
    if (hasAnyCard && !gameStartTime) {
      setGameStartTime(Date.now())
    }
  }, [orderedEpisodes, gameStartTime])

  // Calcular multiplicador basado en el tiempo
  const calculateMultiplier = (timeInSeconds: number) => {
    const multiplier = 2.0 - (Math.floor(timeInSeconds / 5) * 0.1)
    return Math.max(1.0, multiplier)
  }

  const handleCheckAnswers = async () => {
    if (!allPlaced || isChecking || showScore) return

    const episodesToCheck = [...orderedEpisodes]
    hasCheckedRef.current = true

    setIsChecking(true)
    setCheckResults(Array(currentSeriesEpisodes.length).fill(null))
    let baseScore = 0

    for (let i = 0; i < currentSeriesEpisodes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 250))
      const episode = episodesToCheck[i]
      if (!episode) continue

      const isCorrect = episode.episode === i + 1
      setCheckResults(prev => {
        const next = [...prev]
        next[i] = isCorrect ? 'correct' : 'incorrect'
        return next
      })

      if (isCorrect) {
        baseScore += 10
        playCorrectSound()
      } else {
        baseScore = Math.max(0, baseScore - 5)
        playIncorrectSound()
      }
    }

    const finalTime = elapsedTime
    const multiplier = calculateMultiplier(finalTime)
    const finalScore = Math.round(baseScore * multiplier)
    
    setScore(finalScore)
    setFinalMultiplier(multiplier)
    setElapsedTime(finalTime) // Congelar el tiempo
    setShowScore(true)
    setGameFinished(true)
    setGameStartTime(null) // Detener completamente el tiempo
    setIsChecking(false)
  }

  // Resetear cuando se quita una tarjeta para permitir comprobar de nuevo
  useEffect(() => {
    if (!allPlaced) {
      hasCheckedRef.current = false
      setCheckResults(Array(currentSeriesEpisodes.length).fill(null))
    }
  }, [allPlaced])

  return (
    <main className="min-h-screen flex flex-col items-center p-6 md:p-8">
      {/* Selector de idiomas flotante a la izquierda */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
        <LanguageSelector 
          currentLanguage={currentLanguage} 
          onLanguageChange={onLanguageChange}
        />
      </div>
      
      <div className="w-full max-w-6xl relative">
        {/* Botón volver al menú */}
        {onBackToMenu && (
          <button
            onClick={onBackToMenu}
            className="absolute top-0 left-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
          >
            {getTranslation('backToMenu', currentLanguage)}
          </button>
        )}

        {/* Botón reiniciar arriba a la derecha */}
        <button
          onClick={resetGame}
          disabled={isChecking}
          className="absolute top-0 right-0 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          {getTranslation('reset', currentLanguage)}
        </button>

        {/* Tiempo flotante durante el juego */}
        {gameStartTime && !showScore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-4 right-4 bg-black/80 backdrop-blur-md rounded-xl border border-white/20 px-4 py-3 shadow-2xl z-50"
          >
            <p className="text-lg font-bold text-white">
              <span className="text-yellow-400">{Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
            </p>
            <p className="text-xs text-purple-300">
              <span className="text-green-400">{calculateMultiplier(elapsedTime).toFixed(1)}x</span>
            </p>
          </motion.div>
        )}

        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-white mb-2 tracking-tight text-center"
        >
          {getTranslation('guesseries', currentLanguage)}
        </motion.h1>
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-purple-200 mb-8 text-center"
        >
          {series ? `${getLocalizedText(series.title, currentLanguage)} - ${getTranslation('season', currentLanguage)} ${season}` : ''}
        </motion.h1>
        
        {/* Tarjeta grande arriba con navegación */}
        <motion.div 
          className="relative"
          animate={{
            height: availableEpisodes.length === 0 ? 0 : 'auto',
            opacity: availableEpisodes.length === 0 ? 0 : 1,
            marginBottom: availableEpisodes.length === 0 ? 24 : 48,
          }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          {/* Área de drop invisible sobre el carrusel para eliminar tarjetas */}
          {draggedFromSlot !== null && (
            <div
              className="absolute inset-0 z-20 cursor-grabbing"
              onDragEnter={(e) => {
                e.preventDefault()
                setIsOverCarousel(true)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setIsOverCarousel(true)
              }}
              onDragLeave={(e) => {
                // Solo ocultar si realmente salimos del área
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX
                const y = e.clientY
                if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                  setIsOverCarousel(false)
                }
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsOverCarousel(false)
                if (draggedFromSlot !== null) {
                  removeFromSlot(draggedFromSlot)
                  setDraggedFromSlot(null)
                  setDraggedEpisode(null)
                  setIsDragging(false)
                  setEpisodePlaced(true)
                  setTimeout(() => {
                    setEpisodePlaced(false)
                  }, 100)
                }
              }}
            />
          )}
          <div className="relative flex items-center justify-center">
            {/* Flecha izquierda */}
            <button
              onClick={prevEpisode}
              className="absolute left-0 z-10 w-12 h-12 md:w-16 md:h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 transition-all hover:scale-110"
              aria-label="Episodio anterior"
            >
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Tarjeta del episodio */}
            <AnimatePresence mode="wait">
              {!isCurrentEpisodeInSlots && (
                <motion.div
                  key={currentEpisode.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ 
                    opacity: isDragging && draggedFromSlot === null ? 0.3 : 1, 
                    x: 0 
                  }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ duration: 0.3 }}
                  draggable={!gameFinished}
                  onDragStart={(e) => handleDragStart(e, currentEpisode)}
                  onDragEnd={(e) => handleDragEnd(e)}
                  className={`relative w-full max-w-3xl bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-2xl cursor-grab active:cursor-grabbing transition-all ${
                    !isCurrentEpisodeInSlots ? 'opacity-70' : 'opacity-100'
                  }`}
                  style={{ aspectRatio: '16/9' }}
                >
                  <div className="relative h-full bg-gradient-to-br from-purple-900 to-slate-900">
                    {getEpisodeImage(currentEpisode) ? (
                    <img
                      src={getEpisodeImage(currentEpisode)}
                      alt={getLocalizedText(currentEpisode.title, currentLanguage)}
                      className="w-full h-full object-cover"
                      draggable={false}
                      onError={(e) => {
                        console.error('Error cargando imagen:', currentEpisode.image)
                        handleImageError(currentEpisode.id)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-slate-900 flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="text-6xl mb-4">🎬</div>
                        <p className="text-white text-lg font-semibold">Episodio</p>
                        <p className="text-purple-300 text-sm mt-2">Sin imagen disponible</p>
                      </div>
                    </div>
                  )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        {getLocalizedText(currentEpisode.title, currentLanguage)}
                      </h2>
                      <p className="text-purple-100 text-base md:text-lg leading-relaxed">
                        {getLocalizedText(currentEpisode.description, currentLanguage)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flecha derecha */}
            <button
              onClick={nextEpisode}
              className="absolute right-0 z-10 w-12 h-12 md:w-16 md:h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 transition-all hover:scale-110"
              aria-label="Siguiente episodio"
            >
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Indicadores de episodio (solo los que aún no están colocados) */}
          {availableEpisodes.length > 0 && (
            <motion.div 
              className="flex justify-center gap-2 mt-4"
              initial={{ opacity: 1 }}
              animate={{ opacity: availableEpisodes.length > 0 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {shuffledEpisodes
                .filter(episode => !orderedEpisodes.some(ep => ep && ep.id === episode.id))
                .map((episode) => {
                  const index = shuffledEpisodes.findIndex(ep => ep.id === episode.id)
                  const isCurrent = episode.id === currentEpisode.id
                  return (
                    <button
                      key={episode.id}
                      onClick={() => setCurrentEpisodeIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        isCurrent ? 'bg-white w-8' : 'bg-white/40'
                      }`}
                      aria-label={`Arrastra aquí: ${getLocalizedText(episode.title, currentLanguage)}`}
                      title={`Episodio: ${getLocalizedText(episode.title, currentLanguage)}`}
                    />
                  )
                })}
            </motion.div>
          )}
        </motion.div>

        {/* Instrucciones */}
        <motion.div 
          className="flex flex-col items-center gap-4 mb-6"
          animate={{
            marginTop: availableEpisodes.length === 0 ? 24 : 0,
          }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="text-lg text-purple-300 text-center">
            {isChecking
              ? getTranslation('checking', currentLanguage)
              : allPlaced
                ? getTranslation('checkResults', currentLanguage)
                : getTranslation('dragToOrder', currentLanguage)}
          </p>
          {allPlaced && !isChecking && !showScore && (
            <div className="flex gap-4">
              <button
                onClick={handleCheckAnswers}
                className="px-6 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-400/50 text-white transition-colors font-semibold"
              >
                {getTranslation('check', currentLanguage)}
              </button>
              <button
                onClick={resetGame}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
              >
                {getTranslation('reset', currentLanguage)}
              </button>
            </div>
          )}
        </motion.div>

        {/* Espacios numerados para ordenar */}
        <div className={`grid grid-cols-1 ${getGridCols(currentSeriesEpisodes.length)} gap-4`}>
          {orderedEpisodes.map((episode, index) => {
            const result = checkResults[index]
            const borderColor = result === 'correct'
              ? 'border-green-500'
              : result === 'incorrect'
                ? 'border-red-500'
                : dragOverSlot === index && !isChecking
                  ? 'border-purple-400'
                  : 'border-white/20'

            const bgColor = result === 'correct'
              ? 'bg-green-500/20'
              : result === 'incorrect'
                ? 'bg-red-500/20'
                : dragOverSlot === index && !isChecking
                  ? 'bg-purple-500/20'
                  : 'bg-white/5'

            return (
              <motion.div
                key={index}
                onDragOver={!isChecking && !showScore && !gameFinished ? (e) => handleDragOver(e, index) : undefined}
                onDragLeave={handleDragLeave}
                onDrop={!isChecking && !showScore && !gameFinished ? (e) => handleDrop(e, index) : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: dragOverSlot === index && !isChecking ? 1.05 : 1,
                }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`relative min-h-[200px] backdrop-blur-sm rounded-xl border-2 border-dashed transition-colors duration-300 ${borderColor} ${bgColor}`}
              >
                {/* Número del espacio */}
                <div className="absolute top-3 left-3 w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center border border-purple-400/30 z-10">
                  <span className="text-lg font-bold text-white">{index + 1}</span>
                </div>

                <>
                {/* Episodio colocado */}
                {episode && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: draggedFromSlot === index && isDragging ? 0.3 : 1,
                        scale: 1,
                      }}
                      transition={{ duration: 0.2 }}
                      draggable={!isChecking && !showScore && !gameFinished}
                      onDragStart={(e) => handleSlotDragStart(e, episode, index)}
                      onDrag={(e) => {
                        if (e.clientX && e.clientY) {
                          setDragPosition({ x: e.clientX, y: e.clientY })
                        }
                      }}
                      onDragEnd={handleDragEnd}
                      className="h-full p-4 relative cursor-grab active:cursor-grabbing"
                    >
                      <div className="relative h-32 bg-gradient-to-br from-purple-900 to-slate-900 rounded-lg overflow-hidden mb-3">
                        <img
                          src={episode.image}
                          alt={getLocalizedText(episode.title, currentLanguage)}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {result && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                              result === 'correct' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          >
                            {result === 'correct' ? (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </motion.div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-white mb-1">
                          {getLocalizedText(episode.title, currentLanguage)}
                        </h3>
                        {!isChecking && !showScore && !gameFinished && (
                          <button
                            onClick={() => removeFromSlot(index)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500/30 hover:bg-red-500/50 rounded-full flex items-center justify-center transition-colors z-10"
                            aria-label="Eliminar episodio"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                {/* Placeholder cuando está vacío */}
                {!episode && (
                  <div className="h-full flex items-center justify-center p-4">
                    <p className="text-purple-300/50 text-sm text-center">
                      Arrastra aquí
                    </p>
                  </div>
                )}
                </>
                </motion.div>
            )
          })}
        </div>
      </div>

        {/* Puntuación final */}
        <AnimatePresence>
          {showScore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 flex items-center justify-center z-50"
            >
              <div className="bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-purple-900/95 backdrop-blur-xl rounded-2xl border-2 border-purple-400/50 p-8 mx-4 max-w-md w-full shadow-2xl relative">
                {/* Botón de cierre */}
                <button
                  onClick={() => setShowScore(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="text-white text-xl">×</span>
                </button>
                
                {/* Icono de trofeo */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl">🏆</span>
                  </div>
                </div>
                
                {/* Título principal */}
                <h2 className="text-3xl font-bold text-yellow-400 mb-2 text-center">
                  {getTranslation('excellentWork', currentLanguage)}
                </h2>
                
                {/* Puntaje grande */}
                <div className="text-5xl font-bold text-white mb-4 text-center">
                  {score}
                  <span className="text-2xl text-yellow-400 ml-2">pts</span>
                </div>
                
                {/* Estadísticas */}
                <div className="bg-black/30 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-purple-300 text-sm">{getTranslation('time', currentLanguage)}</p>
                      <p className="text-white font-semibold">
                        {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-300 text-sm">{getTranslation('multiplier', currentLanguage)}</p>
                      <p className="text-white font-semibold">
                        {finalMultiplier.toFixed(1)}x
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Botones */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      const seriesName = series ? getLocalizedText(series.title, currentLanguage) : '';
                      const scoreText = currentLanguage === 'es' 
                        ? `¡Obtuve ${score} puntos en ${seriesName}! Tiempo: ${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')} | Mult: ${finalMultiplier.toFixed(1)}x. Jugando en Guesseries 🎮`
                        : `I got ${score} points in ${seriesName}! Time: ${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')} | Mult: ${finalMultiplier.toFixed(1)}x. Playing on Guesseries 🎮`;
                      navigator.clipboard.writeText(scoreText);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    {getTranslation('copyResult', currentLanguage)}
                  </button>
                  <button
                    onClick={() => {
                      setShowScore(false);
                      // Resetear para nueva partida
                      setScore(0);
                      setGameStartTime(null);
                      setElapsedTime(0);
                      setFinalMultiplier(2.0);
                      setGameFinished(false);
                      hasCheckedRef.current = false;
                      setOrderedEpisodes(Array(currentSeriesEpisodes.length).fill(null));
                      setShuffledEpisodes([...currentSeriesEpisodes].sort(() => Math.random() - 0.5));
                      setCurrentEpisodeIndex(0);
                      setCheckResults(Array(currentSeriesEpisodes.length).fill(null));
                      setIsChecking(false);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    {getTranslation('playAgain', currentLanguage)}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Texto "eliminar" que sigue el cursor cuando se arrastra desde abajo sobre el carrusel */}
      {draggedFromSlot !== null && isOverCarousel && dragPosition.x > 0 && dragPosition.y > 0 && (
        <div
          className="fixed pointer-events-none z-50 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-lg text-white text-sm font-semibold shadow-lg"
          style={{
            left: `${dragPosition.x + 15}px`,
            top: `${dragPosition.y - 15}px`,
            transform: 'translate(0, 0)',
          }}
        >
          Eliminar
        </div>
      )}

      {/* Modal de confirmación para reiniciar */}
      <AnimatePresence>
        {showResetModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelReset}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 md:p-8 max-w-md w-full mx-4"
            >
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                {getTranslation('resetConfirmTitle', currentLanguage)}
              </h3>
              <p className="text-purple-200 mb-6 text-center">
                {getTranslation('resetConfirmMessage', currentLanguage)}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={cancelReset}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                >
                  {getTranslation('cancel', currentLanguage)}
                </button>
                <button
                  onClick={confirmReset}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 text-white transition-colors font-semibold"
                >
                  {getTranslation('confirm', currentLanguage)}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}

export default Guesseries
