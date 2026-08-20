import 'dotenv/config';
import mysql from 'mysql2/promise';

const useSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'portfolio_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ssl: useSsl
    ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      }
    : undefined,
});

try {
  const [columns] = await connection.query(
    "SHOW COLUMNS FROM site_settings LIKE 'admin_brand_name'"
  );

  if (columns.length === 0) {
    await connection.query('ALTER TABLE site_settings ADD COLUMN admin_brand_name VARCHAR(120) NULL');
    console.log('Added site_settings.admin_brand_name');
  } else {
    console.log('site_settings.admin_brand_name already exists');
  }
} finally {
  await connection.end();
}
