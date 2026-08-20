import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config, isProduction, assertProductionConfig } from './config.js';
import { pool, testDatabase } from './db.js';
import { getEntity, sanitizePayload, validateRequired, hydrateRow } from './entities.js';
import {
  authOptional,
  requireAdmin,
  publicUser,
  setSessionCookie,
  clearSessionCookie,
  hashOneTimeToken,
  hashPassword,
  verifyPassword,
} from './auth.js';
import { sendMail, smtpStatus } from './mail.js';

assertProductionConfig();

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(authOptional);

app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next();
  try {
    const expectedOrigin = new URL(config.publicUrl).origin;
    const requestOrigin = `${req.protocol}://${req.get('host')}`;
    if (origin !== expectedOrigin && origin !== requestOrigin) return res.status(403).json({ error: 'Cross-origin request blocked.' });
  } catch {
    // If PUBLIC_URL is malformed, do not silently weaken request validation.
    return res.status(500).json({ error: 'PUBLIC_URL is invalid.' });
  }
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const contactLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function safeReturnTo(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  return value;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  return ['1','true','yes','on'].includes(String(value || '').toLowerCase());
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function getEmailPreferences() {
  const [rows] = await pool.query('SELECT * FROM email_settings ORDER BY id ASC LIMIT 1');
  if (rows[0]) {
    return {
      ...rows[0],
      notifications_enabled: Boolean(rows[0].notifications_enabled),
    };
  }
  const [result] = await pool.query('INSERT INTO email_settings (notifications_enabled) VALUES (1)');
  const [created] = await pool.query('SELECT * FROM email_settings WHERE id = ?', [result.insertId]);
  return { ...created[0], notifications_enabled: true };
}

async function getFallbackOwnerEmail() {
  const [settingsRows] = await pool.query('SELECT email FROM site_settings ORDER BY id ASC LIMIT 1');
  if (validEmail(settingsRows[0]?.email)) return normalizeEmail(settingsRows[0].email);
  const [adminRows] = await pool.query("SELECT email FROM users WHERE role = 'admin' AND is_active = 1 ORDER BY id ASC LIMIT 1");
  return validEmail(adminRows[0]?.email) ? normalizeEmail(adminRows[0].email) : '';
}

function cleanMailSubject(value, fallback = 'Message from portfolio') {
  return String(value || fallback).replace(/[\r\n]+/g, ' ').trim().slice(0, 255) || fallback;
}

async function createVerificationCode(userId) {
  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await pool.query(
    'INSERT INTO email_verification_codes (user_id, code_hash, expires_at) VALUES (?, ?, ?)',
    [userId, hashOneTimeToken(code), expiresAt]
  );
  return code;
}

// ---------------- Health ----------------
app.get('/api/health', asyncRoute(async (_req, res) => {
  await testDatabase();
  res.json({ ok: true, database: 'mysql' });
}));

// ---------------- Authentication ----------------
app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
  res.json(publicUser(req.user));
});

app.post('/api/auth/login', authLimiter, asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const user = rows[0];
  if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  if (config.auth.requireEmailVerification && !user.email_verified_at) {
    return res.status(403).json({ error: 'Please verify your email before logging in.' });
  }
  setSessionCookie(res, user);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.put('/api/auth/account', authLimiter, requireAdmin, asyncRoute(async (req, res) => {
  const currentPassword = String(req.body.current_password || '');
  const requestedEmail = normalizeEmail(req.body.email || req.user.email);
  const newPassword = String(req.body.new_password || '');

  if (!currentPassword) return res.status(400).json({ error: 'Current password is required.' });
  if (!validEmail(requestedEmail)) return res.status(400).json({ error: 'A valid email is required.' });
  if (newPassword && newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.id]);
  const user = rows[0];
  if (!user || !user.is_active) return res.status(401).json({ error: 'Account is unavailable.' });
  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const updates = [];
  const values = [];

  if (requestedEmail !== normalizeEmail(user.email)) {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [requestedEmail, user.id]);
    if (existing[0]) return res.status(409).json({ error: 'That email address is already in use.' });
    updates.push('email = ?');
    values.push(requestedEmail);
  }

  if (newPassword) {
    updates.push('password_hash = ?');
    values.push(await hashPassword(newPassword));
  }

  if (!updates.length) {
    return res.json({ user: publicUser(user), changed: false });
  }

  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, [...values, user.id]);
  const [freshRows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [user.id]);
  const freshUser = freshRows[0];
  setSessionCookie(res, freshUser);
  res.json({ user: publicUser(freshUser), changed: true });
}));

