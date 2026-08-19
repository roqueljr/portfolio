import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

const dbName = process.env.DB_NAME || 'portfolio_db';
if (!/^[A-Za-z0-9_]+$/.test(dbName)) throw new Error('DB_NAME may only contain letters, numbers, and underscores.');

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});

try {
  let sql = await fs.readFile(path.resolve('database/schema.sql'), 'utf8');
  sql = sql.replaceAll('portfolio_db', dbName);
  await connection.query(sql);
  console.log(`Database initialized: ${dbName}`);
} finally {
  await connection.end();
}
