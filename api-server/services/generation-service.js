import { getPool } from '../db/pool.js';

export async function createGenerationRecord(connection, {
  userId,
  templateId,
  model,
  prompt,
  inputImagesCount,
  inputImagesPreview,
  costPoints
}) {
  const [result] = await connection.execute(
    `INSERT INTO generation_records
      (user_id, template_id, model, prompt, input_images_count, input_images_preview, status, cost_points)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      userId,
      templateId || null,
      model,
      prompt,
      inputImagesCount || 0,
      inputImagesPreview || null,
      costPoints
    ]
  );

  return result.insertId;
}

export async function markGenerationSuccess(connection, {
  recordId,
  outputUrl
}) {
  await connection.execute(
    `UPDATE generation_records
        SET status = 'success', output_url = ?, completed_at = NOW()
      WHERE id = ?`,
    [outputUrl || null, recordId]
  );
}

export async function markGenerationFailed(connection, {
  recordId,
  errorMessage
}) {
  await connection.execute(
    `UPDATE generation_records
        SET status = 'failed', error_message = ?, completed_at = NOW()
      WHERE id = ?`,
    [errorMessage || 'Unknown error', recordId]
  );
}

export async function listUserGenerationRecords(userId, { limit = 20, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [rows] = await getPool().execute(
    `SELECT id, template_id, model, prompt, input_images_count, input_images_preview, output_url, status,
            cost_points, error_message, created_at, completed_at
       FROM generation_records
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [userId]
  );

  return rows;
}
