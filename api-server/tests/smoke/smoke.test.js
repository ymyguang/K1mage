import request from 'supertest';
import express from 'express';
import cors from 'cors';
import imageRoutes from '../../routes/image.js';

const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use('/api/image', imageRoutes);
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  return app;
};

describe('Smoke Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('API Endpoints', () => {
    it('should list available models', async () => {
      const res = await request(app)
        .get('/api/image/models')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.models).toBeDefined();
      expect(Array.isArray(res.body.models)).toBe(true);
    });

    it('should list providers', async () => {
      const res = await request(app)
        .get('/api/image/providers')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.providers).toBeDefined();
      expect(Array.isArray(res.body.providers)).toBe(true);
    });

    it('should validate generate endpoint parameters', async () => {
      const res = await request(app)
        .post('/api/image/generate')
        .send({})
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Model is required');
    });

    it('should validate edit endpoint parameters', async () => {
      const res = await request(app)
        .post('/api/image/edit')
        .send({ model: 'gemini/gemini-2.5-flash-image' })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Prompt is required');
    });
  });

  describe('Configuration', () => {
    it('should load configuration without errors', async () => {
      const { config } = await import('../../config/index.js');
      expect(config).toBeDefined();
      expect(config.providers).toBeDefined();
    });
  });
});
