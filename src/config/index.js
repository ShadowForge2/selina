const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

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
  
  SUPPORT_LINK: process.env.SUPPORT_LINK || 'https://t.me/CPBsupport',
  CHANNEL_LINK: process.env.CHANNEL_LINK || 'https://t.me/CPBloomFXChannel',
  WEBSITE_LINK: process.env.WEBSITE_LINK || 'https://xprfire.site',
  CONTACT_ADMIN_LINK: process.env.CONTACT_ADMIN_LINK || 'https://t.me/CPBloomFXAdmin',
  GROUP_LINK: process.env.GROUP_LINK || 'https://t.me/CPBloomFXGroup',
  
  WARN_LIMIT: parseInt(process.env.WARN_LIMIT || '3', 10),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  SIGN_UP_URL: process.env.SIGN_UP_URL || 'https://xprfire.site',
  SUPPORT_USERNAME: process.env.SUPPORT_USERNAME || 'CPBsupport'
};

// Check if critical configurations exist
if (!config.BOT_TOKEN) {
  console.warn('\x1b[31m[WARNING] BOT_TOKEN is missing! The Telegram bot will not start.\x1b[0m');
}

module.exports = config;
