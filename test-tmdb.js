// Script de prueba para verificar la integración con TMDB
// Ejecutar con: npm run test-tmdb (necesita configurar en package.json)

import { tmdbService } from './src/services/tmdbService.js'

async function testTMDBIntegration() {
  console.log('🧪 Probando integración con TMDB...')
  
  // Test 1: Buscar una serie popular
  console.log('\n📺 Buscando "Breaking Bad"...')
  const breakingBad = await tmdbService.getCompleteSeriesData('Breaking Bad')
  
  if (breakingBad) {
    console.log('✅ Serie encontrada:')
    console.log('   Título EN:', breakingBad.title.en)
    console.log('   Título ES:', breakingBad.title.es)
    console.log('   Descripción EN:', breakingBad.plot.en?.substring(0, 100) + '...')
    console.log('   Descripción ES:', breakingBad.plot.es?.substring(0, 100) + '...')
    console.log('   Total episodios:', breakingBad.episodes.length)
    
    // Test 2: Verificar episodios bilingües
    if (breakingBad.episodes.length > 0) {
      const firstEpisode = breakingBad.episodes[0]
      console.log('\n🎬 Primer episodio:')
      console.log('   Título EN:', firstEpisode.title.en)
      console.log('   Título ES:', firstEpisode.title.es)
      console.log('   Descripción EN:', firstEpisode.description.en?.substring(0, 100) + '...')
      console.log('   Descripción ES:', firstEpisode.description.es?.substring(0, 100) + '...')
    }
  } else {
    console.log('❌ No se encontró la serie')
  }
  
  // Test 3: Buscar serie en español
  console.log('\n📺 Buscando "La Casa de Papel"...')
  const laCasaDePapel = await tmdbService.getCompleteSeriesData('La Casa de Papel')
  
  if (laCasaDePapel) {
    console.log('✅ Serie encontrada:')
    console.log('   Título EN:', laCasaDePapel.title.en)
    console.log('   Título ES:', laCasaDePapel.title.es)
  } else {
    console.log('❌ No se encontró la serie')
  }
  
  console.log('\n🏁 Prueba completada')
}

// Verificar si hay API key
if (!import.meta.env.VITE_TMDB_API_KEY) {
  console.error('❌ ERROR: No se encontró VITE_TMDB_API_KEY en las variables de entorno')
  console.log('💡 Por favor, configura tu API key de TMDB en el archivo .env')
  console.log('📋 Revisa el archivo TMDB_SETUP.md para instrucciones')
} else {
  testTMDBIntegration().catch(console.error)
}