app.post('/api/auth/register', authLimiter, asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const [existingRows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  let user = existingRows[0];
  const passwordHash = await hashPassword(password);

  if (user) return res.status(409).json({ error: 'An account already exists for this email. Use sign in, resend verification, or password reset instead.' });
  const [result] = await pool.query(
    "INSERT INTO users (email, password_hash, role, is_active) VALUES (?, ?, 'user', 1)",
    [email, passwordHash]
  );
  const [newRows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
  user = newRows[0];

  if (!config.auth.requireEmailVerification) {
    await pool.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?', [user.id]);
    const [freshRows] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
    setSessionCookie(res, freshRows[0]);
    return res.status(201).json({ requires_verification: false, user: publicUser(freshRows[0]) });
  }

  const code = await createVerificationCode(user.id);
  const sent = await sendMail({
    to: email,
    subject: 'Verify your portfolio account',
    text: `Your verification code is ${code}. It expires in 15 minutes.`,
  });

  if (!sent && isProduction) {
    return res.status(503).json({ error: 'Email verification is enabled, but SMTP is not configured.' });
  }
  res.status(201).json({
    requires_verification: true,
    ...(sent ? {} : { dev_otp: code }),
  });
}));

app.post('/api/auth/verify-otp', authLimiter, asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.otpCode || '').trim();
  const [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const user = users[0];
  if (!user) return res.status(400).json({ error: 'Invalid verification code.' });

  const [codes] = await pool.query(
    'SELECT * FROM email_verification_codes WHERE user_id = ? AND consumed_at IS NULL AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [user.id]
  );
  const record = codes[0];
  if (!record || record.code_hash !== hashOneTimeToken(code)) return res.status(400).json({ error: 'Invalid or expired verification code.' });

  await pool.query('UPDATE email_verification_codes SET consumed_at = NOW() WHERE id = ?', [record.id]);
  await pool.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?', [user.id]);
  const [freshRows] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
  setSessionCookie(res, freshRows[0]);
  res.json({ user: publicUser(freshRows[0]) });
}));

app.post('/api/auth/resend-otp', authLimiter, asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const user = users[0];
  if (!user || user.email_verified_at) return res.json({ ok: true });
  const code = await createVerificationCode(user.id);
  const sent = await sendMail({ to: email, subject: 'Your new verification code', text: `Your verification code is ${code}. It expires in 15 minutes.` });
  res.json({ ok: true, ...(sent || isProduction ? {} : { dev_otp: code }) });
}));

app.post('/api/auth/password-reset/request', authLimiter, asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const user = users[0];
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, hashOneTimeToken(token), expiresAt]
    );
    const resetUrl = `${config.publicUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const sent = await sendMail({ to: email, subject: 'Reset your portfolio password', text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in one hour.` });
    if (!sent && !isProduction) console.log(`[password-reset] ${email}: ${resetUrl}`);
  }
  res.json({ ok: true });
}));

app.post('/api/auth/password-reset', authLimiter, asyncRoute(async (req, res) => {
  const token = String(req.body.resetToken || '');
  const newPassword = String(req.body.newPassword || '');
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  const tokenHash = hashOneTimeToken(token);
  const [rows] = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > NOW() LIMIT 1',
    [tokenHash]
  );
  const record = rows[0];
  if (!record) return res.status(400).json({ error: 'Invalid or expired reset link.' });
  const passwordHash = await hashPassword(newPassword);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, record.user_id]);
  await pool.query('UPDATE password_reset_tokens SET consumed_at = NOW() WHERE id = ?', [record.id]);
  res.json({ ok: true });
}));

// Optional Google OAuth. The site still works with email/password when these credentials are omitted.
app.get('/api/auth/google/start', authLimiter, (req, res) => {
  if (!config.google.clientId || !config.google.clientSecret) return res.status(503).send('Google login is not configured.');
  const state = crypto.randomBytes(24).toString('hex');
  const returnTo = safeReturnTo(req.query.returnTo || '/');
  const redirectUri = config.google.redirectUri || `${config.publicUrl}/api/auth/google/callback`;
  res.cookie('portfolio_oauth_state', state, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 10 * 60 * 1000, path: '/' });
  res.cookie('portfolio_oauth_return', returnTo, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 10 * 60 * 1000, path: '/' });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', config.google.clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  res.redirect(url.toString());
});

