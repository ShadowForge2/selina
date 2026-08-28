const { User } = require('../database/models/User');
const { Stat } = require('../database/models/Stat');
const { Ticket } = require('../database/models/Ticket');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');
const { esc, header, keyVal } = require('../utils/formatter');
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
    const isAdmin = config.ADMIN_IDS.includes(userId);

    try {
      const existingUser = await User.findByTelegramId(userId);

      if (!existingUser) {
        await User.upsertUser(userId, { username, firstName, isVerified: true });
        await Stat.incrementMetric('joinsCount');
        logger.join(username || firstName, userId, 'Direct Link');
      } else {
        await User.upsertUser(userId, { username, firstName });
      }

      // Admin gets a special console view with group/channel progress
      if (isAdmin) {
        return await this.adminView(msg, bot, firstName);
      }

      const welcomeText = `👋 Welcome to *CPBloomFX*, ${esc(firstName)}\\! 🎉\n\n` +
        `I'm your assistant for our FinTech and Crypto community\\. I help manage our channels and groups\\. Here's what you can do:\n\n` +
        `• 📘 Get started and learn about our products\\.\n` +
        `• 📢 Join our official channel for live trade updates\\.\n` +
        `• 💬 Open a support ticket to speak with our team\\.\n\n` +
        `👉 To access the platform, visit ${esc(config.WEBSITE_LINK)}\\.`;

      await telegramService.sendMessage(userId, welcomeText, {
        disable_web_page_preview: true,
        reply_markup: replyMarkup()
      });
    } catch (error) {
      logger.error('Failed executing start command:', error.message);
    }
  },

  async adminView(msg, bot, firstName) {
    const { from } = msg;
    const userId = from.id;

    try {
      let groupTitle = 'Group';
      let groupLink = config.GROUP_LINK || 'Not set';
      let groupMembers = '—';
      let channelTitle = 'Channel';
      let channelLink = config.CHANNEL_LINK || 'Not set';
      let channelMembers = '—';

      // Fetch group info
      if (config.GROUP_ID) {
        const groupId = parseInt(config.GROUP_ID, 10);
        try {
          const chat = await bot.getChat(groupId);
          if (chat && chat.title) groupTitle = chat.title;
        } catch (_) {}
        try {
          groupMembers = await bot.getChatMemberCount(groupId);
        } catch (_) {}
      }

      // Fetch channel info
      if (config.CHANNEL_ID) {
        const channelId = parseInt(config.CHANNEL_ID, 10);
        try {
          const chat = await bot.getChat(channelId);
          if (chat && chat.title) channelTitle = chat.title;
        } catch (_) {}
        try {
          channelMembers = await bot.getChatMemberCount(channelId);
        } catch (_) {}
      }

      // Gather community stats
      const metrics = await Stat.getStats();
      const activeTickets = await Ticket.getActiveTickets();

      const adminHome = `${header('Admin Console', '👑')}` +
        `Welcome back, *${esc(firstName)}*\\! You have administrator access\\.\n\n` +
        `${header('Group', '👥')}` +
        `• *Name:* ${esc(groupTitle)}\n` +
        `• *Members:* ${groupMembers}\n` +
        `• *Link:* ${esc(groupLink)}\n\n` +
        `${header('Channel', '📢')}` +
        `• *Name:* ${esc(channelTitle)}\n` +
        `• *Subscribers:* ${channelMembers}\n` +
        `• *Link:* ${esc(channelLink)}\n\n` +
        `${header('Progress So Far', '📈')}` +
        keyVal('Group Entries', metrics.joinsCount || 0, '📥') +
        keyVal('Messages Processed', metrics.messagesCount || 0, '✉️') +
        keyVal('Violations Warned', metrics.warnsCount || 0, '⚠️') +
        keyVal('Automated Bans/Mutes', metrics.bansCount || 0, '🔨') +
        keyVal('Open Support Tickets', activeTickets.length, '🎫') +
        `\n💡 _Use \`/stats\` for detailed analytics or the Web Dashboard for visual reports._`;

      await telegramService.sendMessage(userId, adminHome, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 View Stats', callback_data: 'get_started' },
              { text: '📢 Channel', url: config.CHANNEL_LINK }
            ],
            [
              { text: '💬 Support Tickets', callback_data: 'open_ticket' },
              { text: '🌐 Website', url: config.WEBSITE_LINK }
            ]
          ]
        }
      });
    } catch (error) {
      logger.error('Failed executing admin start view:', error.message);
    }
  }
};

function replyMarkup() {
  return {
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
}
