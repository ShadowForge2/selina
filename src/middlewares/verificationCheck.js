const { User } = require('../database/models/User');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');
const { esc } = require('../utils/formatter');

/**
 * Verification Checker Middleware
 * Blocks unverified users from sending messages in group chats.
 * Returns true if user is verified / allowed, false if blocked.
 */
async function processVerificationCheck(msg) {
  const { chat, from, message_id } = msg;

  // 1. Skip check if private DM
  if (chat.type === 'private') return true;

  // 2. Admins are auto-verified / bypass
  const isAdmin = await telegramService.isAdmin(chat.id, from.id);
  if (isAdmin) return true;

  // 3. Fetch user status from database
  const dbUser = await User.findByTelegramId(from.id);

  // If user does not exist in DB (e.g., they joined before the bot was added), 
  // we auto-create them as verified to avoid locking out existing community members.
  if (!dbUser) {
    await User.upsertUser(from.id, {
      username: from.username || '',
      firstName: from.first_name,
      isVerified: true
    });
    return true;
  }

  // 4. Block if explicit false
  if (dbUser.isVerified === false) {
    logger.info(`[VERIFY CHECK] Blocked unverified message from @${from.username || from.first_name}`);
    
    // Delete the unauthorized message
    await telegramService.deleteMessage(chat.id, message_id);

    // Send a temporary direct message reminder if possible
    const reminderText = `⚠️ *CPBloomFX Verification Required* ⚠️\n\n` +
      `You are currently restricted from posting in *${esc(chat.title)}*\\.\n` +
      `Please complete the security captcha verification by clicking the *Verify* button in the group welcome message\\!\n\n` +
      `⏳ _Note: Unverified members are auto\\-kicked after a brief period\\._`;
    
    await telegramService.sendDirectMessage(from.id, reminderText);
    return false;
  }

  return true;
}

module.exports = {
  processVerificationCheck
};
