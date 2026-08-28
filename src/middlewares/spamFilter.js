const telegramService = require('../services/telegramService');
const { User } = require('../database/models/User');
const { Stat } = require('../database/models/Stat');
const { hasUnethicalWords } = require('../utils/wordList');
const aiService = require('../services/aiService');
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

  // 4. Unethical Words/Profanity Filtering (Gemini-enhanced)
  const localProfanity = text && hasUnethicalWords(text);

  if (text) {
    const geminiEnabled = !!config.GEMINI_API_KEY;

    // A) Local matcher found a potential violation -> confirm with Gemini if
    //    available, so legitimate questions/doubt (e.g. "is this a scam?")
    //    are NOT wrongly flagged. Without a key, keep the old behavior.
    if (localProfanity) {
      if (geminiEnabled) {
        const verdict = await aiService.detectUnethical(text);
        if (!verdict.unethical) {
          logger.info(`[WORD FILTER] Gemini cleared legitimate doubt/discussion: "${text}"`);
        } else {
          logger.warn(`[GEMINI FILTER] Confirmed violation for @${username}: ${verdict.reason || 'unethical language'}`);
          await handleViolation(chat.id, from.id, username, message_id, verdict.reason || 'Using unethical or profane language');
          return false;
        }
      } else {
        logger.warn(`[WORD FILTER] User @${username} used unethical/profane words.`);
        await handleViolation(chat.id, from.id, username, message_id, 'Using unethical or profane language');
        return false;
      }
    }

    // B) No local keyword, but the message touches a sensitive topic -> let
    //    Gemini catch cleverly-worded abuse, false accusations, or scams that
    //    bypass the word list.
    if (geminiEnabled && !localProfanity && maybeSensitive(text)) {
      const verdict = await aiService.detectUnethical(text);
      if (verdict.unethical) {
        logger.warn(`[GEMINI FILTER] Flagged disguised unethical message for @${username}: ${verdict.reason}`);
        await handleViolation(chat.id, from.id, username, message_id, verdict.reason || 'Unethical or disruptive content');
        return false;
      }
    }
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
      const restrictionCount = (dbUser.restrictionCount || 0) + 1;

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

/**
 * Gate to decide whether a message is worth sending to Gemini for ethics
 * review (i.e. it touches safety, money, trust, abuse, or scam topics).
 * Keeps Gemini calls focused instead of running on every group message.
 */
const SENSITIVE_HINTS = [
  'scam', 'fraud', 'fake', 'ponzi', 'trust', 'safe', 'legit', 'secure',
  'suspect', 'suspicious', 'steal', 'theft', 'thief', 'criminal',
  'money', 'withdraw', 'deposit', 'invest', 'profit', 'fund', 'wallet',
  'airdrop', 'phish', 'hack', 'seed phrase', 'private key', 'recover',
  'send me', 'dm me', 'verify', 'idiot', 'stupid', 'dumb', 'fool',
  'profit', 'rich', 'guaranteed', '100x', 'bonus', 'referral'
];

function maybeSensitive(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SENSITIVE_HINTS.some(hint => lower.includes(hint));
}

module.exports = {
  processSpamFilter
};