app.get('/api/auth/google/callback', authLimiter, asyncRoute(async (req, res) => {
  const state = String(req.query.state || '');
  if (!state || state !== req.cookies?.portfolio_oauth_state) return res.status(400).send('Invalid OAuth state.');
  const code = String(req.query.code || '');
  const redirectUri = config.google.redirectUri || `${config.publicUrl}/api/auth/google/callback`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: config.google.clientId, client_secret: config.google.clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  });
  if (!tokenResponse.ok) return res.status(400).send('Google sign-in failed.');
  const tokens = await tokenResponse.json();
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${tokens.access_token}` } });
  if (!profileResponse.ok) return res.status(400).send('Unable to read Google profile.');
  const profile = await profileResponse.json();
  const email = normalizeEmail(profile.email);
  if (!validEmail(email) || profile.email_verified !== true) return res.status(400).send('Google account did not provide a verified email.');

  let [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  let user = users[0];
  if (!user) {
    const [result] = await pool.query(
      "INSERT INTO users (email, role, display_name, avatar_url, email_verified_at, is_active) VALUES (?, 'user', ?, ?, NOW(), 1)",
      [email, profile.name || null, profile.picture || null]
    );
    [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    user = users[0];
  } else {
    await pool.query('UPDATE users SET display_name = COALESCE(?, display_name), avatar_url = COALESCE(?, avatar_url), email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?', [profile.name || null, profile.picture || null, user.id]);
  }
  await pool.query(
    `INSERT INTO user_oauth_accounts (user_id, provider, provider_user_id, provider_email)
     VALUES (?, 'google', ?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), provider_email = VALUES(provider_email)`,
    [user.id, String(profile.sub), email]
  );
  const [freshRows] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
  setSessionCookie(res, freshRows[0]);
  const returnTo = safeReturnTo(req.cookies?.portfolio_oauth_return || '/');
  res.clearCookie('portfolio_oauth_state', { path: '/' });
  res.clearCookie('portfolio_oauth_return', { path: '/' });
  res.redirect(returnTo);
}));

// ---------------- Entity CRUD ----------------
app.get('/api/entities/:entity', asyncRoute(async (req, res) => {
  const def = getEntity(req.params.entity);
  if (!def) return res.status(404).json({ error: 'Unknown entity.' });
  const isAdmin = req.user?.role === 'admin';
  if ((!def.publicRead || def.adminOnly) && !isAdmin) return res.status(403).json({ error: 'Administrator access required.' });

  const filters = [];
  const values = [];
  if (!isAdmin && def.publicWhere) {
    for (const [field, value] of Object.entries(def.publicWhere)) {
      filters.push(`\`${field}\` = ?`);
      values.push(value);
    }
  }

  if (req.query.q) {
    let query;
    try { query = JSON.parse(String(req.query.q)); } catch { return res.status(400).json({ error: 'Invalid filter query.' }); }
    for (const [field, value] of Object.entries(query || {})) {
      if (![...def.fields, 'id', 'base44_id'].includes(field)) continue;
      filters.push(`\`${field}\` = ?`);
      values.push(def.booleans.includes(field) ? (parseBoolean(value) ? 1 : 0) : value);
    }
  }

  const allowedSort = new Set([...def.fields, 'id','created_date','updated_date']);
  let sortField = 'id';
  let direction = 'ASC';
  if (req.query.sort) {
    const raw = String(req.query.sort);
    direction = raw.startsWith('-') ? 'DESC' : 'ASC';
    const candidate = raw.replace(/^-/, '');
    if (allowedSort.has(candidate)) sortField = candidate;
  }
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
  const skip = Math.max(Number(req.query.skip || 0), 0);
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT * FROM \`${def.table}\`${where} ORDER BY \`${sortField}\` ${direction} LIMIT ? OFFSET ?`,
    [...values, limit, skip]
  );
  res.json(rows.map((row) => hydrateRow(def, row)));
}));

app.get('/api/entities/:entity/:id', asyncRoute(async (req, res) => {
  const def = getEntity(req.params.entity);
  if (!def) return res.status(404).json({ error: 'Unknown entity.' });
  const isAdmin = req.user?.role === 'admin';
  if ((!def.publicRead || def.adminOnly) && !isAdmin) return res.status(403).json({ error: 'Administrator access required.' });
  const clauses = ['id = ?'];
  const values = [req.params.id];
  if (!isAdmin && def.publicWhere) {
    for (const [field, value] of Object.entries(def.publicWhere)) { clauses.push(`\`${field}\` = ?`); values.push(value); }
  }
  const [rows] = await pool.query(`SELECT * FROM \`${def.table}\` WHERE ${clauses.join(' AND ')} LIMIT 1`, values);
  if (!rows[0]) return res.status(404).json({ error: 'Record not found.' });
  res.json(hydrateRow(def, rows[0]));
}));

