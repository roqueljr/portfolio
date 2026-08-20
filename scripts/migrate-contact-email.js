import 'dotenv/config';
import mysql from 'mysql2/promise';

const useSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'portfolio_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ssl: useSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
});

try {
  await connection.query(`CREATE TABLE IF NOT EXISTS email_settings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
    notification_email VARCHAR(255) NULL,
    reply_signature TEXT NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB`);

  await connection.query(`CREATE TABLE IF NOT EXISTS contact_message_replies (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    contact_message_id BIGINT UNSIGNED NOT NULL,
    admin_user_id BIGINT UNSIGNED NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body LONGTEXT NOT NULL,
    provider_message_id VARCHAR(500) NULL,
    sent_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_contact_replies_message (contact_message_id, sent_date),
    KEY idx_contact_replies_admin (admin_user_id)
  ) ENGINE=InnoDB`);

  const [rows] = await connection.query('SELECT id FROM email_settings ORDER BY id ASC LIMIT 1');
  if (!rows.length) await connection.query('INSERT INTO email_settings (notifications_enabled) VALUES (1)');

  console.log('Email notification/reply database migration is ready.');
} finally {
  await connection.end();
}
