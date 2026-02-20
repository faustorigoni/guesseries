const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to load initial data from JSON file for static hosting
async function loadInitialData() {
  try {
    // Try to load from public/data/series.json (for GitHub Pages)
    const response = await fetch('/data/series.json');
    if (response.ok) {
      const data = await response.json();
      console.log('Loaded initial data from JSON file:', data.length, 'series');
      return data;
    }
  } catch (error) {
    console.log('Could not load initial data from JSON file');
  }
  return null;
}

// Helper function to save data to localStorage and update backup
function saveToLocalStorage(series) {
  try {
    localStorage.setItem('guesseries-series-v2', JSON.stringify(series));
    localStorage.setItem('guesseries-series-backup', JSON.stringify(series));
    console.log('Saved to localStorage:', series.length, 'series');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export const seriesApi = {
  // Obtener todas las series
  async getAllSeries() {
    try {
      const response = await fetch(`${API_BASE_URL}/series`);
      if (!response.ok) throw new Error('Error fetching series');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      
      // First try to load initial data from JSON file
      const initialData = await loadInitialData();
      if (initialData && initialData.length > 0) {
        // Save to localStorage for future use
        saveToLocalStorage(initialData);
        return initialData;
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('guesseries-series-v2');
      return stored ? JSON.parse(stored) : [];
    }
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
      return { success: true, series: [] };
    }
  }
};
