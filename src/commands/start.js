const { User } = require('../database/models/User');
const { Stat } = require('../database/models/Stat');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');
const { dmWelcomeTemplate, apkInstructionsTemplate, esc } = require('../utils/formatter');
const config = require('../config');

module.exports = {
  name: 'start',
  description: 'Initiate interaction with CPBloomFX bot and get started.',
  adminOnly: false,
  async execute(msg, args, bot) {
    const { chat, from } = msg;

    // 1. Ensure this is in private chat (DMs)
    if (chat.type !== 'private') {
      return await telegramService.sendMessage(chat.id, `❌ The \`/start\` command is only available in private chat\\. Send me a Direct Message\\!`);
    }

    const userId = from.id;
    const username = from.username || '';
    const firstName = from.first_name;

    // 2. Handle Referral Deep Links (/start ref_12345678)
    let referrerId = null;
    if (args.length > 0 && args[0].startsWith('ref_')) {
      const refParsed = parseInt(args[0].split('_')[1], 10);
      if (!isNaN(refParsed) && refParsed !== userId) {
        referrerId = refParsed;
      }
    }

    try {
      // 3. Upsert user in database
      const existingUser = await User.findByTelegramId(userId);
      
      if (!existingUser) {
        // New user joins!
        await User.upsertUser(userId, {
          username,
          firstName,
          isVerified: true // Private messages are auto-verified
        });
        
        await Stat.incrementMetric('joinsCount');
        logger.join(username || firstName, userId, referrerId ? `Referral by ID: ${referrerId}` : 'Direct Link');

        // Process referral link if exists
        if (referrerId) {
          const referrer = await User.addReferral(userId, referrerId);
          if (referrer) {
            // Notify referrer!
            const refAlert = `🎉 *REFERRAL MILESTONE* 🎉\n\n` +
              `👤 *New Invited Member:* @${esc(username || firstName)}\n` +
              `🏆 *Total Referrals:* \`${referrer.referralsCount}\` points\\!\n\n` +
              `Keep sharing your referral link to dominate the leaderboard\\!`;
            
            await telegramService.sendDirectMessage(referrerId, refAlert);
          }
        }
      } else {
        // Update details if they already exist
        await User.upsertUser(userId, { username, firstName });
      }

      // Generate customized referral URL
      const botInfo = await bot.getMe();
      const refLink = `https://t.me/${botInfo.username}?start=ref_${userId}`;

      // 4. Send beautiful welcome tutorial with inline buttons
      const welcomeText = dmWelcomeTemplate(firstName) +
        `\n🥇 *Your Referral Link:* \`${refLink}\``;

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
            { text: '👨‍💼 Contact Admin', url: config.CONTACT_ADMIN_LINK },
            { text: '🏆 Leaderboard', callback_data: 'leaderboard' }
          ]
        ]
      };

      await telegramService.sendMessage(userId, welcomeText, { reply_markup: replyMarkup });

      // Deliver the physical APK installer file in DMs
      const fs = require('fs');
      const path = require('path');
      const apkText = apkInstructionsTemplate();
      const resolvedPath = path.resolve(config.APK_FILE_PATH);

      if (fs.existsSync(resolvedPath)) {
        await telegramService.sendDocument(userId, resolvedPath, {
          caption: apkText,
          parse_mode: 'MarkdownV2'
        });
      } else {
        await telegramService.sendMessage(userId, apkText + `\n\n⚠️ _Note: The system administrator has not loaded the physical APK installer into the server assets yet\\._`);
      }
    } catch (error) {
      logger.error('Failed executing start command:', error.message);
    }
  }
};
