const telegramService = require('../services/telegramService');

const RULES_TEXT = `📜 *CPBloomFX Community Rules*

Welcome to our community\\! Please follow these rules to maintain a positive and productive environment\\.\n\n` +
`1\\. *Be Respectful*\n   Treat all members with respect\\.\n   No harassment, discrimination, hate speech, or personal attacks\\.\n\n` +
`2\\. *No Spam*\n   Avoid repetitive messages, excessive emojis, or flooding the chat\\.\n   Unsolicited advertisements and promotional links are not allowed\\.\n\n` +
`3\\. *Stay On Topic*\n   Keep discussions related to trading, investments, platform updates, and community topics\\.\n   Off\\-topic conversations may be removed\\.\n\n` +
`4\\. *No False Information*\n   Do not spread rumors, fake news, or misleading information\\.\n   Share only verified information whenever possible\\.\n\n` +
`5\\. *Protect Your Privacy*\n   Never share passwords, private keys, recovery phrases, or sensitive personal information\\.\n   Administrators will never ask for your password\\.\n\n` +
`6\\. *No Impersonation*\n   Do not pretend to be an administrator, moderator, support agent, or another community member\\.\n\n` +
`7\\. *Referral Sharing*\n   Referral discussions should follow community guidelines\\.\n   Excessive referral posting may be treated as spam\\.\n\n` +
`8\\. *Use Appropriate Language*\n   Avoid offensive, abusive, or inappropriate content\\.\n   Keep conversations professional and welcoming\\.\n\n` +
`9\\. *No Scams or Fraud*\n   Any attempt to scam, deceive, or exploit community members will result in an immediate ban\\.\n\n` +
`10\\. *Follow Moderator Instructions*\n   Community moderators reserve the right to remove content or members who violate these rules\\.\n\n` +
`⚠️ *Important Notice*\n   All trading and investment activities involve risk\\.\n   Past performance does not guarantee future results\\.\n   Conduct your own research before making financial decisions\\.\n\n` +
`🤝 *Community Goal*\n   Learn, share knowledge, grow together, and help create a positive trading community for everyone\\.`;

module.exports = {
  name: 'rules',
  description: 'View the official community rules and guidelines.',
  adminOnly: false,
  async execute(msg, args, bot) {
    const { chat } = msg;
    await telegramService.sendMessage(chat.id, RULES_TEXT);
  }
};
