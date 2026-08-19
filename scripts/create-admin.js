import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const [emailArg, passwordArg] = process.argv.slice(2);
const email = String(emailArg || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(passwordArg || process.env.ADMIN_PASSWORD || '');

if (!email || !password) {
  console.error('Usage: npm run admin:create -- admin@example.com "StrongPassword"');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'portfolio_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
});

try {
  const hash = await bcrypt.hash(password, 12);
  await connection.query(
    `INSERT INTO users (email,password_hash,role,email_verified_at,is_active)
     VALUES (?,?,'admin',NOW(),1)
     ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role='admin', email_verified_at=COALESCE(email_verified_at,NOW()), is_active=1`,
    [email, hash]
  );
  console.log(`Admin ready: ${email}`);
} finally {
  await connection.end();
}
