import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data', 'series.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Asegurar que existe la carpeta data
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Asegurar que existe el archivo de datos
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// GET /api/series - Obtener todas las series
app.get('/api/series', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const series = JSON.parse(data);
    res.json(series);
  } catch (error) {
    console.error('Error reading series:', error);
    res.status(500).json({ error: 'Error reading series data' });
  }
});

// POST /api/series - Guardar una serie
app.post('/api/series', (req, res) => {
  try {
    const newSeries = req.body;
    
    // Actualizar data/series.json (archivo del servidor)
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const series = JSON.parse(data);
    
    // Reemplazar si existe, o agregar si no
    const existingIndex = series.findIndex(s => s.id === newSeries.id);
    if (existingIndex >= 0) {
      series[existingIndex] = newSeries;
    } else {
      series.push(newSeries);
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(series, null, 2));
    
    // También actualizar public/data/series.json para el frontend estático
    const publicDataFile = path.join(__dirname, 'public', 'data', 'series.json');
    const publicDataDir = path.dirname(publicDataFile);
    
    // Asegurar que existe la carpeta public/data
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }
    
    fs.writeFileSync(publicDataFile, JSON.stringify(series, null, 2));
    console.log('Updated both data files:', DATA_FILE, 'and', publicDataFile);
    
    res.json({ success: true, series: newSeries });
  } catch (error) {
    console.error('Error saving series:', error);
    res.status(500).json({ error: 'Error saving series' });
  }
});

// PUT /api/series/:id - Actualizar una serie
app.put('/api/series/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updatedSeries = req.body;
    
    // Actualizar data/series.json
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const series = JSON.parse(data);
    
    const index = series.findIndex(s => s.id === id);
    if (index >= 0) {
      series[index] = updatedSeries;
      fs.writeFileSync(DATA_FILE, JSON.stringify(series, null, 2));
      
      // También actualizar public/data/series.json
      const publicDataFile = path.join(__dirname, 'public', 'data', 'series.json');
      fs.writeFileSync(publicDataFile, JSON.stringify(series, null, 2));
      console.log('Updated both data files for PUT:', DATA_FILE, 'and', publicDataFile);
      
      res.json({ success: true, series: updatedSeries });
    } else {
      res.status(404).json({ error: 'Series not found' });
    }
  } catch (error) {
    console.error('Error updating series:', error);
    res.status(500).json({ error: 'Error updating series' });
  }
});

// DELETE /api/series/:id - Eliminar una serie
app.delete('/api/series/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Actualizar data/series.json
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const series = JSON.parse(data);
    
    const filtered = series.filter(s => s.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
    
    // También actualizar public/data/series.json
    const publicDataFile = path.join(__dirname, 'public', 'data', 'series.json');
    fs.writeFileSync(publicDataFile, JSON.stringify(filtered, null, 2));
    console.log('Updated both data files for DELETE:', DATA_FILE, 'and', publicDataFile);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting series:', error);
    res.status(500).json({ error: 'Error deleting series' });
  }
});

// DELETE /api/series - Eliminar todas las series
app.delete('/api/series', (req, res) => {
  try {
    // Actualizar data/series.json
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    
    // También actualizar public/data/series.json
    const publicDataFile = path.join(__dirname, 'public', 'data', 'series.json');
    fs.writeFileSync(publicDataFile, JSON.stringify([], null, 2));
    console.log('Cleared both data files:', DATA_FILE, 'and', publicDataFile);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing series:', error);
    res.status(500).json({ error: 'Error clearing series' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
