import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import imageRoutes from './routes/image.js';
import templateRoutes from './routes/templates.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import { templateManager } from './template-manager.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/templates', templateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/image', imageRoutes);

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
      login: 'POST /api/auth/wechat-login',
      me: 'GET /api/auth/me',
      userPoints: 'GET /api/users/me/points',
      userGenerationRecords: 'GET /api/users/me/generation-records',
      adminUsers: 'GET /api/admin/users',
      models: 'GET /api/image/models',
      providers: 'GET /api/image/providers',
      generateImage: 'POST /api/image/generate',
      editImage: 'POST /api/image/edit'
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
