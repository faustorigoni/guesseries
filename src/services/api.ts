const API_BASE_URL = 'http://localhost:3001/api';

export const seriesApi = {
  // Obtener todas las series
  async getAllSeries() {
    try {
      const response = await fetch(`${API_BASE_URL}/series`);
      if (!response.ok) throw new Error('Error fetching series');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Fallback a localStorage si la API no está disponible
      const stored = localStorage.getItem('guesseries-series-v2');
      return stored ? JSON.parse(stored) : [];
    }
  },

  // Guardar una serie (crear o actualizar)
  async saveSeries(series) {
    try {
      const response = await fetch(`${API_BASE_URL}/series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(series),
      });
      if (!response.ok) throw new Error('Error saving series');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Fallback a localStorage
      const stored = localStorage.getItem('guesseries-series-v2') || '[]';
      const series = JSON.parse(stored);
      const index = series.findIndex(s => s.id === series.id);
      if (index >= 0) {
        series[index] = series;
      } else {
        series.push(series);
      }
      localStorage.setItem('guesseries-series-v2', JSON.stringify(series));
      return { success: true, series };
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
      const series = JSON.parse(stored);
      const index = series.findIndex(s => s.id === id);
      if (index >= 0) {
        series[index] = series;
        localStorage.setItem('guesseries-series-v2', JSON.stringify(series));
      }
      return { success: true, series };
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
      const stored = localStorage.getItem('guesseries-series-v2') || '[]';
      const series = JSON.parse(stored).filter(s => s.id !== id);
      localStorage.setItem('guesseries-series-v2', JSON.stringify(series));
      return { success: true };
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
      localStorage.setItem('guesseries-series-v2', '[]');
      return { success: true };
    }
  },
};
