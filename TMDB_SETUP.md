# Configuración de TMDB API

Para que la aplicación funcione correctamente con títulos y sinopsis en español e inglés, necesitas configurar la API key de TMDB (The Movie Database).

## Pasos:

1. **Obtener una API key de TMDB:**
   - Ve a [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
   - Regístrate o inicia sesión
   - Solicita una API key para desarrollador
   - Copia tu API key

2. **Configurar la API key en el proyecto:**
   - Crea un archivo llamado `.env` en la raíz del proyecto (al mismo nivel que package.json)
   - Agrega la siguiente línea al archivo `.env`:
   ```
   VITE_TMDB_API_KEY=tu_api_key_aqui
   ```
   - Reemplaza `tu_api_key_aqui` con tu API key real

3. **Reiniciar el servidor:**
   - Detén el servidor de desarrollo si está corriendo
   - Vuélvelo a iniciar con `npm run dev`

## ¿Qué hace esta integración?

- **Títulos bilingües:** Cada episodio tendrá título en inglés y español
- **Sinopsis bilingües:** Las descripciones estarán disponibles en ambos idiomas
- **Imágenes desde TVMaze:** Las imágenes continúan obteniéndose desde TVMaze (como antes)
- **Fallback inteligente:** Si no hay datos en TMDB, usa los de TVMaze como fallback

## Estructura de datos

Cada serie ahora guardará:
```typescript
{
  title: { en: "Title in English", es: "Título en Español" },
  plot: { en: "English description", es: "Descripción en español" },
  episodes: [
    {
      title: { en: "Episode Title", es: "Título del Episodio" },
      description: { en: "English description", es: "Descripción en español" }
    }
  ]
}
```

## Notas importantes

- La API key de TMDB es gratuita para uso personal y tiene límites razonables
- Los datos en español pueden no estar disponibles para todas las series
- El sistema usa automáticamente los datos en inglés como fallback
- Las imágenes continúan siendo responsabilidad de TVMaze (no cambian)
