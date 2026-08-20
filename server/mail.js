import nodemailer from 'nodemailer';
import { config } from './config.js';

let transporter;

function getTransporter() {
  if (!config.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.password } : undefined,
    });
  }
  return transporter;
}

export function smtpStatus() {
  return {
    configured: Boolean(config.smtp.host && config.smtp.from),
    from: config.smtp.from || '',
    host: config.smtp.host || '',
    port: config.smtp.port,
    secure: config.smtp.secure,
  };
}

export async function sendMail({ to, subject, text, html, replyTo, from, headers }) {
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
