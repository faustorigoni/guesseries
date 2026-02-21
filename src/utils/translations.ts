export const translations = {
  en: {
    // Navegación y botones principales
    guesseries: 'Guesseries',
    selectSeries: 'Select a Series',
    backToMenu: '← Back to Menu',
    play: 'Play',
    admin: 'Admin Panel',
    reset: 'Reset',
    check: 'Check',
    tryAgain: 'Try Again',
    restart: 'Restart',
    
    // Juego - instrucciones
    dragToOrder: 'Drag the card to a numbered position to order the episodes',
    checkResults: 'Check your results! You can reorganize the cards by dragging them.',
    allPlaced: 'All episodes placed! Click "Check" to see your score.',
    
    // Puntaje y resultados
    excellentWork: 'Excellent work!',
    yourScore: 'Your score is',
    points: 'pts',
    time: 'Time',
    multiplier: 'Multiplier',
    copyResult: '📋 Copy result',
    playAgain: '🔄 Play again',
    copySuccess: 'Result copied to clipboard!',
    
    // Temporadas y episodios
    season: 'Season',
    episode: 'Episode',
    episodes: 'episodes',
    selectSeason: 'Select a season:',
    noSeriesAvailable: 'No series available yet.',
    contactAdmin: 'Contact the administrator to add series to the game.',
    
    // Modal de reset
    resetConfirmTitle: 'Reset Game',
    resetConfirmMessage: 'Are you sure you want to reset the game? All progress will be lost.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    
    // Estados del juego
    loading: 'Loading...',
    correct: 'Correct',
    incorrect: 'Incorrect',
    checking: 'Checking...',
    
    // Errores y mensajes
    errorLoadingSeries: 'Error loading series',
    noEpisodes: 'No episodes available',
    gameComplete: 'Game Complete!',
    
    // Acciones
    remove: 'Remove',
    delete: 'Delete',
    save: 'Save',
    edit: 'Edit',
    add: 'Add',
    
    // Instrucciones específicas
    dragHere: 'Drag here',
    dropZone: 'Drop Zone',
    reorderCards: 'You can reorder the cards by dragging them.',
    
    // Feedback
    congratulations: 'Congratulations!',
    wellDone: 'Well done!',
    perfectScore: 'Perfect Score!',
    
    // UI elements
    language: 'Language',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    close: 'Close',
    ok: 'OK',
    yes: 'Yes',
    no: 'No'
  },
  es: {
    // Navegación y botones principales
    guesseries: 'Guesseries',
    selectSeries: 'Selecciona una Serie',
    backToMenu: '← Volver al Menú',
    play: 'Jugar',
    admin: 'Panel de Administración',
    reset: 'Reiniciar',
    check: 'Comprobar',
    tryAgain: 'Intentar de nuevo',
    restart: 'Reiniciar',
    
    // Juego - instrucciones
    dragToOrder: 'Arrastra la tarjeta a una de las posiciones numeradas para ordenar los episodios',
    checkResults: '¡Revisa tus resultados! Puedes reorganizar las tarjetas arrastrándolas.',
    allPlaced: '¡Todos los episodios colocados! Presiona "Comprobar" para ver tu puntaje.',
    
    // Puntaje y resultados
    excellentWork: '¡Excelente trabajo!',
    yourScore: 'Tu puntaje es',
    points: 'pts',
    time: 'Tiempo',
    multiplier: 'Multiplicador',
    copyResult: '📋 Copiar resultado',
    playAgain: '🔄 Jugar de nuevo',
    copySuccess: '¡Resultado copiado al portapapeles!',
    
    // Temporadas y episodios
    season: 'Temporada',
    episode: 'Episodio',
    episodes: 'episodios',
    selectSeason: 'Selecciona una temporada:',
    noSeriesAvailable: 'No hay series disponibles todavía.',
    contactAdmin: 'Contacta al administrador para agregar series al juego.',
    
    // Modal de reset
    resetConfirmTitle: 'Reiniciar Juego',
    resetConfirmMessage: '¿Estás seguro de que quieres reiniciar el juego? Todo el progreso se perderá.',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    
    // Estados del juego
    loading: 'Cargando...',
    correct: 'Correcto',
    incorrect: 'Incorrecto',
    checking: 'Comprobando...',
    
    // Errores y mensajes
    errorLoadingSeries: 'Error cargando series',
    noEpisodes: 'No hay episodios disponibles',
    gameComplete: '¡Juego Completado!',
    
    // Acciones
    remove: 'Eliminar',
    delete: 'Borrar',
    save: 'Guardar',
    edit: 'Editar',
    add: 'Agregar',
    
    // Instrucciones específicas
    dragHere: 'Arrastra aquí',
    dropZone: 'Zona de caída',
    reorderCards: 'Puedes reorganizar las tarjetas arrastrándolas.',
    
    // Feedback
    congratulations: '¡Felicidades!',
    wellDone: '¡Bien hecho!',
    perfectScore: '¡Puntaje Perfecto!',
    
    // UI elements
    language: 'Idioma',
    settings: 'Configuración',
    help: 'Ayuda',
    about: 'Acerca de',
    close: 'Cerrar',
    ok: 'OK',
    yes: 'Sí',
    no: 'No'
  }
}

export type Language = 'en' | 'es'

export function getTranslation(key: string, language: Language = 'en'): string {
  const keys = key.split('.')
  let value: any = translations[language]
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  return value || key
}
