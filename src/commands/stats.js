const { User } = require('../database/models/User');
const { Ticket } = require('../database/models/Ticket');
const { Stat } = require('../database/models/Stat');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');
const { header, keyVal, esc } = require('../utils/formatter');

module.exports = {
  name: 'stats',
  description: 'View community statistical analytics and operational metrics (Admin only).',
  adminOnly: true,
  async execute(msg, args, bot) {
    const { chat } = msg;

    try {
      // 1. Gather counts from DB / Memory
      const allUsers = await User.getAllUsers();
      const totalUsersCount = allUsers.length;
      const verifiedCount = allUsers.filter(u => u.isVerified).length;
      const unverifiedCount = totalUsersCount - verifiedCount;
      const mutedCount = allUsers.filter(u => u.isMuted).length;

      const activeTickets = await Ticket.getActiveTickets();
      const openTicketsCount = activeTickets.length;
      
      const metrics = await Stat.getStats();

      // 2. Format a gorgeous FinTech stats card
      const statsCard = `${header('Community Analytics', '📊')}` +
        keyVal('Total Database Members', totalUsersCount, '👥') +
        keyVal('Fully Verified Users', verifiedCount, '🟢') +
        keyVal('Restricted/Unverified', unverifiedCount, '🟡') +
        keyVal('Currently Muted Users', mutedCount, '🔇') +
        `\n` +
        keyVal('Active Support Tickets', openTicketsCount, '🎫') +
        `\n` +
        keyVal('Total Messages Filtered', metrics.messagesCount || 0, '✉️') +
        keyVal('Group Entrants Logged', metrics.joinsCount || 0, '📥') +
        keyVal('Rule Violations Warned', metrics.warnsCount || 0, '⚠️') +
        keyVal('Users Kicked (Security)', metrics.kicksCount || 0, '🥾') +
        keyVal('Automated Bans/Mutes', metrics.bansCount || 0, '🔨') +
        `\n` +
        `💡 _These stats are served live from our secure database clusters. Use the Web Dashboard for visual trendlines!_`;

      await telegramService.sendMessage(chat.id, statsCard);
    } catch (error) {
      logger.error('Stats command failure:', error.message);
      await telegramService.sendMessage(chat.id, `❌ Failed to fetch database analytics: ${esc(error.message)}`);
    }
  }
};