app.post('/api/entities/:entity', asyncRoute(async (req, res) => {
  const def = getEntity(req.params.entity);
  if (!def) return res.status(404).json({ error: 'Unknown entity.' });
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin && !def.publicCreate) return res.status(403).json({ error: 'Administrator access required.' });
  const payload = sanitizePayload(def, req.body);
  validateRequired(def, payload, true);
  if (req.user) payload.created_by_id = req.user.id;
  const fields = Object.keys(payload);
  if (!fields.length) return res.status(400).json({ error: 'No valid fields supplied.' });
  const [result] = await pool.query(
    `INSERT INTO \`${def.table}\` (${fields.map((f) => `\`${f}\``).join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
    fields.map((f) => payload[f])
  );
  const [rows] = await pool.query(`SELECT * FROM \`${def.table}\` WHERE id = ?`, [result.insertId]);
  res.status(201).json(hydrateRow(def, rows[0]));
}));

app.put('/api/entities/:entity/:id', requireAdmin, asyncRoute(async (req, res) => {
  const def = getEntity(req.params.entity);
  if (!def) return res.status(404).json({ error: 'Unknown entity.' });
  const payload = sanitizePayload(def, req.body);
  validateRequired(def, payload, false);
  const fields = Object.keys(payload);
  if (!fields.length) return res.status(400).json({ error: 'No valid fields supplied.' });
  const [result] = await pool.query(
    `UPDATE \`${def.table}\` SET ${fields.map((f) => `\`${f}\` = ?`).join(', ')} WHERE id = ?`,
    [...fields.map((f) => payload[f]), req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Record not found.' });
  const [rows] = await pool.query(`SELECT * FROM \`${def.table}\` WHERE id = ?`, [req.params.id]);
  res.json(hydrateRow(def, rows[0]));
}));

