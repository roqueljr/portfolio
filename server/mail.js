import nodemailer from 'nodemailer';
import { config } from './config.js';

let transporter;

function brevoConfigured() {
  return Boolean(config.brevo.apiKey && config.brevo.fromEmail);
}

function smtpConfigured() {
  return Boolean(config.smtp.host && config.smtp.from);
}

function getTransporter() {
  if (!smtpConfigured()) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.password }
        : undefined,

      // Avoid the UI appearing to hang for minutes if SMTP is unreachable.
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      dnsTimeout: 10000,
    });
  }

  return transporter;
}

function parseAddress(value, fallbackEmail = '', fallbackName = '') {
  const text = String(value || '').trim();
  const match = text.match(/^(.*?)\s*<([^<>]+)>$/);

  if (match) {
    return {
      name: match[1].replace(/^["']|["']$/g, '').trim() || fallbackName,
      email: match[2].trim() || fallbackEmail,
    };
  }

  if (text.includes('@')) {
    return { name: fallbackName, email: text };
  }

  return { name: text || fallbackName, email: fallbackEmail };
}

async function sendViaBrevo({ to, subject, text, html, replyTo, from, headers }) {
  const sender = from
    ? parseAddress(from, config.brevo.fromEmail, config.brevo.fromName)
    : { email: config.brevo.fromEmail, name: config.brevo.fromName };

  if (!sender.email) throw new Error('BREVO_FROM_EMAIL is required.');

  const recipient = parseAddress(to);
  if (!recipient.email) throw new Error('A valid recipient email address is required.');

  const payload = {
    sender: {
      email: sender.email,
      ...(sender.name ? { name: sender.name } : {}),
    },
    to: [
      {
        email: recipient.email,
        ...(recipient.name ? { name: recipient.name } : {}),
      },
    ],
    subject,
  };

  if (html) payload.htmlContent = html;
  else payload.textContent = text || '';

  if (replyTo) {
    const reply = parseAddress(replyTo);
    if (reply.email) {
      payload.replyTo = {
        email: reply.email,
        ...(reply.name ? { name: reply.name } : {}),
      };
    }
  }

  if (headers && Object.keys(headers).length) {
    payload.headers = headers;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': config.brevo.apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw };
    }

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Brevo email API returned HTTP ${response.status}.`;
      throw new Error(message);
    }

    return {
      messageId: data?.messageId || '',
      provider: 'brevo',
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Email provider timed out after 15 seconds.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Kept as smtpStatus() so existing server/index.js routes do not need changing.
export function smtpStatus() {
  if (brevoConfigured()) {
    return {
      configured: true,
      provider: 'brevo',
      providerLabel: 'Brevo HTTPS API',
      from: `${config.brevo.fromName || 'Portfolio'} <${config.brevo.fromEmail}>`,
      host: 'api.brevo.com',
      port: 443,
      secure: true,
    };
  }

  return {
    configured: smtpConfigured(),
    provider: smtpConfigured() ? 'smtp' : '',
    providerLabel: smtpConfigured() ? 'SMTP' : '',
    from: config.smtp.from || '',
    host: config.smtp.host || '',
    port: config.smtp.port,
    secure: config.smtp.secure,
  };
}

export async function sendMail({ to, subject, text, html, replyTo, from, headers }) {
  // Render Free blocks outbound SMTP ports. Prefer the HTTPS API whenever configured.
  if (brevoConfigured()) {
    return sendViaBrevo({ to, subject, text, html, replyTo, from, headers });
  }

  const tx = getTransporter();
  if (!tx) return false;

  const info = await tx.sendMail({
    from: from || config.smtp.from,
    to,
    subject,
    text,
    html,
    replyTo,
    headers,
  });

  return info || true;
}
