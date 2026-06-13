const telegramService = require('../services/telegramService');
const { User } = require('../database/models/User');
const { esc } = require('../utils/formatter');
const logger = require('../utils/logger');
const { Stat } = require('../database/models/Stat');

module.exports = {
  name: 'ban',
  description: 'Permanently ban a member from the group (Admin only). Usage: /ban <userId/reply>',
  adminOnly: true,
  async execute(msg, args, bot) {
    const { chat, from, reply_to_message } = msg;

    if (chat.type === 'private') {
      return await telegramService.sendMessage(chat.id, `❌ Moderation commands can only be executed within group chats\\.`);
    }

    let targetUserId = null;
    let targetUsername = '';

    if (reply_to_message) {
      targetUserId = reply_to_message.from.id;
      targetUsername = reply_to_message.from.username || reply_to_message.from.first_name;
    } else if (args.length > 0) {
      const parsedId = parseInt(args[0], 10);
      if (!isNaN(parsedId)) {
        targetUserId = parsedId;
        targetUsername = `User ID ${parsedId}`;
      }
    }

    if (!targetUserId) {
      return await telegramService.sendMessage(chat.id, `❌ *Usage:* Reply to a user's message with \`/ban\` or use \`/ban <userId>\`\\.`);
    }

    const targetIsAdmin = await telegramService.isAdmin(chat.id, targetUserId);
    if (targetIsAdmin) {
      return await telegramService.sendMessage(chat.id, `❌ Error: Cannot ban an administrator of this community\\.`);
    }

    try {
      const success = await telegramService.banUser(chat.id, targetUserId);
      if (success) {
        // Save to DB
        await User.upsertUser(targetUserId, { isBanned: true });
        await Stat.incrementMetric('bansCount');

        logger.moderation(from.username || from.first_name, targetUsername, 'BAN', 'Manual administration eject');

        await telegramService.sendMessage(chat.id, `🚨 *ADMIN ACTION:* @${esc(targetUsername)} has been *PERMANENTLY BANNED* from this community\\.`);
      } else {
        await telegramService.sendMessage(chat.id, `❌ Failed to ban user\\. Ensure the bot has administrative privileges in this group\\.` +
          `\n\n_Required Permission: Ban Members_`);
      }
    } catch (error) {
      logger.error('Failed executing ban command:', error.message);
    }
  }
};
