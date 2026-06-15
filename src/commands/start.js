const { User } = require('../database/models/User');
const { Stat } = require('../database/models/Stat');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');
const { esc, header } = require('../utils/formatter');
const config = require('../config');

module.exports = {
  name: 'start',
  description: 'Initiate interaction with CPBloomFX bot and get started.',
  adminOnly: false,
  async execute(msg, args, bot) {
    const { chat, from } = msg;

    if (chat.type !== 'private') {
      return await telegramService.sendMessage(chat.id, `❌ The \`/start\` command is only available in private chat\\. Send me a Direct Message\\!`);
    }

    const userId = from.id;
    const username = from.username || '';
    const firstName = from.first_name;

    let referrerId = null;
    if (args.length > 0 && args[0].startsWith('ref_')) {
      const refParsed = parseInt(args[0].split('_')[1], 10);
      if (!isNaN(refParsed) && refParsed !== userId) {
        referrerId = refParsed;
      }
    }

    try {
      const existingUser = await User.findByTelegramId(userId);

      if (!existingUser) {
        await User.upsertUser(userId, { username, firstName, isVerified: true });
        await Stat.incrementMetric('joinsCount');
        logger.join(username || firstName, userId, referrerId ? `Referral by ID: ${referrerId}` : 'Direct Link');

        if (referrerId) {
          const referrer = await User.addReferral(userId, referrerId);
          if (referrer) {
            const refAlert = `🎉 *REFERRAL MILESTONE* 🎉\n\n` +
              `👤 *New Invited Member:* @${esc(username || firstName)}\n` +
              `🏆 *Total Referrals:* \`${referrer.referralsCount}\` points\\!\n\n` +
              `Keep sharing your referral link to dominate the leaderboard\\!`;
            await telegramService.sendDirectMessage(referrerId, refAlert);
          }
        }
      } else {
        await User.upsertUser(userId, { username, firstName });
      }

      const botInfo = await bot.getMe();
      const refLink = `https://t.me/${botInfo.username}?start=ref_${userId}`;

      // Step 1: Join Channel first (sequential onboarding)
      const step1Text = `📢 *STEP 1: JOIN OUR CHANNEL* 📢\n\n` +
        `Welcome to **CPBloomFX**, ${esc(firstName)}\\! 🎉\n\n` +
        `First, join our official channel to get live trade updates and announcements\\.\n\n` +
        `👉 Tap the button below, then click *"I've joined"* to continue\\.\n\n` +
        `🥇 *Your Referral Link:* \`${refLink}\``;

      await telegramService.sendMessage(userId, step1Text, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📢 Join Channel', url: config.CHANNEL_LINK }
            ],
            [
              { text: '✅ I\'ve joined', callback_data: 'joined_channel' }
            ]
          ]
        }
      });
    } catch (error) {
      logger.error('Failed executing start command:', error.message);
    }
  }
};
