const fs = require('fs');
const path = require('path');
const { User } = require('../database/models/User');
const { Stat } = require('../database/models/Stat');
const telegramService = require('../services/telegramService');
const { welcomeTemplate, apkInstructionsTemplate, esc, header } = require('../utils/formatter');
const logger = require('../utils/logger');
const config = require('../config');

module.exports = {
  name: 'new_chat_members',
  async execute(msg, bot) {
    const { chat, new_chat_members } = msg;

    for (const member of new_chat_members) {
      // Skip if the bot itself is added to the group
      const botInfo = await bot.getMe();
      if (member.id === botInfo.id) {
        logger.info(`Bot was added to chat ${chat.title} (ID: ${chat.id})`);
        await telegramService.sendMessage(chat.id, `👋 Hello everyone\\! I am *CPBloomFX Community Assistant*\\.\\n\\n` +
          `🔒 I am active and ready to manage this group\\. I will automatically verify new members, delete links, filter spam, and schedule auto-posts\\!\\n\\n` +
          `👮‍♂️ *Notice:* Please make sure to make me an *Administrator* with delete and restrict privileges so I can function properly\\.`);
        continue;
      }

      const username = member.username || '';
      const firstName = member.first_name;
      const userId = member.id;

      logger.join(username || firstName, userId, 'Group Entry');
      await Stat.incrementMetric('joinsCount');

      try {
        // 1. Save member in DB as unverified
        await User.upsertUser(userId, {
          username,
          firstName,
          isVerified: false
        });

        // 2. Format and send beautiful Welcome message with inline button
        const timeoutSecs = Math.floor(config.VERIFICATION_TIMEOUT_MS / 1000);
        const welcomeText = welcomeTemplate(firstName, username, userId, timeoutSecs);

        const replyMarkup = {
          inline_keyboard: [
            [
              { text: '✅ Click here to Verify', callback_data: `verify_user_${userId}` }
            ]
          ]
        };

        const sentWelcomeMessage = await telegramService.sendMessage(chat.id, welcomeText, {
          reply_markup: replyMarkup
        });

        // 3. Send download instructions with the app post link after the welcome message
        setTimeout(async () => {
          try {
            const downloadText = `${header('Download BloomFX App', '📱')}` +
              `To start copy\\-trading, download the official BloomFX App from the link below:\n\n` +
              `👉 [Download App](${config.POST_LINK})`;

            const sent = await telegramService.sendMessage(chat.id, downloadText, {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '📱 Download App', url: config.POST_LINK }
                  ]
                ]
              }
            });
            if (sent) {
              logger.info(`[DOWNLOAD] Sent app download link to group for new member @${username || firstName}`);
            } else {
              logger.warn(`[DOWNLOAD] Could not send download link to group for new member @${username || firstName} — sendMessage returned null`);
            }
          } catch (dlErr) {
            const dlErrMsg = dlErr?.message || (typeof dlErr === 'object' ? JSON.stringify(dlErr) : String(dlErr)) || 'Unknown error';
            logger.error(`[DOWNLOAD] Failed to send download link for new member ${userId}: ${dlErrMsg}`);
          }
        }, 2000); // 2-second delay so it arrives after the welcome text

        // 4. Setup kick timeout (Verification timer)
        setTimeout(async () => {
          try {
            const dbUser = await User.findByTelegramId(userId);
            if (dbUser && !dbUser.isVerified) {
              logger.info(`[KICK TIMER] User @${username || firstName} failed to verify in time. Initiating kick.`);
              
              // Delete the welcome message to keep the group clean
              if (sentWelcomeMessage) {
                await telegramService.deleteMessage(chat.id, sentWelcomeMessage.message_id);
              }

              // Kick the user
              const kicked = await telegramService.kickUser(chat.id, userId);
              if (kicked) {
                await Stat.incrementMetric('kicksCount');
                
                const kickAlertText = `🚪 *COMMUNITY PROTECTION* 🚪\\n\\n` +
                  `👤 *User:* @${esc(username || firstName)}\\n` +
                  `⚠️ *Action:* *Kicked from Chat*\\n` +
                  `📝 *Reason:* Failed security verification check within ${timeoutSecs} seconds\\.`;
                
                await telegramService.sendMessage(chat.id, kickAlertText);
              }
            }
          } catch (timeoutErr) {
            logger.error(`Error during kick timeout for user ${userId}:`, timeoutErr.message);
          }
        }, config.VERIFICATION_TIMEOUT_MS);

      } catch (err) {
        logger.error(`Error handling new chat member ${userId}:`, err.message);
      }
    }
  }
};
