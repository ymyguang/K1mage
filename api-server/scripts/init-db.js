import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { getPool } from '../db/pool.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../db/schema.sql');

async function initDb() {
  const database = process.env.MYSQL_DATABASE || 'k1mage';
  const bootstrapConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || ''
  });

  const escapedDatabase = database.replace(/`/g, '``');
  await bootstrapConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${escapedDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrapConnection.end();

  const schema = await fs.readFile(schemaPath, 'utf8');
  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  const pool = getPool();

  for (const statement of statements) {
    await pool.query(statement);
  }

  await pool.end();
  console.log(`Database initialized with ${statements.length} statements.`);
}

initDb().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
