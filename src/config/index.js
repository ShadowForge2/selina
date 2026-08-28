const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ── SUPPORT CHANNEL GUARD ──────────────────────────────────────────────────
// The business owner wants ALL support references to point to @CPBsupport ONLY.
// A stale/stray SUPPORT_LINK / SUPPORT_USERNAME override (e.g. pointing at an
// old admin account) must never leak through, so we resolve the "real" support
// account here and coerce any disallowed value back to CPBsupport.
const SUPPORT_HANDLE = 'CPBsupport';
const SUPPORT_URL = 'https://t.me/CPBsupport';

// Handles/links that are NOT allowed as the public support account.
const DISALLOWED_SUPPORT = [
  'mia_malcovaofficialmanagement',
  'mia_malcovaofficial',
  'mia',
  'cpbloomfxadmin'
];

function normalizeSupportUsername(raw) {
  if (!raw) raw = SUPPORT_HANDLE;
  const withoutPrefix = String(raw).replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '').toLowerCase();
  return DISALLOWED_SUPPORT.includes(withoutPrefix) ? SUPPORT_HANDLE : String(raw).replace(/^@/, '');
}

function normalizeSupportLink(raw) {
  if (!raw) raw = SUPPORT_URL;
  return /mia_malcovaofficial/i.test(raw) || /cpbloomfxadmin/i.test(raw) ? SUPPORT_URL : raw;
}

const config = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/cpbloomfx',
  
  // Parse comma-separated Admin IDs to an array of integers
  ADMIN_IDS: (process.env.ADMIN_IDS || '')
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id)),
  
  CHANNEL_ID: process.env.CHANNEL_ID || '',
  GROUP_ID: process.env.GROUP_ID || '',
  
  SUPPORT_LINK: normalizeSupportLink(process.env.SUPPORT_LINK),
  CHANNEL_LINK: process.env.CHANNEL_LINK || 'https://t.me/CPBloomFXChannel',
  WEBSITE_LINK: process.env.WEBSITE_LINK || 'https://xprfire.site',
  CONTACT_ADMIN_LINK: process.env.CONTACT_ADMIN_LINK || 'https://t.me/CPBloomFXAdmin',
  GROUP_LINK: process.env.GROUP_LINK || 'https://t.me/CPBloomFXGroup',
  
  WARN_LIMIT: parseInt(process.env.WARN_LIMIT || '3', 10),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  SIGN_UP_URL: process.env.SIGN_UP_URL || 'https://xprfire.site',
  SUPPORT_USERNAME: normalizeSupportUsername(process.env.SUPPORT_USERNAME),

  // Connection mode: 'webhook' (production / Render) or 'polling' (local dev)
  // Auto-select webhook when WEBHOOK_URL is set; otherwise fall back to polling.
  CONNECTION_MODE: (process.env.CONNECTION_MODE || (process.env.WEBHOOK_URL ? 'webhook' : 'polling')),
  WEBHOOK_URL: process.env.WEBHOOK_URL || '',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '',
  RENDER_URL: process.env.RENDER_URL || ''
};

// Check if critical configurations exist
if (!config.BOT_TOKEN) {
  console.warn('\x1b[31m[WARNING] BOT_TOKEN is missing! The Telegram bot will not start.\x1b[0m');
}

module.exports = config;
