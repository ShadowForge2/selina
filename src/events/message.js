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

      // 2C. React with ❤️ to positive messages
      if (text && isPositive(text)) {
        try { await bot.setMessageReaction(chat.id, msg.message_id, { reaction: [{ type: 'emoji', emoji: '❤' }] }); } catch (e) {}
      }

      // 2D. Auto-answer questions and greetings in group
      if (text && shouldAutoReply(text)) {
        const aiReply = await aiService.processMessage(text);
        if (aiReply) {
          const mention = `[@${esc(from.username || from.first_name)}](tg://user?id=${from.id})`;
          await telegramService.sendMessage(chat.id, `${mention}\n\n${aiReply}`);
          return;
        }
        // Fallback for unanswered questions (not greetings)
        if (isRealQuestion(text)) {
          const mention = `[@${esc(from.username || from.first_name)}](tg://user?id=${from.id})`;
          const referral = `${mention}\n\n❓ *I couldn't find a direct answer to your question*\\.\n` +
            `Please contact @${config.SUPPORT_USERNAME.replace(/_/g, '\\_')} for further assistance\\. They will be happy to help\\! 💬`;
          await telegramService.sendMessage(chat.id, referral);
          return;
        }
      }

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
          await telegramService.sendDirectMessage(from.id, `❌ Failed to forward your message to support\\. Please try again later\\.`);
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

function isRealQuestion(text) {
  const lower = text.toLowerCase().trim();
  if (lower.includes('?')) return true;
  if (/^(who|what|where|when|why|how|which|whose|whom)\b/i.test(lower)) return true;
  if (/^(can|could|will|would|shall|should|do|does|did|is|are|am|was|were|has|have|had)\s/i.test(lower)) return true;
  return false;
}

function shouldAutoReply(text) {
  const lower = text.toLowerCase().trim();

  // Has question mark
  if (lower.includes('?')) return true;

  // Starts with question words
  if (/^(who|what|where|when|why|how|which|whose|whom)\b/i.test(lower)) return true;

  // Starts with auxiliary verbs (questions)
  if (/^(can|could|will|would|shall|should|do|does|did|is|are|am|was|were|has|have|had)\s/i.test(lower)) return true;

  // Help / confusion phrases
  const helpPatterns = [
    'i need help', "i don't understand", "i don't get", "i'm confused",
    'i dont understand', 'i dont get', 'im confused',
    'can someone', 'someone help', 'please help',
    'tell me', 'explain', 'what is', 'how do', 'how to',
    'anyone know', 'does anyone', 'i want to know', 'i was wondering',
    'can you tell', 'could you', 'would you',
    'help me', 'need assistance', 'i have a question'
  ];

  if (helpPatterns.some(p => lower.startsWith(p) || lower.includes(p))) return true;

  // Greetings
  const greetings = [
    'good morning', 'good afternoon', 'good evening', 'good day',
    'morning', 'hello', 'hi ', 'hey', 'how far', 'howdy',
    'greetings', 'good to be here', 'what\'s up', 'wassup', 'sup',
    'yo', 'how are you', 'how do you do', 'nice to meet'
  ];

  if (greetings.some(g => lower.startsWith(g) || lower === g.trim())) return true;

  // Celebrations (withdrawals, profits, bonuses)
  const celebrations = [
    'i got paid', 'i withdrew', 'just withdrew', 'got my withdrawal',
    'my withdrawal', 'withdrawal successful', 'payment received',
    'got paid', 'received my', 'made profit', 'i earned',
    'got the bonus', 'bonus received', 'profit taking', 'taking profit',
    'made money', 'withdrawal received', 'i received'
  ];

  return celebrations.some(c => lower.includes(c));
}

const POSITIVE_WORDS = [
  'thank you', 'thanks', 'thankful', 'grateful',
  'great', 'awesome', 'amazing', 'wonderful', 'fantastic',
  'love it', 'love this', 'i love', '❤️',
  'helpful', 'useful', 'appreciate', 'appreciated',
  'nice', 'cool', 'excellent', 'perfect', 'beautiful',
  'happy', 'blessed', 'congratulations', 'congrats',
  'well done', 'good job', 'keep it up', 'proud',
  'best', 'super', 'brilliant', 'outstanding',
  'solid', 'impressive', 'legend', 'you rock'
];

function isPositive(text) {
  const lower = text.toLowerCase().trim();
  return POSITIVE_WORDS.some(w => lower.includes(w));
}
