const { User } = require('../database/models/User');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');
const { esc } = require('../utils/formatter');

module.exports = {
  name: 'tagall',
  description: 'Mention all members in the group (Admin only). Usage: /tagall <optional message>',
  adminOnly: true,
  async execute(msg, args, bot) {
    const { chat, from } = msg;

    if (chat.type === 'private') {
      return await telegramService.sendMessage(chat.id, `❌ This command can only be used within group chats\\.`);
    }

    try {
      const allUsers = await User.getAllUsers();
      const botInfo = await bot.getMe();

      const taggable = allUsers.filter(u => u.userId !== botInfo.id);

      if (taggable.length === 0) {
        return await telegramService.sendMessage(chat.id, `⚠️ No users found in the database to tag\\.`);
      }

      const batchSize = 30;
      const customMsg = args.length > 0 ? args.join(' ') : 'Attention Everyone';

      for (let i = 0; i < taggable.length; i += batchSize) {
        const batch = taggable.slice(i, i + batchSize);
        let mentionText = '';
        for (const user of batch) {
          const name = user.firstName || 'User';
          mentionText += `👤 [${esc(name)}](tg://user?id=${user.userId})\n`;
        }

        const header = i === 0
          ? `*📢 ${esc(customMsg)}*\n\n`
          : '';

        const pageInfo = taggable.length > batchSize
          ? `\n_(${i + 1}–${Math.min(i + batchSize, taggable.length)} of ${taggable.length})_`
          : '';

        await telegramService.sendMessage(chat.id, `${header}${mentionText}${pageInfo}`);
        await new Promise(r => setTimeout(r, 1000));
      }

      logger.moderation(from.username || from.first_name, '', 'TAGALL', `Tagged ${taggable.length} members in ${Math.ceil(taggable.length / batchSize)} messages`);
    } catch (error) {
      logger.error('Failed executing tagall command:', error.message);
      await telegramService.sendMessage(chat.id, `❌ Error: ${esc(error.message)}`);
    }
  }
};
