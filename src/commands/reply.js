const ticketService = require('../services/ticketService');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');
const { esc } = require('../utils/formatter');

module.exports = {
  name: 'reply',
  description: 'Reply to an active support ticket (Admin only). Usage: /reply <TKT-XXXXXX> <message>',
  adminOnly: true,
  async execute(msg, args, bot) {
    const { chat, from } = msg;

    if (args.length < 2) {
      return await telegramService.sendMessage(chat.id, `❌ *Usage:* \`/reply <TKT-XXXXXX> <message text>\``);
    }

    const ticketId = args[0].toUpperCase();
    const replyText = args.slice(1).join(' ');

    try {
      const result = await ticketService.replyToTicket(ticketId, from.username || from.first_name, replyText);
      
      if (result.success) {
        await telegramService.sendMessage(chat.id, `✅ Reply has been successfully registered and delivered for ticket *${ticketId}*\\.`);
      } else {
        await telegramService.sendMessage(chat.id, result.message);
      }
    } catch (error) {
      logger.error('Reply command error:', error.message);
      await telegramService.sendMessage(chat.id, `❌ Failed to send reply due to server error: ${esc(error.message)}`);
    }
  }
};
