/**
 * Helper to escape special MarkdownV2 characters for Telegram messages.
 * Characters to escape: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
function esc(text) {
  if (!text) return '';
  return String(text).replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

/**
 * Creates a premium FinTech/Crypto style header
 */
function header(title, icon = '⚡') {
  return `*${icon} ━━━ ${esc(title.toUpperCase())} ━━━ ${icon}*\n\n`;
}

/**
 * Modern Divider for visual spacing
 */
const DIVIDER = `\n\`━━━━━━━━━━━━━━━━━━━━━━━━━━\`\n\n`;

/**
 * Custom modern styled key-value list builder
 */
function keyVal(key, val, icon = '🔹') {
  return `${icon} *${esc(key)}:* \`${esc(val)}\`\n`;
}

module.exports = {
  esc,
  header,
  DIVIDER,
  keyVal,
  
  // Welcome message template
  welcomeTemplate: (firstName, username, userId) => {
    const mention = `[${esc(firstName)}](tg://user?id=${userId})`;
    return `${header('Welcome to CPBloomFX', '📈')}` +
      `Welcome to our elite trading community, ${mention} ${username ? `\\(@${esc(username)}\\)` : ''}\\!\n\n` +
      `🛡️ Please respect the community rules so we can keep this a safe and professional space\\. Any violation may result in a ban\\.\n\n` +
      `👉 Read the rules using \`/rules\` and enjoy your stay\\!` +
      `${DIVIDER}` +
      `🌐 *CPBloomFX* is a premium trading space dedicated to financial growth, market analysis, and professional networking\\.`;
  },
  
  // Rules message template
  rulesTemplate: () => {
    return `${header('Community Rules', '🛡️')}` +
      `To maintain a high-quality learning environment, please adhere to these rules:\n\n` +
      `1️⃣ *No Spam or Unsolicited Links* \n   Auto-deleted, repeat offenders will be muted/banned\\.\n` +
      `2️⃣ *Professional Language Only* \n   Unethical, offensive, or derogatory language is strictly banned\\.\n` +
      `3️⃣ *No Unsolicited DMs to Members* \n   Report any spammer to administrators immediately\\.\n` +
      `4️⃣ *Admin Decorum* \n   Respect the decisions of moderators\\. Admin instructions are final\\.` +
      `${DIVIDER}` +
      `💡 *Tip:* Use \`/help\` to explore community commands, or click \`💬 Support\` in the main DM menu to speak with our support representatives\\.`;
  },

  // DM Welcome Tutorial Template
  dmWelcomeTemplate: (firstName) => {
    return `${header('CPBloomFX Assistant', '🤖')}` +
      `Hello *${esc(firstName)}*\\! Welcome to your direct console for CPBloomFX\\.\n\n` +
      `🚀 *HOW TO START GUIDE:*\n` +
      `• *Step 1:* Subscribe to our *📢 Official Channel* for live trades\\.\n` +
      `• *Step 2:* Check out the *📘 Getting Started* section below to learn about our products\\.\n` +
      `• *Step 3:* Use our *💬 Support* button if you require assistance\\.\n\n` +
      `📊 *Platform:* Visit our website ${esc(require('../config').WEBSITE_LINK)} to access the platform\\.`;
  }
};
