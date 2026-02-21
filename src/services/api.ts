const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to migrate old data format to new bilingual format
function migrateToBilingualFormat(series: any[]): any[] {
  if (!series || series.length === 0) {
    return [];
  }
  
  return series.map((s: any) => {
    // Migrate title to bilingual format if it's a string
    if (typeof s.title === 'string') {
      s.title = {
        en: s.title,
        es: s.title
      };
    }
    
    // Migrate plot to bilingual format if it's a string
    if (typeof s.plot === 'string') {
      s.plot = {
        en: s.plot,
        es: s.plot
      };
    }
    
    // Migrate episode titles and descriptions
    if (s.seasons) {
      s.seasons = s.seasons.map((season: any) => {
        if (season.episodes) {
          season.episodes = season.episodes.map((episode: any) => {
            if (typeof episode.title === 'string') {
              episode.title = {
                en: episode.title,
                es: episode.title
              };
            }
            if (typeof episode.description === 'string') {
              episode.description = {
                en: episode.description,
                es: episode.description
              };
            }
            return episode;
          });
        }
        return season;
      });
    }
    
    return s;
  });
}

// Helper function to load initial data from JSON file for static hosting
async function loadInitialData() {
  try {
    // Always load from public/data/series.json
    const response = await fetch('/data/series.json');
    if (response.ok) {
      const data = await response.json();
      console.log('Loaded initial data from JSON file:', data.length, 'series');
      
      // Migrate old format to new bilingual format
      const migratedData = migrateToBilingualFormat(data);
      console.log('Migrated to bilingual format:', migratedData.length, 'series');
      return migratedData;
    }
  } catch (error) {
    console.log('Could not load initial data from JSON file:', error);
  }
  return [];
}

// Helper function to save data to localStorage and update backup
function saveToLocalStorage(series: any) {
  try {
    localStorage.setItem('guesseries-series-v2', JSON.stringify(series));
    localStorage.setItem('guesseries-series-backup', JSON.stringify(series));
    console.log('Saved to localStorage:', series.length, 'series');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Helper function to also update JSON file (for development)
function saveToDataFile(series: any) {
  try {
    // Save to localStorage as backup
    localStorage.setItem('guesseries-json-backup', JSON.stringify(series));
    
    // Create a download link for manual JSON update
    if (import.meta.env.DEV) {
      console.log('💾 Data saved to localStorage backup');
      console.log('📋 Creating download link for series.json update');
      
      const dataStr = JSON.stringify(series, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'series.json';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.log('Error saving backup:', error);
  }
}

export const seriesApi = {
  // Obtener todas las series
  async getAllSeries() {
    // Always load from JSON file first
    const initialData = await loadInitialData();
    console.log('🔍 Initial data from JSON:', initialData.length, 'series');
    
    if (initialData && initialData.length > 0) {
      // Save to localStorage for future use
      saveToLocalStorage(initialData);
      return initialData;
    }
    
    // If JSON is empty, clear localStorage and return empty
    console.log('🔍 JSON file is empty, clearing localStorage');
    localStorage.removeItem('guesseries-series-v2');
    localStorage.removeItem('guesseries-series-backup');
    return [];
  },

  // Guardar una serie (crear o actualizar)
  async saveSeries(series) {
    console.log('🔥 API.saveSeries llamado con:', series);
    try {
      console.log('🔥 Enviando a:', `${API_BASE_URL}/series`);
      const response = await fetch(`${API_BASE_URL}/series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(series),
      });
      console.log('🔥 Response status:', response.status);
      console.log('🔥 Response ok:', response.ok);
      
      if (!response.ok) {
        console.log('🔥 Response no ok, lanzando error');
        throw new Error('Error saving series');
      }
      
      const result = await response.json();
      console.log('🔥 Response JSON:', result);
      return result;
    } catch (error) {
      console.error('❌ API Error:', error);
      console.log('🔥 Haciendo fallback a localStorage');
      
      // Fallback a localStorage
      const stored = localStorage.getItem('guesseries-series-v2') || '[]';
      const allSeries = JSON.parse(stored);
      const index = allSeries.findIndex(s => s.id === series.id);
      if (index >= 0) {
        allSeries[index] = series;
      } else {
        allSeries.push(series);
      }
      saveToLocalStorage(allSeries);
      saveToDataFile(allSeries);
      
      return { success: true, series: allSeries };
    }
  },

  // Actualizar una serie
  async updateSeries(id, series) {
    try {
      const response = await fetch(`${API_BASE_URL}/series/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(series),
      });
      if (!response.ok) throw new Error('Error updating series');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Fallback a localStorage
      const stored = localStorage.getItem('guesseries-series-v2') || '[]';
      const allSeries = JSON.parse(stored);
      const index = allSeries.findIndex(s => s.id === id);
      if (index >= 0) {
        allSeries[index] = series;
        saveToLocalStorage(allSeries);
        saveToDataFile(allSeries);
      }
      return { success: true, series: allSeries };
    }
  },

  // Eliminar una serie
  async deleteSeries(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/series/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting series');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Fallback a localStorage
      const allSeries = JSON.parse(localStorage.getItem('guesseries-series-v2') || '[]').filter(s => s.id !== id);
      saveToLocalStorage(allSeries);
      saveToDataFile(allSeries);
      return { success: true, series: allSeries };
    }
  },

  // Eliminar todas las series
  async clearAllSeries() {
    try {
      const response = await fetch(`${API_BASE_URL}/series`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error clearing series');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Fallback a localStorage
      saveToLocalStorage([]);
      saveToDataFile([]);
      return { success: true, series: [] };
    }
  }
};
