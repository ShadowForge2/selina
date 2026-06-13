const telegramService = require('../services/telegramService');
const { header, DIVIDER } = require('../utils/formatter');

module.exports = {
  name: 'help',
  description: 'View the comprehensive helper dashboard and command lists.',
  adminOnly: false,
  async execute(msg, args, bot) {
    const { chat, from } = msg;
    const isAdmin = await telegramService.isAdmin(chat.id, from.id);

    let helpText = `${header('CPBloomFX Helper', '🤖')}` +
      `Explore our interactive features directly from this command console:\n\n` +
      `🌐 *PUBLIC COMMANDS:*\n` +
      `• \`/start\` \\- Initialize private DM bot and get your custom referral link\\.\n` +
      `• \`/help\` \\- View this help documentation panel\\.\n` +
      `• \`/rules\` \\- Read the community standard guidelines\\.\n` +
      `• \`/faq\` \\- Display the interactive FAQ topics panel\\.\n` +
      `• \`/ticket\` \\- Create a Direct Support Ticket with our admins\\.\n` +
      `• \`/verify\` \\- Trigger verification prompt if unverified\\.\n`;

    if (isAdmin) {
      helpText += `${DIVIDER}` +
        `🛠️ *ADMINISTRATIVE COMMANDS:*\n` +
        `• \`/warn <reply/userId>\` \\- Warn a user for rules violation\\.\n` +
        `• \`/mute <reply/userId> [mins]\` \\- Restrict user from typing in groups\\.\n` +
        `• \`/ban <reply/userId>\` \\- Permanently ban user from chat\\.\n` +
        `• \`/stats\` \\- View real-time community, ticket, and DB aggregates\\.\n` +
        `• \`/broadcast <message>\` \\- Broadcast notice to all community members in DM\\.\n` +
        `• \`/reply <TKT-ID> <text>\` \\- Send support reply to open ticket\\.\n`;
    }

    helpText += `\n💡 _Tip: Standard users can click the inline menu buttons in DM to interact easily with our trading assistant!_`;

    await telegramService.sendMessage(chat.id, helpText);
  }
};
