import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { config, isProduction } from './config.js';
import { pool } from './db.js';

export const SESSION_COOKIE = 'portfolio_session';

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    display_name: row.display_name || null,
    avatar_url: row.avatar_url || null,
    email_verified: Boolean(row.email_verified_at),
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

export function hashOneTimeToken(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function createSessionToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role, email: user.email },
    config.auth.secret,
    { expiresIn: `${config.auth.tokenDays}d`, issuer: 'portfolio-mysql' }
  );
}

export function setSessionCookie(res, user) {
  const token = createSessionToken(user);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: config.auth.tokenDays * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
}

export async function authOptional(req, _res, next) {
  req.user = null;
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.auth.secret, { issuer: 'portfolio-mysql' });
    const [rows] = await pool.query(
      'SELECT id,email,role,display_name,avatar_url,email_verified_at,is_active,created_date,updated_date FROM users WHERE id = ? LIMIT 1',
      [payload.sub]
    );
    if (rows[0]?.is_active) req.user = rows[0];
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  next();
}

export async function verifyPassword(password, hash) {
  return hash ? bcrypt.compare(password, hash) : false;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
