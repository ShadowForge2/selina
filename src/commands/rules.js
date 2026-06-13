const telegramService = require('../services/telegramService');
const { rulesTemplate } = require('../utils/formatter');

module.exports = {
  name: 'rules',
  description: 'View the official community rules and guidelines.',
  adminOnly: false,
  async execute(msg, args, bot) {
    const { chat } = msg;
    const rulesText = rulesTemplate();
    await telegramService.sendMessage(chat.id, rulesText);
  }
};
