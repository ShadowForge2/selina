const { User } = require('../database/models/User');
const telegramService = require('../services/telegramService');
const { esc } = require('../utils/formatter');

module.exports = {
  name: 'verify',
  description: 'Check or trigger your community verification status.',
  adminOnly: false,
  async execute(msg, args, bot) {
    const { chat, from } = msg;

    try {
      const user = await User.findByTelegramId(from.id);
      
      if (chat.type === 'private') {
        const isVerified = user ? user.isVerified : true; // DM users are auto-verified
        const statusText = isVerified 
          ? `🟢 *STATUS:* You are *fully verified* in CPBloomFX\\! You have complete typing and interacting privileges in our group chats\\.`
          : `⚠️ *STATUS:* You are currently *unverified* in our groups\\. Please visit our group and complete verification\\!`;

        return await telegramService.sendMessage(chat.id, statusText);
      }

      // Group Chat
      if (user && user.isVerified) {
        return await telegramService.sendMessage(chat.id, `✅ @${esc(from.username || from.first_name)}, you are already *fully verified* in this group\\. No further action is required\\!`);
      }

      // Unverified user requesting verification
      const verifyButton = {
        inline_keyboard: [
          [
            { text: '✅ Click here to Verify', callback_data: `verify_user_${from.id}` }
          ]
        ]
      };

      await telegramService.sendMessage(chat.id, `👋 Hello @${esc(from.username || from.first_name)}, you are currently *unverified*\\.\n\nPlease click the button below to verify yourself immediately\\!`, {
        reply_markup: verifyButton
      });

    } catch (error) {
      logger.error('Verify command error:', error.message);
    }
  }
};
