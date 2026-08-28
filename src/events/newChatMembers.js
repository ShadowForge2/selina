const { User } = require('../database/models/User');
const { Stat } = require('../database/models/Stat');
const telegramService = require('../services/telegramService');
const { welcomeTemplate, esc } = require('../utils/formatter');
const logger = require('../utils/logger');

module.exports = {
  name: 'new_chat_members',
  async execute(msg, bot) {
    const { chat, new_chat_members } = msg;

    const botInfo = await bot.getMe();

    for (const member of new_chat_members) {
      // Skip if the bot itself is added to the group
      if (member.id === botInfo.id) {
        logger.info(`Bot was added to chat ${chat.title} (ID: ${chat.id})`);
        await telegramService.sendMessage(chat.id, `👋 Hello everyone\\! I am *CPBloomFX Community Assistant*\\.\n\n` +
          `🔒 I am active and ready to manage this group\\. I will welcome new members, delete links, filter spam, and keep the community clean\\!\n\n` +
          `👮‍♂️ *Notice:* Please make sure to make me an *Administrator* with delete and ban privileges so I can function properly\\.`);
        continue;
      }

      const username = member.username || '';
      const firstName = member.first_name;
      const userId = member.id;

      logger.join(username || firstName, userId, 'Group Entry');
      await Stat.incrementMetric('joinsCount');

      try {
        // Save member in DB as an active community member
        await User.upsertUser(userId, {
          username,
          firstName,
          isVerified: true
        });

        // Send a friendly welcome message
        const welcomeText = welcomeTemplate(firstName, username, userId);
        await telegramService.sendMessage(chat.id, welcomeText);

        logger.info(`[WELCOME] Sent welcome message to new member @${username || firstName}`);
      } catch (err) {
        logger.error(`Error welcoming new chat member ${userId}:`, err.message);
      }
    }
  }
};
