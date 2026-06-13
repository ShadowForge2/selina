const ticketService = require('../services/ticketService');
const telegramService = require('../services/telegramService');
const { header, esc } = require('../utils/formatter');

module.exports = {
  name: 'ticket',
  description: 'Open a support ticket to speak with admins. Usage: /ticket <your question/query>',
  adminOnly: false,
  async execute(msg, args, bot) {
    const { chat, from } = msg;

    // 1. Ensure private chat
    if (chat.type !== 'private') {
      return await telegramService.sendMessage(chat.id, `❌ The \`/ticket\` command is only available in private chat with the bot\\. Please DM me directly\\!`);
    }

    // 2. Prompt user if query is empty
    if (args.length === 0) {
      const promptText = `${header('Support Center', '💬')}` +
        `To open a secure support ticket with our managers, please write your question immediately following the command\\.\n\n` +
        `*Example:* \n\`/ticket How do I upgrade my account to VIP?\`\n\n` +
        `💡 _Our staff will reply directly to your DM console here shortly!_`;
      
      return await telegramService.sendMessage(chat.id, promptText);
    }

    const queryText = args.join(' ');

    // 3. Initiate ticket via TicketService
    const result = await ticketService.openUserTicket(from.id, from.username || from.first_name, queryText);
    await telegramService.sendMessage(chat.id, result.message);
  }
};
