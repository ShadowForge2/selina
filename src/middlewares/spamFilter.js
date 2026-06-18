const telegramService = require('../services/telegramService');
const { User } = require('../database/models/User');
const { Stat } = require('../database/models/Stat');
const { hasUnethicalWords } = require('../utils/wordList');
const config = require('../config');
const logger = require('../utils/logger');
const { esc } = require('../utils/formatter');

// In-Memory Flood Tracker: Map of userId -> Array of timestamps
const floodTracker = new Map();
const FLOOD_LIMIT = 5; // max 5 messages
const FLOOD_WINDOW_MS = 5000; // per 5 seconds

/**
 * Anti-Spam, Anti-Flood, Profanity and Link Filtering Middleware
 * Returns true if message is clean, false if message is deleted/violates rules
 */
async function processSpamFilter(msg) {
  const { chat, from, text, message_id } = msg;

  // 1. Skip checks if private DM or if user is administrator
  if (chat.type === 'private') return true;
  
  const isAdmin = await telegramService.isAdmin(chat.id, from.id, msg);
  if (isAdmin) return true;

  // Log message stats
  await Stat.incrementMetric('messagesCount');

  const username = from.username || from.first_name;

  // 2. Anti-Flood Detection (Message flood check)
  const now = Date.now();
  if (!floodTracker.has(from.id)) {
    floodTracker.set(from.id, []);
  }
  
  const userTimestamps = floodTracker.get(from.id);
  // Keep only timestamps within the current window
  const activeTimestamps = userTimestamps.filter(ts => now - ts < FLOOD_WINDOW_MS);
  activeTimestamps.push(now);
  floodTracker.set(from.id, activeTimestamps);

  if (activeTimestamps.length > FLOOD_LIMIT) {
    logger.warn(`[FLOOD PROTECT] User @${username} is flooding messages.`);
    await handleViolation(chat.id, from.id, username, message_id, 'Flood/Spamming messages too quickly');
    return false;
  }

  // 3. Link Detection (http, https, www, t.me invite links)
  const hasLink = text && (
    /https?:\/\//gi.test(text) || 
    /www\./gi.test(text) || 
    /\w+\.(com|net|org|xyz|io|co|me|cc|biz|info)/gi.test(text) ||
    /t\.me\//gi.test(text)
  );

  if (hasLink) {
    logger.warn(`[SPAM FILTER] User @${username} sent unauthorized link.`);
    await handleViolation(chat.id, from.id, username, message_id, 'Posting unauthorized links/invites');
    return false;
  }

  // 4. Unethical Words/Profanity Filtering
  const hasProfanity = text && hasUnethicalWords(text);
  if (hasProfanity) {
    logger.warn(`[WORD FILTER] User @${username} used unethical/profane words.`);
    await handleViolation(chat.id, from.id, username, message_id, 'Using unethical or profane language');
    return false;
  }

  return true;
}

/**
 * Handles action when a violation occurs:
 * Deletes the message, increments warning, alerts community, and mutes if warnings exceed limit.
 */
async function handleViolation(chatId, userId, username, messageId, reason) {
  try {
    // 1. Delete offending message
    await telegramService.deleteMessage(chatId, messageId);

    // 2. Increment warn count in DB
    const dbUser = await User.addWarning(userId);
    await Stat.incrementMetric('warnsCount');
    
    logger.moderation('SYSTEM', username, 'WARNING', `${reason} (Warn Count: ${dbUser.warningCount})`);

    // 3. Check if user exceeded warn limit
    if (dbUser.warningCount >= config.WARN_LIMIT) {
      // Get current restriction count and increment
      const currentUser = await User.findByTelegramId(userId);
      const restrictionCount = (currentUser ? currentUser.restrictionCount || 0 : 0) + 1;

      // If restricted 3 times already, permanent ban
      if (restrictionCount >= 3) {
        const banSuccess = await telegramService.banUser(chatId, userId);
        if (banSuccess) {
          await User.upsertUser(userId, { isBanned: true, restrictionCount });
          await User.resetWarnings(userId);
          await Stat.incrementMetric('bansCount');

          const banNoticeText = `🚨 *COMMUNITY PROTECTION ACTION* 🚨\n\n` +
            `👤 *User:* @${esc(username)}\n` +
            `⚖️ *Action:* *PERMANENTLY BANNED*\n` +
            `📝 *Reason:* Repeated violations after ${restrictionCount - 1} temporary restrictions \\(final\\)\n\n` +
            `💡 _This user has been permanently removed from the community._`;

          await telegramService.sendMessage(chatId, banNoticeText);
        }
        return;
      }

      // Temporary restrict for 5 days (7200 mins)
      const muteDurationMinutes = 7200;
      const muteSuccess = await telegramService.muteUser(chatId, userId, muteDurationMinutes);

      if (muteSuccess) {
        await User.upsertUser(userId, {
          isMuted: true,
          muteExpiresAt: new Date(Date.now() + muteDurationMinutes * 60000),
          restrictionCount
        });
        await User.resetWarnings(userId);
        await Stat.incrementMetric('bansCount');

        const remainingRestricts = 3 - restrictionCount;
        const muteNoticeText = `🚨 *COMMUNITY PROTECTION ACTION* 🚨\n\n` +
          `👤 *User:* @${esc(username)}\n` +
          `⚖️ *Action:* *TEMPORARY RESTRICTION \\(5 Days\\)*\n` +
          `📝 *Reason:* Exceeded maximum warnings for: _${esc(reason)}_\n` +
          `⚠️ *Restriction ${restrictionCount}/3* — You have *${remainingRestricts} restriction\\(s\\)* remaining before a permanent ban\\.\n\n` +
          `💡 _Restricted members can view messages but cannot send text or media._`;

        await telegramService.sendMessage(chatId, muteNoticeText);
      }
    } else {
      // Send group warning message
      const remainingWarns = config.WARN_LIMIT - dbUser.warningCount;
      const warningNoticeText = `⚠️ *RULE VIOLATION ALERT* ⚠️\n\n` +
        `👤 *Member:* @${esc(username)}\n` +
        `📝 *Violation:* _${esc(reason)}_\n` +
        `🛑 *Status:* Deleted \\+ Registered Warn \\(*${dbUser.warningCount}/${config.WARN_LIMIT}*\\)\n\n` +
        `⚠️ *Notice:* You have *${remainingWarns} warning\\(s\\)* left before being temporarily restricted\\. Please read community rules via \`/rules\`\\.`;

      await telegramService.sendMessage(chatId, warningNoticeText);
    }
  } catch (error) {
    logger.error('Failed to handle spam violation:', error.message);
  }
}

module.exports = {
  processSpamFilter
};
