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
      const admins = await bot.getChatAdministrators(chat.id);
      const botInfo = await bot.getMe();
      const botId = botInfo.id;

      const taggable = admins.filter(a => a.user.id !== botId);

      let mentionText = '';
      for (const member of taggable) {
        const name = member.user.first_name || 'User';
        mentionText += `👤 [${esc(name)}](tg://user?id=${member.user.id})\n`;
      }

      const memberCount = await bot.getChatMemberCount(chat.id);
      const customMsg = args.length > 0 ? `📢 ${args.join(' ')}` : '📢 Attention Everyone';

      const fullText = `*${esc(customMsg)}*\n\n` +
        `👥 *Total Members:* \`${memberCount}\`\n\n` +
        `${mentionText}` +
        `\n_🔔 All members please check the message above\\._`;

      await telegramService.sendMessage(chat.id, fullText);
      logger.moderation(from.username || from.first_name, '', 'TAGALL', `Tagged ${taggable.length} visible members in group with ${memberCount} total`);
    } catch (error) {
      logger.error('Failed executing tagall command:', error.message);
      await telegramService.sendMessage(chat.id, `❌ Error: ${esc(error.message)}`);
    }
  }
};
