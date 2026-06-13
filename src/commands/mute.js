const telegramService = require('../services/telegramService');
const { User } = require('../database/models/User');
const { esc } = require('../utils/formatter');
const logger = require('../utils/logger');

module.exports = {
  name: 'mute',
  description: 'Restrict a group member from sending messages (Admin only). Usage: /mute <userId/reply> [duration_mins]',
  adminOnly: true,
  async execute(msg, args, bot) {
    const { chat, from, reply_to_message } = msg;

    // 1. Ensure this is executed in a group
    if (chat.type === 'private') {
      return await telegramService.sendMessage(chat.id, `❌ Moderation commands can only be executed within group chats\\.`);
    }

    let targetUserId = null;
    let targetUsername = '';
    let durationMins = 60; // Default 1 hour

    // 2. Parse target from Reply or Arguments
    if (reply_to_message) {
      targetUserId = reply_to_message.from.id;
      targetUsername = reply_to_message.from.username || reply_to_message.from.first_name;
      if (args.length > 0) {
        const parsedMins = parseInt(args[0], 10);
        if (!isNaN(parsedMins)) durationMins = parsedMins;
      }
    } else if (args.length > 0) {
      const parsedId = parseInt(args[0], 10);
      if (!isNaN(parsedId)) {
        targetUserId = parsedId;
        targetUsername = `User ID ${parsedId}`;
        if (args.length > 1) {
          const parsedMins = parseInt(args[1], 10);
          if (!isNaN(parsedMins)) durationMins = parsedMins;
        }
      }
    }

    if (!targetUserId) {
      return await telegramService.sendMessage(chat.id, `❌ *Usage:* Reply to a user's message with \`/mute [mins]\` or use \`/mute <userId> [mins]\`\\.`);
    }

    // 3. Prevent muting fellow admins or the bot itself
    const targetIsAdmin = await telegramService.isAdmin(chat.id, targetUserId);
    if (targetIsAdmin) {
      return await telegramService.sendMessage(chat.id, `❌ Error: Cannot mute an administrator of this community\\.`);
    }

    try {
      const success = await telegramService.muteUser(chat.id, targetUserId, durationMins);
      if (success) {
        // Save to DB
        await User.upsertUser(targetUserId, {
          isMuted: true,
          muteExpiresAt: new Date(Date.now() + durationMins * 60 * 1000)
        });

        logger.moderation(from.username || from.first_name, targetUsername, 'MUTE', `Duration: ${durationMins}m`);

        await telegramService.sendMessage(chat.id, `⚖️ *ADMIN ACTION:* @${esc(targetUsername)} has been *MUTED* for *${durationMins} minutes* by Admin\\.`);
      } else {
        await telegramService.sendMessage(chat.id, `❌ Failed to restrict user\\. Ensure the bot has administrative privileges in this group\\.` +
          `\n\n_Required Permission: Restrict Members_`);
      }
    } catch (error) {
      logger.error('Failed executing mute command:', error.message);
    }
  }
};
