import jwt from 'jsonwebtoken';
import { getPool, withTransaction } from '../db/pool.js';
import { grantPoints } from './point-service.js';

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return secret;
}

export function signUserToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      status: user.status
    },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

export function verifyUserToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export async function exchangeWechatCode(code) {
  if (process.env.DEV_WECHAT_LOGIN === 'true' && process.env.NODE_ENV !== 'production') {
    return {
      openid: process.env.DEV_WECHAT_OPENID || 'dev_openid',
      unionid: process.env.DEV_WECHAT_UNIONID || null
    };
  }

  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_SECRET;

  if (!appid || !secret) {
    throw new Error('WECHAT_APPID and WECHAT_SECRET are required');
  }

  const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
  url.searchParams.set('appid', appid);
  url.searchParams.set('secret', secret);
  url.searchParams.set('js_code', code);
  url.searchParams.set('grant_type', 'authorization_code');

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.errcode) {
    throw new Error(data.errmsg || 'Failed to exchange WeChat code');
  }

  if (!data.openid) {
    throw new Error('WeChat response missing openid');
  }

  return data;
}

export async function findUserById(userId) {
  const [rows] = await getPool().execute(
    `SELECT u.id, u.openid, u.unionid, u.nickname, u.avatar_url, u.phone,
            u.status, u.role, u.created_at, u.updated_at, u.last_login_at,
            COALESCE(p.points, 0) AS points
       FROM users u
       LEFT JOIN user_points p ON p.user_id = u.id
      WHERE u.id = ?`,
    [userId]
  );

  return rows[0] || null;
}

export async function findOrCreateWechatUser({ openid, unionid, nickname, avatarUrl }) {
  return withTransaction(async (connection) => {
    const [existingRows] = await connection.execute(
      'SELECT * FROM users WHERE openid = ? LIMIT 1',
      [openid]
    );

    if (existingRows.length > 0) {
      const user = existingRows[0];
      await connection.execute(
        `UPDATE users
            SET unionid = COALESCE(?, unionid),
                nickname = COALESCE(?, nickname),
                avatar_url = COALESCE(?, avatar_url),
                last_login_at = NOW()
          WHERE id = ?`,
        [unionid || null, nickname || null, avatarUrl || null, user.id]
      );

      const [rows] = await connection.execute(
        `SELECT u.id, u.openid, u.unionid, u.nickname, u.avatar_url, u.phone,
                u.status, u.role, u.created_at, u.updated_at, u.last_login_at,
                COALESCE(p.points, 0) AS points
           FROM users u
           LEFT JOIN user_points p ON p.user_id = u.id
          WHERE u.id = ?`,
        [user.id]
      );

      return { user: rows[0], isNew: false };
    }

    const [result] = await connection.execute(
      `INSERT INTO users (openid, unionid, nickname, avatar_url, last_login_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [openid, unionid || null, nickname || null, avatarUrl || null]
    );

    const userId = result.insertId;
    await connection.execute(
      'INSERT INTO user_points (user_id, points, total_earned, total_used) VALUES (?, 0, 0, 0)',
      [userId]
    );

    const registerBonus = Number(process.env.REGISTER_BONUS_POINTS || 0);
    if (registerBonus > 0) {
      await grantPoints(connection, {
        userId,
        amount: registerBonus,
        reason: 'register_bonus'
      });
    }

    const [rows] = await connection.execute(
      `SELECT u.id, u.openid, u.unionid, u.nickname, u.avatar_url, u.phone,
              u.status, u.role, u.created_at, u.updated_at, u.last_login_at,
              COALESCE(p.points, 0) AS points
         FROM users u
         LEFT JOIN user_points p ON p.user_id = u.id
        WHERE u.id = ?`,
      [userId]
    );

    return { user: rows[0], isNew: true };
  });
}
