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
  welcomeTemplate: (firstName, username, userId, timeoutSecs) => {
    const mention = `[${esc(firstName)}](tg://user?id=${userId})`;
    return `${header('Welcome to CPBloomFX', '📈')}` +
      `Welcome to our elite trading community, ${mention} ${username ? `\\(@${esc(username)}\\)` : ''}\\!\n\n` +
      `🔒 *SECURITY CHECK:* To prevent bots and spam, you must complete the verification process below within *${timeoutSecs} seconds*\\.\n\n` +
      `⚠️ *Note:* Failure to verify will result in an automatic kick\\.` +
      `${DIVIDER}` +
      `🌐 *CPBloomFX* is a premium trading space dedicated to financial growth, market analysis, and professional networking\\. Make sure to read the rules before chatting\\!`;
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
      `• *Step 1:* Complete group verification if you just joined\\.\n` +
      `• *Step 2:* Subscribe to our *📢 Official Channel* for live trades\\.\n` +
      `• *Step 3:* Check out the *📘 Getting Started* section below to learn about our products\\.\n` +
      `• *Step 4:* Use our *💬 Support* button if you require assistance\\.\n\n` +
      `📊 *Join Referrals:* You can invite friends to CPBloomFX and build your ranking\\! Share your custom referral link to earn points\\.`;
  },

  // APK Download and Installation Instructions Template
  apkInstructionsTemplate: (downloadUrl) => {
    if (!downloadUrl) downloadUrl = require('../config').APK_DOWNLOAD_URL;
    return `${header('Download BloomFX App', '📱')}` +
      `To start copytrading and manage your financial deposits, download and install our official Android Application\\!\n\n` +
      `📥 *INSTALLATION INSTRUCTIONS:*\n` +
      `1️⃣ Click the button below to download the installer\\.\n` +
      `2️⃣ Open the downloaded file\\. If prompted, enable *"Install from Unknown Sources"* in your security settings\\.\n` +
      `3️⃣ Click *Install* and open the BloomFX App\\.\n` +
      `4️⃣ Register your trading account and connect to our automated MT4/MT5 CopyTrading node\\!\n\n` +
      `👉 [Download BloomFX APK](${downloadUrl})\n\n` +
      `⚠️ *Note:* Only download the app installer from our official portals to protect your assets\\.`;
  }
};
