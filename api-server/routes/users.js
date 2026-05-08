import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listUserGenerationRecords } from '../services/generation-service.js';

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

router.get('/me/points', requireAuth, (req, res) => {
  res.json({
    success: true,
    points: Number(req.user.points || 0)
  });
});

router.get('/me/generation-records', requireAuth, async (req, res) => {
  try {
    const records = await listUserGenerationRecords(req.user.id, req.query);
    res.json({
      success: true,
      records
    });
  } catch (error) {
    console.error('Error in GET /users/me/generation-records:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get generation records'
    });
  }
});

export default router;
