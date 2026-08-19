import 'dotenv/config';
import path from 'node:path';

const root = process.cwd();

export const config = {
  port: Number(process.env.PORT || 5173),
  publicUrl: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5173}`,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'portfolio_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  },
  auth: {
    secret: process.env.AUTH_SECRET || 'development-only-change-me',
    tokenDays: Number(process.env.AUTH_TOKEN_DAYS || 7),
    requireEmailVerification: String(process.env.AUTH_REQUIRE_EMAIL_VERIFICATION || 'false').toLowerCase() === 'true',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'Portfolio <no-reply@example.com>',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  },
  uploads: {
    dir: path.resolve(root, process.env.UPLOAD_DIR || 'uploads'),
    maxBytes: Number(process.env.MAX_UPLOAD_MB || 6) * 1024 * 1024,
  },
};

export const isProduction = config.nodeEnv === 'production';

export function assertProductionConfig() {
  if (!isProduction) return;
  const errors = [];
  if (!process.env.AUTH_SECRET || config.auth.secret === 'development-only-change-me' || config.auth.secret.length < 32) {
    errors.push('AUTH_SECRET must be set to a unique value of at least 32 characters.');
  }
  try {
    const url = new URL(config.publicUrl);
    if (url.protocol !== 'https:') errors.push('PUBLIC_URL must use https:// in production.');
  } catch {
    errors.push('PUBLIC_URL must be a valid absolute URL.');
  }
  if (errors.length) {
    throw new Error(`Unsafe production configuration:
- ${errors.join('\n- ')}`);
  }
}
