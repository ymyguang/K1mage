import express from 'express';
import {
  exchangeWechatCode,
  findOrCreateWechatUser,
  findUserById,
  signUserToken
} from '../services/auth-service.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function serializeUser(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    avatar_url: user.avatar_url,
    phone: user.phone,
    status: user.status,
    role: user.role,
    points: Number(user.points || 0),
    created_at: user.created_at,
    last_login_at: user.last_login_at
  };
}

router.post('/wechat-login', async (req, res) => {
  try {
    const { code, nickname, avatarUrl } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'WeChat login code is required'
      });
    }

    const session = await exchangeWechatCode(code);
    const { user, isNew } = await findOrCreateWechatUser({
      openid: session.openid,
      unionid: session.unionid,
      nickname,
      avatarUrl
    });

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'User is disabled'
      });
    }

    res.json({
      success: true,
      token: signUserToken(user),
      user: serializeUser(user),
      isNew
    });
  } catch (error) {
    console.error('Error in POST /auth/wechat-login:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to login with WeChat'
    });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  res.json({
    success: true,
    user: serializeUser(user)
  });
});

export default router;
