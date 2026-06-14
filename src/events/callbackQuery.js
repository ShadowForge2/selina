const { User } = require('../database/models/User');
const { Ticket } = require('../database/models/Ticket');
const telegramService = require('../services/telegramService');
const ticketService = require('../services/ticketService');
const logger = require('../utils/logger');
const { esc, header, DIVIDER, keyVal, dmWelcomeTemplate, apkInstructionsTemplate } = require('../utils/formatter');
const { LOCAL_FAQ_DB } = require('../services/aiService');
const config = require('../config');

module.exports = {
  name: 'callback_query',
  async execute(callbackQuery, bot) {
    const { id, from, message, data } = callbackQuery;
    const userId = from.id;
    const username = from.username || from.first_name;

    try {
      // 1. VERIFY CAPTCHA BUTTON CLICK
      if (data.startsWith('verify_user_')) {
        const targetUserId = parseInt(data.split('_')[2], 10);
        
        if (userId !== targetUserId) {
          return await bot.answerCallbackQuery(id, {
            text: '⚠️ This verification button is not for you!',
            show_alert: true
          });
        }

        // Complete user verification
        await User.upsertUser(userId, { isVerified: true });
        logger.info(`[VERIFICATION] User @${username} (ID: ${userId}) completed verification.`);

        // Notify telegram API callback completed
        await bot.answerCallbackQuery(id, { text: '🟢 Verification completed successfully! Welcome!' });

        // Delete welcome message
        await telegramService.deleteMessage(message.chat.id, message.message_id);

        // Send group success notice
        const successNotice = `🟢 *SECURITY CLEARANCE APPROVED* 🟢\n\n` +
          `👋 Welcome @${esc(username)} to our trading circle\\!\n` +
          `🔒 Verification passed successfully\\. You are now a fully approved community member\\!`;
        
        await telegramService.sendMessage(message.chat.id, successNotice);

        // Trigger Auto DM welcome tutorial in private DMs
        const dmWelcomeText = dmWelcomeTemplate(from.first_name);
        const refLink = `https://t.me/${(await bot.getMe()).username}?start=ref_${userId}`;

        const replyMarkup = {
          inline_keyboard: [
            [
              { text: '📘 Getting Started', callback_data: 'get_started' },
              { text: '📢 Official Channel', url: config.CHANNEL_LINK }
            ],
            [
              { text: '💬 Support Ticket', callback_data: 'open_ticket' },
              { text: '🌐 Website', url: config.WEBSITE_LINK }
            ],
            [
              { text: '🏆 Leaderboard', callback_data: 'leaderboard' }
            ]
          ]
        };

        await telegramService.sendDirectMessage(userId, dmWelcomeText + `\n🥇 *Your Referral Link:* \`${refLink}\``, {
          reply_markup: replyMarkup
        });

        // 2. Send instructions to download the BloomFX App from the official post
        const downloadMsg = `${header('Download BloomFX App', '📱')}` +
          `To start copy\\-trading and manage your account, download the official BloomFX App from the link below:\n\n` +
          `👉 [Download App](${config.POST_LINK})\n\n` +
          `⚠️ _Only download from our official channel to protect your account._`;

        await telegramService.sendDirectMessage(userId, downloadMsg, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📱 Download App', url: config.POST_LINK }
              ]
            ]
          }
        });
        return;
      }

      // 1B. USER CONFIRMED JOINING GROUP + CHANNEL
      if (data === 'joined_channels') {
        await bot.answerCallbackQuery(id);

        // Verify membership in group and channel
        const GROUP_ID = -1003978624961;
        const CHANNEL_ID = -1003952364322;
        let inGroup = false;
        let inChannel = false;

        try {
          const groupMember = await bot.getChatMember(GROUP_ID, userId);
          inGroup = ['member', 'administrator', 'creator'].includes(groupMember.status);
        } catch (_) {}

        try {
          const channelMember = await bot.getChatMember(CHANNEL_ID, userId);
          inChannel = ['member', 'administrator', 'creator'].includes(channelMember.status);
        } catch (_) {}

        if (!inGroup || !inChannel) {
          const missing = [];
          if (!inGroup) missing.push('👥 **Group** \\(@CPBloomFX23\\)');
          if (!inChannel) missing.push('📢 **Channel** \\(@cpbloomfxofficialtelegram\\)');

          await bot.sendMessage(userId,
            `⚠️ *You haven\\'t joined all required channels yet\\!*\n\n` +
            `Please join the following and try again:\n${missing.join('\n')}\n\n` +
            `👉 Tap the *"I\\'ve joined both"* button again after joining\\.`,
            { parse_mode: 'MarkdownV2' }
          );
          return;
        }

        try {
          await bot.editMessageText(
            `✅ You're all set! 🎉\n\n<b>Download the App below:</b>`,
            {
              chat_id: message.chat.id,
              message_id: message.message_id,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '📱 Download App', url: config.POST_LINK }
                  ]
                ]
              }
            }
          );
        } catch (e) {
          await bot.sendMessage(userId,
            `✅ You're all set! 🎉\n\n<b>Download the App below:</b>`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '📱 Download App', url: config.POST_LINK }
                  ]
                ]
              }
            }
          );
        }

        await bot.sendMessage(userId, `🔹 <b>What would you like to do next?</b> 🔹`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📘 Getting Started', callback_data: 'get_started' },
                { text: '📢 Channel', url: config.CHANNEL_LINK }
              ],
              [
                { text: '💬 Support Ticket', callback_data: 'open_ticket' },
                { text: '🌐 Website', url: config.WEBSITE_LINK }
              ],
              [
                { text: '🏆 Leaderboard', callback_data: 'leaderboard' }
              ]
            ]
          }
        });
        return;
      }

      // 2. GETTING STARTED TUTORIAL (DM Callback)
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

      // 4. VIEW LEADERBOARD (DM Callback)
      if (data === 'leaderboard') {
        await bot.answerCallbackQuery(id);

        const topReferrers = await User.getLeaderboard(5);
        let leaderboardText = `${header('Referral Leaderboard', '🏆')}` +
          `Here are the top community growth leaders for CPBloomFX\\! Share your custom referral link to earn points and rewards\\!\n\n`;

        if (topReferrers.length === 0) {
          leaderboardText += `*No referrers logged yet\\. Be the first\\!*`;
        } else {
          topReferrers.forEach((user, idx) => {
            const crown = idx === 0 ? '👑' : '🥈';
            const medal = idx > 1 ? '🔹' : crown;
            leaderboardText += `${medal} *#${idx + 1}* \\- @${esc(user.username || user.firstName)}: \`${user.referralsCount} invites\`\n`;
          });
        }

        await bot.editMessageText(leaderboardText + `${DIVIDER}🥇 *Your stats are updated in real-time.*`, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
          }
        });
        return;
      }

      // 5. BACK TO MENU (DM Callback)
      if (data === 'back_to_menu') {
        await bot.answerCallbackQuery(id);
        
        const dmWelcomeText = dmWelcomeTemplate(from.first_name);
        const refLink = `https://t.me/${(await bot.getMe()).username}?start=ref_${userId}`;

        const replyMarkup = {
          inline_keyboard: [
            [
              { text: '📘 Getting Started', callback_data: 'get_started' },
              { text: '📢 Official Channel', url: config.CHANNEL_LINK }
            ],
            [
              { text: '💬 Support Ticket', callback_data: 'open_ticket' },
              { text: '🌐 Website', url: config.WEBSITE_LINK }
            ],
            [
              { text: '🏆 Leaderboard', callback_data: 'leaderboard' }
            ]
          ]
        };

        await bot.editMessageText(dmWelcomeText + `\n🥇 *Your Referral Link:* \`${refLink}\``, {
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
