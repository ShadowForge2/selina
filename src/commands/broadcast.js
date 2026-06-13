const telegramService = require('../services/telegramService');
const { User } = require('../database/models/User');
const { header, esc, DIVIDER } = require('../utils/formatter');
const logger = require('../utils/logger');
const config = require('../config');

module.exports = {
  name: 'broadcast',
  description: 'Broadcast alerts to all users in DM, or post to channel. Usage: /broadcast [channel] <message>',
  adminOnly: true,
  async execute(msg, args, bot) {
    const { chat, from } = msg;

    if (args.length === 0) {
      return await telegramService.sendMessage(chat.id, `❌ *Usage:* \n\`/broadcast <message>\` (To all private DM users)\n\`/broadcast channel <message>\` (To official channel)`);
    }

    const isChannelBroadcast = args[0].toLowerCase() === 'channel';
    const broadcastText = isChannelBroadcast ? args.slice(1).join(' ') : args.join(' ');

    if (!broadcastText.trim()) {
      return await telegramService.sendMessage(chat.id, `❌ Please specify the broadcast message text\\.`);
    }

    try {
      // 1. Channel Broadcast
      if (isChannelBroadcast) {
        if (!config.CHANNEL_ID) {
          return await telegramService.sendMessage(chat.id, `⚠️ CHANNEL_ID is not configured in environment settings\\.`);
        }

        const channelMessage = `${header('Official Announcement', '📢')}` +
          `${esc(broadcastText)}\n` +
          `${DIVIDER}` +
          `🔔 *CPBloomFX Intelligence* | Live trading, direct insights\\.`;

        const success = await telegramService.sendMessage(config.CHANNEL_ID, channelMessage, {
          reply_markup: {
            inline_keyboard: [[{ text: '🌐 Visit Website', url: config.WEBSITE_LINK }]]
          }
        });

        if (success) {
          logger.info(`Admin @${from.username} broadcasted announcement directly to channel.`);
          await telegramService.sendMessage(chat.id, `🟢 Announcement has been successfully posted to channel *${config.CHANNEL_LINK}*\\!`);
        } else {
          await telegramService.sendMessage(chat.id, `❌ Failed to broadcast to channel\\. Ensure the bot is added as an Administrator in the channel\\.`);
        }
        return;
      }

      // 2. DM Broadcast (to all members in database)
      const allUsers = await User.getAllUsers();
      const usersToBroadcast = allUsers.filter(u => u.userId !== from.id); // Skip the admin sending it
      
      if (usersToBroadcast.length === 0) {
        return await telegramService.sendMessage(chat.id, `⚠️ No other registered users found in the database to broadcast to\\.`);
      }

      const alertMsg = await telegramService.sendMessage(chat.id, `⏳ Starting direct message broadcast to *${usersToBroadcast.length}* users\\.\\.\\.`);
      
      const formattedMessage = `${header('Community Broadcast', '⚡')}` +
        `${esc(broadcastText)}\n` +
        `${DIVIDER}` +
        `💡 _This alert is sent directly by CPBloomFX Administration. Do not reply to this message._`;

      let successCount = 0;
      let failCount = 0;

      for (const user of usersToBroadcast) {
        try {
          const sent = await telegramService.sendDirectMessage(user.userId, formattedMessage);
          if (sent) successCount++;
          else failCount++;
          // Basic sleep to prevent hit by Telegram flood limit
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch {
          failCount++;
        }
      }

      await telegramService.sendMessage(chat.id, `✅ *Broadcast Completed\\!*\n\n` +
        `🟢 *Delivered:* \`${successCount}\` DMs\n` +
        `🔴 *Failed:* \`${failCount}\` (Users might have blocked bot or not initiated DM)`);

    } catch (error) {
      logger.error('Broadcast command failure:', error.message);
      await telegramService.sendMessage(chat.id, `❌ Server error during broadcast: ${esc(error.message)}`);
    }
  }
};
