const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('BOT_TOKEN not found in .env');
  process.exit(1);
}

const commands = [
  { command: 'start', description: 'Begin interaction with the bot and get referral link' },
  { command: 'help', description: 'View command documentation' },
  { command: 'rules', description: 'Read community guidelines' },
  { command: 'verify', description: 'Check your verification status' },
  { command: 'faq', description: 'Interactive FAQ dashboard' },
  { command: 'ticket', description: 'Open a support ticket with admins' }
];

const bot = new TelegramBot(token);

bot.setMyCommands(commands).then(() => {
  console.log('Bot commands registered successfully:');
  commands.forEach(c => console.log(`  /${c.command} - ${c.description}`));
  process.exit(0);
}).catch(err => {
  console.error('Failed to register commands:', err.message);
  process.exit(1);
});
