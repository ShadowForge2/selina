const telegramService = require('../services/telegramService');
const ticketService = require('../services/ticketService');
const logger = require('../utils/logger');
const { esc, header, DIVIDER, dmWelcomeTemplate } = require('../utils/formatter');
const { LOCAL_FAQ_DB } = require('../services/aiService');
const config = require('../config');

module.exports = {
  name: 'callback_query',
  async execute(callbackQuery, bot) {
    const { id, from, message, data } = callbackQuery;
    const userId = from.id;
    const username = from.username || from.first_name;

    try {
      // 1. GETTING STARTED TUTORIAL (DM Callback)
      if (data === 'get_started') {
        await bot.answerCallbackQuery(id);
        
        const tutorialText = `${header('Getting Started Guide', '📘')}` +
          `Welcome to the CPBloomFX Ecosystem\\! Here is how to navigate our platforms:\n\n` +
          `1️⃣ *Download User App:* Register, fund your trading account via Paystack/Crypto, and monitor payouts\\.\n` +
          `2️⃣ *CopyTrading:* Connect your MetaTrader 4/5 account to our automated master nodes to copy premium trades\\.\n` +
          `3️⃣ *Elite VIP Group:* Secure a monthly or lifetime subscription to get high-probability alerts directly on Telegram\\.\n\n` +
          `💡 _For detailed instructions, feel free to open a /ticket to speak with a human support agent._`;

        const replyMarkup = {
          inline_keyboard: [
            [
              { text: '🔙 Back to Menu', callback_data: 'back_to_menu' },
              { text: '📢 Channel', url: config.CHANNEL_LINK }
            ]
          ]
        };

        await bot.editMessageText(tutorialText, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'MarkdownV2',
          reply_markup: replyMarkup
        });
        return;
      }

      // 3. OPEN SUPPORT TICKET (DM Callback)
      if (data === 'open_ticket') {
        await bot.answerCallbackQuery(id);
        
        const ticketInstruction = `${header('Support Console', '💬')}` +
          `To open a ticket and speak directly with our core managers, simply type the \`/ticket\` command followed by your detailed query\\.\n\n` +
          `*Example:* \`/ticket Hello, I made a deposit via Paystack but it is pending\\.*\n\n` +
          `Our technical and accounts teams will reply directly to your DM console here\\!`;

        await bot.editMessageText(ticketInstruction, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
          }
        });
        return;
      }

      // 4. BACK TO MENU (DM Callback)
      if (data === 'back_to_menu') {
        await bot.answerCallbackQuery(id);
        
        const dmWelcomeText = dmWelcomeTemplate(from.first_name);

        const replyMarkup = {
          inline_keyboard: [
            [
              { text: '📘 Getting Started', callback_data: 'get_started' },
              { text: '📢 Official Channel', url: config.CHANNEL_LINK }
            ],
            [
              { text: '💬 Support Ticket', callback_data: 'open_ticket' },
              { text: '🌐 Website', url: config.WEBSITE_LINK }
            ]
          ]
        };

        await bot.editMessageText(dmWelcomeText, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'MarkdownV2',
          reply_markup: replyMarkup
        });
        return;
      }

      // 6. INTERACTIVE FAQ MENU BUTTONS
      if (data.startsWith('faq_')) {
        await bot.answerCallbackQuery(id);
        const faqType = data.split('_')[1];
        
        let faqObj = null;
        if (faqType === 'deposit') faqObj = LOCAL_FAQ_DB[0];
        if (faqType === 'withdraw') faqObj = LOCAL_FAQ_DB[1];
        if (faqType === 'signals') faqObj = LOCAL_FAQ_DB[2];
        if (faqType === 'rules') faqObj = LOCAL_FAQ_DB[3];

        if (faqObj) {
          const content = `${header(faqObj.title, '🎓')}${faqObj.response}${DIVIDER}💬 Send any question, or select a topic below:`;
          
          await bot.editMessageText(content, {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: 'MarkdownV2',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '💳 Deposit', callback_data: 'faq_deposit' },
                  { text: '💰 Withdraw', callback_data: 'faq_withdraw' }
                ],
                [
                  { text: '📈 VIP Signals', callback_data: 'faq_signals' },
                  { text: '🛡️ Rules', callback_data: 'faq_rules' }
                ]
              ]
            }
          });
        }
        return;
      }

      // 7. CLOSE SUPPORT TICKET (Admin Callback)
      if (data.startsWith('close_ticket_')) {
        const ticketId = data.split('close_ticket_')[1];
        
        const isConfigAdmin = config.ADMIN_IDS.includes(userId);
        if (!isConfigAdmin) {
          return await bot.answerCallbackQuery(id, {
            text: '❌ Restricted to system administrators.',
            show_alert: true
          });
        }

        await bot.answerCallbackQuery(id, { text: `Ticket ${ticketId} is closing.` });
        
        // Delete action block
        await telegramService.deleteMessage(message.chat.id, message.message_id);
        
        // Execute closing
        await ticketService.closeTicket(ticketId, true);
        return;
      }

    } catch (error) {
      logger.error('Callback query processing failure:', error.message);
    }
  }
};
