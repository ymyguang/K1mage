import express from 'express';
import { getPool, withTransaction } from '../db/pool.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { adjustPoints, InsufficientPointsError } from '../services/point-service.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const { keyword = '', limit = 20, offset = 0 } = req.query;
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const like = `%${keyword}%`;

    const [rows] = await getPool().execute(
      `SELECT u.id, u.openid, u.unionid, u.nickname, u.avatar_url, u.phone,
              u.status, u.role, u.created_at, u.updated_at, u.last_login_at,
              COALESCE(p.points, 0) AS points,
              COALESCE(p.total_earned, 0) AS total_earned,
              COALESCE(p.total_used, 0) AS total_used
        FROM users u
         LEFT JOIN user_points p ON p.user_id = u.id
        WHERE (? = '' OR u.openid LIKE ? OR u.nickname LIKE ? OR u.phone LIKE ?)
        ORDER BY u.id DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [keyword, like, like, like]
    );

    res.json({
      success: true,
      users: rows
    });
  } catch (error) {
    console.error('Error in GET /admin/users:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get users'
    });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be active or disabled'
      });
    }

    await getPool().execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(`Error in PATCH /admin/users/${req.params.id}/status:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user status'
    });
  }
});

router.post('/users/:id/points', async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const reason = req.body.reason || 'admin_adjust';

    if (!Number.isInteger(amount) || amount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a non-zero integer'
      });
    }

    const points = await withTransaction(async (connection) => adjustPoints(connection, {
      userId: req.params.id,
      amount,
      reason,
      operatorUserId: req.user.id
    }));

    res.json({
      success: true,
      points
    });
  } catch (error) {
    if (error instanceof InsufficientPointsError) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient points',
        requiredPoints: error.requiredPoints,
        currentPoints: error.currentPoints
      });
    }

    console.error(`Error in POST /admin/users/${req.params.id}/points:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to adjust user points'
    });
  }
});

router.get('/generation-records', async (req, res) => {
  try {
    const { limit = 20, offset = 0, userId } = req.query;
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const params = [];
    let where = '';

    if (userId) {
      where = 'WHERE r.user_id = ?';
      params.push(userId);
    }

    const [rows] = await getPool().execute(
      `SELECT r.id, r.user_id, u.nickname, r.template_id, r.model,
              r.input_images_count, r.output_url, r.status, r.cost_points,
              r.error_message, r.created_at, r.completed_at
         FROM generation_records r
         JOIN users u ON u.id = r.user_id
         ${where}
        ORDER BY r.id DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );

    res.json({
      success: true,
      records: rows
    });
  } catch (error) {
    console.error('Error in GET /admin/generation-records:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get generation records'
    });
  }
});

export default router;