app.delete('/api/entities/:entity/:id', requireAdmin, asyncRoute(async (req, res) => {
  const def = getEntity(req.params.entity);
  if (!def) return res.status(404).json({ error: 'Unknown entity.' });
  if (def.table === 'contact_messages') {
    try {
      await pool.query('DELETE FROM contact_message_replies WHERE contact_message_id = ?', [req.params.id]);
    } catch (error) {
      if (error.code !== 'ER_NO_SUCH_TABLE') throw error;
    }
  }
  const [result] = await pool.query(`DELETE FROM \`${def.table}\` WHERE id = ?`, [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Record not found.' });
  res.json({ ok: true, id: Number(req.params.id) || req.params.id });
}));

// ---------------- Email notifications & CMS replies ----------------
app.get('/api/admin/email-settings', requireAdmin, asyncRoute(async (_req, res) => {
  const settings = await getEmailPreferences();
  const fallbackEmail = await getFallbackOwnerEmail();
  res.json({
    settings: {
      notifications_enabled: Boolean(settings.notifications_enabled),
      notification_email: settings.notification_email || '',
      reply_signature: settings.reply_signature || '',
    },
    fallback_email: fallbackEmail,
    smtp: smtpStatus(),
  });
}));

app.put('/api/admin/email-settings', requireAdmin, asyncRoute(async (req, res) => {
  const current = await getEmailPreferences();
  const notificationEmail = normalizeEmail(req.body.notification_email);
  const replySignature = String(req.body.reply_signature || '').trim().slice(0, 5000);
  if (notificationEmail && !validEmail(notificationEmail)) return res.status(400).json({ error: 'Enter a valid notification email address.' });

  await pool.query(
    'UPDATE email_settings SET notifications_enabled = ?, notification_email = ?, reply_signature = ? WHERE id = ?',
    [parseBoolean(req.body.notifications_enabled) ? 1 : 0, notificationEmail || null, replySignature || null, current.id]
  );
  const fresh = await getEmailPreferences();
  res.json({
    settings: {
      notifications_enabled: Boolean(fresh.notifications_enabled),
      notification_email: fresh.notification_email || '',
      reply_signature: fresh.reply_signature || '',
    },
  });
}));

app.post('/api/admin/email-settings/test', requireAdmin, asyncRoute(async (_req, res) => {
  const status = smtpStatus();
  if (!status.configured) return res.status(503).json({ error: 'SMTP is not configured.' });
  const settings = await getEmailPreferences();
  const to = settings.notification_email || await getFallbackOwnerEmail();
  if (!validEmail(to)) return res.status(400).json({ error: 'Set a valid notification email first.' });

  const info = await sendMail({
    to,
    subject: 'Portfolio email test',
    text: `Your portfolio email settings are working.\n\nSite: ${config.publicUrl}`,
    html: `<p>Your portfolio email settings are working.</p><p><a href="${escapeHtml(config.publicUrl)}">Open portfolio</a></p>`,
  });
  if (!info) return res.status(503).json({ error: 'SMTP is not configured.' });
  res.json({ ok: true, to });
}));

app.get('/api/messages/:id/replies', requireAdmin, asyncRoute(async (req, res) => {
  const [messageRows] = await pool.query('SELECT id FROM contact_messages WHERE id = ? LIMIT 1', [req.params.id]);
  if (!messageRows[0]) return res.status(404).json({ error: 'Message not found.' });
  const [rows] = await pool.query('SELECT * FROM contact_message_replies WHERE contact_message_id = ? ORDER BY sent_date ASC, id ASC', [req.params.id]);
  res.json(rows);
}));

app.post('/api/messages/:id/replies', requireAdmin, asyncRoute(async (req, res) => {
  const status = smtpStatus();
  if (!status.configured) return res.status(503).json({ error: 'SMTP is not configured. Open Email & Replies settings for setup instructions.' });

  const [messageRows] = await pool.query('SELECT * FROM contact_messages WHERE id = ? LIMIT 1', [req.params.id]);
  const message = messageRows[0];
  if (!message) return res.status(404).json({ error: 'Message not found.' });

  const subject = cleanMailSubject(req.body.subject, `Re: ${message.subject || 'Your inquiry'}`);
  const body = String(req.body.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Reply message is required.' });
  if (body.length > 10000) return res.status(400).json({ error: 'Reply is too long.' });

  const settings = await getEmailPreferences();
  const signature = String(settings.reply_signature || '').trim();
  const finalBody = signature ? `${body}\n\n${signature}` : body;
  const replyTo = settings.notification_email || await getFallbackOwnerEmail() || undefined;

  const info = await sendMail({
    to: message.email,
    subject,
    text: finalBody,
    html: `<div style="white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.6">${escapeHtml(finalBody).replaceAll('\n', '<br>')}</div>`,
    replyTo,
  });
  if (!info) return res.status(503).json({ error: 'SMTP is not configured.' });

  const providerMessageId = typeof info === 'object' ? String(info.messageId || '').slice(0, 500) || null : null;
  const [insert] = await pool.query(
    'INSERT INTO contact_message_replies (contact_message_id,admin_user_id,to_email,subject,body,provider_message_id) VALUES (?,?,?,?,?,?)',
    [message.id, req.user.id, message.email, subject, finalBody, providerMessageId]
  );
  await pool.query('UPDATE contact_messages SET `read` = 1 WHERE id = ?', [message.id]);
  const [rows] = await pool.query('SELECT * FROM contact_message_replies WHERE id = ?', [insert.insertId]);
  res.status(201).json(rows[0]);
}));

// ---------------- Contact form ----------------
app.post('/api/contact', contactLimiter, asyncRoute(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);
  const message = String(req.body.message || '').trim();
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required.' });
  if (!validEmail(email)) return res.status(400).json({ error: 'A valid email address is required.' });
  if (message.length > 5000) return res.status(400).json({ error: 'Message is too long.' });

  const payload = {
    name,
    email,
    company: String(req.body.company || '').trim().slice(0, 255) || null,
    subject: String(req.body.subject || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 255) || null,
    project_type: String(req.body.project_type || '').trim().slice(0, 255) || null,
    budget_range: String(req.body.budget_range || '').trim().slice(0, 100) || null,
    message,
  };
  const [result] = await pool.query(
    'INSERT INTO contact_messages (name,email,company,subject,project_type,budget_range,message) VALUES (?,?,?,?,?,?,?)',
    [payload.name,payload.email,payload.company,payload.subject,payload.project_type,payload.budget_range,payload.message]
  );

  let emailSent = false;
  try {
    const emailPrefs = await getEmailPreferences();
    const ownerEmail = emailPrefs.notification_email || await getFallbackOwnerEmail();
    if (emailPrefs.notifications_enabled && validEmail(ownerEmail)) {
      const mailSubject = cleanMailSubject(payload.subject ? `New inquiry: ${payload.subject}` : 'New portfolio inquiry');
      const adminUrl = `${config.publicUrl}/admin/messages/${result.insertId}`;
      const text = [
        'You received a new message from your portfolio contact form.', '',
        `Name: ${name}`, `Email: ${email}`,
        payload.company ? `Company: ${payload.company}` : '',
        payload.project_type ? `Project type: ${payload.project_type}` : '',
        payload.budget_range ? `Budget: ${payload.budget_range}` : '', '',
        'Message:', message, '', `Open in CMS: ${adminUrl}`,
      ].filter(Boolean).join('\n');
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2 style="margin:0 0 16px">New portfolio inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}<br>
          <strong>Email:</strong> ${escapeHtml(email)}${payload.company ? `<br><strong>Company:</strong> ${escapeHtml(payload.company)}` : ''}${payload.project_type ? `<br><strong>Project type:</strong> ${escapeHtml(payload.project_type)}` : ''}${payload.budget_range ? `<br><strong>Budget:</strong> ${escapeHtml(payload.budget_range)}` : ''}</p>
          <div style="padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;white-space:pre-wrap">${escapeHtml(message)}</div>
          <p style="margin-top:20px"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:10px 14px;background:#0f172a;color:white;text-decoration:none;border-radius:6px">Open message & reply</a></p>
        </div>`;
      const info = await sendMail({ to: ownerEmail, subject: mailSubject, text, html, replyTo: email });
      emailSent = Boolean(info);
    }
  } catch (error) {
    console.error('Contact notification email failed:', error.message);
    emailSent = false;
  }
  res.status(201).json({ ok: true, id: result.insertId, emailSent });
}));

// ---------------- Uploads ----------------
fs.mkdirSync(config.uploads.dir, { recursive: true });
const SAFE_UPLOAD_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.uploads.dir),
    filename: (_req, file, cb) => {
      const ext = SAFE_UPLOAD_TYPES.get(file.mimetype);
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: config.uploads.maxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (SAFE_UPLOAD_TYPES.has(file.mimetype)) return cb(null, true);
    const error = new Error('Unsupported file type. Allowed: JPG, PNG, WebP, GIF, PDF, DOC, DOCX.');
    error.status = 400;
    cb(error, false);
  },
});

app.use('/uploads', express.static(config.uploads.dir, { fallthrough: false, maxAge: isProduction ? '7d' : 0 }));
app.post('/api/uploads', requireAdmin, upload.single('file'), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required.' });
  const publicUrl = `/uploads/${encodeURIComponent(req.file.filename)}`;
  await pool.query(
    'INSERT INTO uploaded_files (original_name,stored_name,mime_type,size_bytes,storage_driver,storage_path,public_url,created_by_id) VALUES (?,?,?,?,?,?,?,?)',
    [req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, 'local', req.file.path, publicUrl, req.user.id]
  );
  res.status(201).json({ file_url: publicUrl });
}));

// ---------------- Error handler ----------------
app.use('/api', (req, res) => res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` }));
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(err);
  let status = err.status || 500;
  let message = err.message || 'Internal server error.';
  if (err.code === 'LIMIT_FILE_SIZE') { status = 413; message = 'File is too large.'; }
  if (err.code === 'ER_DUP_ENTRY') { status = 409; message = 'A record with the same unique value already exists.'; }
  if (err.code === 'ER_BAD_NULL_ERROR') { status = 400; message = 'A required field is missing.'; }
  if (err.code === 'WARN_DATA_TRUNCATED') { status = 400; message = 'One of the supplied values is invalid.'; }
  res.status(status).json({ error: message });
});

// ---------------- Frontend ----------------
if (isProduction) {
  const dist = path.resolve('dist');
  app.use(express.static(dist));
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(config.port, async () => {
  try {
    await testDatabase();
    console.log(`Portfolio running at ${config.publicUrl}`);
    console.log(`MySQL connected to ${config.db.host}:${config.db.port}/${config.db.database}`);
  } catch (error) {
    console.error('Server started, but MySQL connection failed:', error.message);
    console.error('Run `npm run db:init` after configuring .env.');
  }
});
