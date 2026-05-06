import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import imageRoutes from './routes/image.js';
import geminiRoutes from './routes/gemini.js';
import templateRoutes from './routes/templates.js';
import { templateManager } from './template-manager.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/templates', templateRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/gemini', geminiRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'K1mage API Server',
    version: '3.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      templates: 'GET /api/templates',
      template: 'GET /api/templates/:id',
      preview: 'GET /api/templates/:id/preview',
      models: 'GET /api/image/models',
      providers: 'GET /api/image/providers',
      generateImage: 'POST /api/image/generate',
      editImage: 'POST /api/image/edit',
      legacy: {
        editImage: 'POST /api/gemini/edit-image',
        generateImage: 'POST /api/gemini/generate-image'
      }
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  await templateManager.loadAll();
  
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Templates loaded: ${templateManager.templates.size}`);
  });
}

startServer();

export { app };
