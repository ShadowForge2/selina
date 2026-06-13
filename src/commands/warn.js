const telegramService = require('../services/telegramService');
const { User } = require('../database/models/User');
const { Stat } = require('../database/models/Stat');
const { esc } = require('../utils/formatter');
const logger = require('../utils/logger');
const config = require('../config');

module.exports = {
  name: 'warn',
  description: 'Issue a formal warning to a user (Admin only). Usage: /warn <userId/reply> [reason]',
  adminOnly: true,
  async execute(msg, args, bot) {
    const { chat, from, reply_to_message } = msg;

    if (chat.type === 'private') {
      return await telegramService.sendMessage(chat.id, `❌ Moderation commands can only be executed within group chats\\.`);
    }

    let targetUserId = null;
    let targetUsername = '';
    let reason = 'Violating community guidelines';

    // Parse target and reason
    if (reply_to_message) {
      targetUserId = reply_to_message.from.id;
      targetUsername = reply_to_message.from.username || reply_to_message.from.first_name;
      if (args.length > 0) {
        reason = args.join(' ');
      }
    } else if (args.length > 0) {
      const parsedId = parseInt(args[0], 10);
      if (!isNaN(parsedId)) {
        targetUserId = parsedId;
        targetUsername = `User ID ${parsedId}`;
        if (args.length > 1) {
          reason = args.slice(1).join(' ');
        }
      }
    }

    if (!targetUserId) {
      return await telegramService.sendMessage(chat.id, `❌ *Usage:* Reply to a user's message with \`/warn [reason]\` or use \`/warn <userId> [reason]\`\\.`);
    }

    const targetIsAdmin = await telegramService.isAdmin(chat.id, targetUserId);
    if (targetIsAdmin) {
      return await telegramService.sendMessage(chat.id, `❌ Error: Cannot warn an administrator of this community\\.`);
    }

    try {
      // 1. Add warning in DB
      const dbUser = await User.addWarning(targetUserId);
      await Stat.incrementMetric('warnsCount');

      logger.moderation(from.username || from.first_name, targetUsername, 'WARN', reason);

      // 2. Check warning threshold
      if (dbUser.warningCount >= config.WARN_LIMIT) {
        // Mute user for 24 hours (1440 mins)
        const muteSuccess = await telegramService.muteUser(chat.id, targetUserId, 1440);
        if (muteSuccess) {
          await User.upsertUser(targetUserId, { isMuted: true, muteExpiresAt: new Date(Date.now() + 1440 * 60 * 1000) });
          await User.resetWarnings(targetUserId);
          await Stat.incrementMetric('bansCount');

          const autoMuteText = `🚨 *COMMUNITY PROTECTION ACTION* 🚨\n\n` +
            `👤 *User:* @${esc(targetUsername)}\n` +
            `⚖️ *Action:* *TEMPORARY MUTE \\(24 Hours\\)*\n` +
            `📝 *Reason:* Exceeded maximum warning limit \\(*${config.WARN_LIMIT}/${config.WARN_LIMIT}*\\) for: _${esc(reason)}_\n\n` +
            `💡 _Muted members cannot send text or media. Maintain professionalism to stay verified._`;
          
          await telegramService.sendMessage(chat.id, autoMuteText);
        }
      } else {
        const remainingWarns = config.WARN_LIMIT - dbUser.warningCount;
        const warnNoticeText = `⚠️ *RULE VIOLATION ALERT* ⚠️\n\n` +
          `👤 *Member:* @${esc(targetUsername)}\n` +
          `👮‍♂️ *Actioned By:* @${esc(from.username || from.first_name)}\n` +
          `📝 *Reason:* _${esc(reason)}_\n` +
          `🛑 *Status:* Registered Warn \\(*${dbUser.warningCount}/${config.WARN_LIMIT}*\\)\n\n` +
          `⚠️ You have *${remainingWarns} warning\\(s\\)* left before being temporarily restricted\\. Please read community rules via \`/rules\`\\.`;

        await telegramService.sendMessage(chat.id, warnNoticeText);
      }

    } catch (error) {
      logger.error('Failed executing warn command:', error.message);
    }
  }
};
