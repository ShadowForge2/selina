const { handleCommand } = require('../commands');
const { processSpamFilter } = require('../middlewares/spamFilter');
const { processVerificationCheck } = require('../middlewares/verificationCheck');
const aiService = require('../services/aiService');
const { Ticket } = require('../database/models/Ticket');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');
const config = require('../config');
const { esc, header, DIVIDER } = require('../utils/formatter');

module.exports = {
  name: 'message',
  async execute(msg, bot) {
    const { chat, from, text } = msg;

    if (!from || from.is_bot) return;

    // 1. Differentiate: GROUP vs PRIVATE CHAT (DM)
    const isPrivate = chat.type === 'private';

    // 2. DISPATCH COMMANDS FIRST
    if (text && text.startsWith('/')) {
      const commandHandled = await handleCommand(msg, bot);
      if (commandHandled) return;
    }

    if (!isPrivate) {
      // ==========================================
      // GROUP CHAT PROCESSING FLOW
      // ==========================================

      // 2A. Run Group Verification check
      const verificationPassed = await processVerificationCheck(msg);
      if (!verificationPassed) return;

      // 2B. Run Spam, Flood, Profanity & Link filter
      const spamCheckPassed = await processSpamFilter(msg);
      if (!spamCheckPassed) return;

    } else {
      // ==========================================
      // PRIVATE DM PROCESSING FLOW
      // ==========================================

      if (!text) return;

      // 3A. Support Ticket Conversation Bridge
      const activeTicket = await Ticket.findActiveTicketByUser(from.id);
      if (activeTicket) {
        try {
          // Log user message to ticket history
          await Ticket.addMessage(activeTicket.ticketId, 'user', text);
          
          // Alert admins of user's new message
          const adminNotice = `${header('Ticket Message Update', '💬')}` +
            `🎫 *Ticket ID:* \`${activeTicket.ticketId}\`\n` +
            `👤 *From:* @${esc(from.username || from.first_name)}\n\n` +
            `💬 *User Message:*\n_"${esc(text)}_" \n` +
            `${DIVIDER}` +
            `💡 Use \`/reply ${activeTicket.ticketId} <your response>\` to send a message back\\.`;

          for (const adminId of config.ADMIN_IDS) {
            await telegramService.sendDirectMessage(adminId, adminNotice);
          }
          
          // Notify user their message was logged
          await telegramService.sendDirectMessage(from.id, `⚡ _Your message has been registered and forwarded to support managers for Ticket_ \`${activeTicket.ticketId}\`\\.`);
          return;
        } catch (ticketBridgeErr) {
          logger.error('Failed to bridge ticket message to admins:', ticketBridgeErr.message);
        }
      }

      // 3B. AI Auto-Replies & Local FAQs Matcher
      const aiReply = await aiService.processMessage(text);
      if (aiReply) {
        return await telegramService.sendMessage(from.id, aiReply);
      }

      // 3C. Private Chat Default Helper Prompt
      const fallbackPrompt = `${header('CPBloomFX Assistant', '🤖')}` +
        `I am your direct assistant console\\. How can I help you today?\n\n` +
        `💡 *Things you can do:* \n` +
        `• Click *📘 Getting Started* in the menu below to read about us\\.\n` +
        `• Type \`/faq\` to view interactive support items\\.\n` +
        `• Use \`/ticket <your query>\` to speak with a human support agent\\.\n\n` +
        `👇 _Or use the buttons below to navigate:_`;

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

      await telegramService.sendMessage(from.id, fallbackPrompt, { reply_markup: replyMarkup });
    }
  }
};
