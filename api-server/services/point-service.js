export class InsufficientPointsError extends Error {
  constructor(requiredPoints, currentPoints) {
    super('Insufficient points');
    this.name = 'InsufficientPointsError';
    this.requiredPoints = requiredPoints;
    this.currentPoints = currentPoints;
  }
}

export function getImageCostPoints(template) {
  const templatePoints = Number(template?.price?.points_per_image);

  if (Number.isFinite(templatePoints) && templatePoints >= 0) {
    return templatePoints;
  }

  return Number(process.env.DEFAULT_IMAGE_COST_POINTS || 1);
}

export async function grantPoints(connection, {
  userId,
  amount,
  reason,
  relatedType = null,
  relatedId = null,
  operatorUserId = null
}) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Point grant amount must be a positive integer');
  }

  await connection.execute(
    'INSERT IGNORE INTO user_points (user_id, points, total_earned, total_used) VALUES (?, 0, 0, 0)',
    [userId]
  );

  const [rows] = await connection.execute(
    'SELECT points FROM user_points WHERE user_id = ? FOR UPDATE',
    [userId]
  );
  const beforePoints = rows[0]?.points || 0;
  const afterPoints = beforePoints + amount;

  await connection.execute(
    `UPDATE user_points
        SET points = ?, total_earned = total_earned + ?
      WHERE user_id = ?`,
    [afterPoints, amount, userId]
  );

  await connection.execute(
    `INSERT INTO point_logs
      (user_id, type, amount, before_points, after_points, reason, related_type, related_id, operator_user_id)
     VALUES (?, 'grant', ?, ?, ?, ?, ?, ?, ?)`,
    [userId, amount, beforePoints, afterPoints, reason, relatedType, relatedId, operatorUserId]
  );

  return afterPoints;
}

export async function refundPoints(connection, {
  userId,
  amount,
  reason,
  relatedType = null,
  relatedId = null
}) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Point refund amount must be a positive integer');
  }

  await connection.execute(
    'INSERT IGNORE INTO user_points (user_id, points, total_earned, total_used) VALUES (?, 0, 0, 0)',
    [userId]
  );

  const [rows] = await connection.execute(
    'SELECT points FROM user_points WHERE user_id = ? FOR UPDATE',
    [userId]
  );
  const beforePoints = rows[0]?.points || 0;
  const afterPoints = beforePoints + amount;

  await connection.execute(
    'UPDATE user_points SET points = ? WHERE user_id = ?',
    [afterPoints, userId]
  );

  await connection.execute(
    `INSERT INTO point_logs
      (user_id, type, amount, before_points, after_points, reason, related_type, related_id)
     VALUES (?, 'refund', ?, ?, ?, ?, ?, ?)`,
    [userId, amount, beforePoints, afterPoints, reason, relatedType, relatedId]
  );

  return afterPoints;
}

export async function adjustPoints(connection, {
  userId,
  amount,
  reason,
  operatorUserId = null
}) {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error('Point adjustment amount must be a non-zero integer');
  }

  await connection.execute(
    'INSERT IGNORE INTO user_points (user_id, points, total_earned, total_used) VALUES (?, 0, 0, 0)',
    [userId]
  );

  const [rows] = await connection.execute(
    'SELECT points FROM user_points WHERE user_id = ? FOR UPDATE',
    [userId]
  );
  const beforePoints = rows[0]?.points || 0;
  const afterPoints = beforePoints + amount;

  if (afterPoints < 0) {
    throw new InsufficientPointsError(Math.abs(amount), beforePoints);
  }

  await connection.execute(
    `UPDATE user_points
        SET points = ?,
            total_earned = total_earned + ?,
            total_used = total_used + ?
      WHERE user_id = ?`,
    [afterPoints, Math.max(amount, 0), Math.max(-amount, 0), userId]
  );

  await connection.execute(
    `INSERT INTO point_logs
      (user_id, type, amount, before_points, after_points, reason, operator_user_id)
     VALUES (?, 'adjust', ?, ?, ?, ?, ?)`,
    [userId, amount, beforePoints, afterPoints, reason, operatorUserId]
  );

  return afterPoints;
}

export async function consumePoints(connection, {
  userId,
  amount,
  reason,
  relatedType = null,
  relatedId = null
}) {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error('Point consume amount must be a non-negative integer');
  }

  if (amount === 0) {
    const [rows] = await connection.execute(
      'SELECT points FROM user_points WHERE user_id = ?',
      [userId]
    );
    return rows[0]?.points || 0;
  }

  await connection.execute(
    'INSERT IGNORE INTO user_points (user_id, points, total_earned, total_used) VALUES (?, 0, 0, 0)',
    [userId]
  );

  const [rows] = await connection.execute(
    'SELECT points FROM user_points WHERE user_id = ? FOR UPDATE',
    [userId]
  );
  const beforePoints = rows[0]?.points || 0;

  if (beforePoints < amount) {
    throw new InsufficientPointsError(amount, beforePoints);
  }

  const afterPoints = beforePoints - amount;

  await connection.execute(
    `UPDATE user_points
        SET points = ?, total_used = total_used + ?
      WHERE user_id = ?`,
    [afterPoints, amount, userId]
  );

  await connection.execute(
    `INSERT INTO point_logs
      (user_id, type, amount, before_points, after_points, reason, related_type, related_id)
     VALUES (?, 'consume', ?, ?, ?, ?, ?, ?)`,
    [userId, -amount, beforePoints, afterPoints, reason, relatedType, relatedId]
  );

  return afterPoints;
}
