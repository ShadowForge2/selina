const telegramService = require('../services/telegramService');
const { header, DIVIDER } = require('../utils/formatter');

module.exports = {
  name: 'faq',
  description: 'Access the interactive FAQ dashboard.',
  adminOnly: false,
  async execute(msg, args, bot) {
    const { chat } = msg;

    const faqText = `${header('CPBloomFX Knowledge Base', '🎓')}` +
      `Welcome to the interactive Support Center\\! Click on any of the topics below to instantly view answers regarding operations, trading, and funding:\n\n` +
      `🔹 *Topics Included:* \n` +
      `• How to Deposit Funds into CPBloomFX\n` +
      `• How to Request Withdrawals\n` +
      `• Joining the VIP Trade Signals Channel\n` +
      `• Core Group Standards & Protection\n\n` +
      `👇 *Select a topic to read:*`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '💳 How to Deposit', callback_data: 'faq_deposit' },
          { text: '💰 How to Withdraw', callback_data: 'faq_withdraw' }
        ],
        [
          { text: '📈 VIP Signal Groups', callback_data: 'faq_signals' },
          { text: '🛡️ Community Rules', callback_data: 'faq_rules' }
        ]
      ]
    };

    await telegramService.sendMessage(chat.id, faqText, { reply_markup: replyMarkup });
  }
};
