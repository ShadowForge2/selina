const logger = require('../utils/logger');
const telegramService = require('../services/telegramService');
const config = require('../config');
const { esc } = require('../utils/formatter');

// Import all command modules
const start = require('./start');
const help = require('./help');
const rules = require('./rules');
const verify = require('./verify');
const mute = require('./mute');
const ban = require('./ban');
const warn = require('./warn');
const stats = require('./stats');
const broadcast = require('./broadcast');
const faq = require('./faq');
const ticket = require('./ticket');
const reply = require('./reply');
const tagall = require('./tagall');

// Register commands in a map
const commands = new Map();
const list = [start, help, rules, verify, mute, ban, warn, stats, broadcast, faq, ticket, reply, tagall];

list.forEach(cmd => {
  commands.set(cmd.name, cmd);
});

/**
 * Parses and dispatches incoming /commands to their respective execution modules
 */
async function handleCommand(msg, bot) {
  const { chat, from, text } = msg;
  
  if (!text || !text.startsWith('/')) return false;

  // Split text into command name and arguments
  // Handle commands like /start@botname
  const parts = text.trim().split(/\s+/);
  const rawCmd = parts[0].substring(1);
  const cmdName = rawCmd.split('@')[0].toLowerCase();
  const args = parts.slice(1);

  const command = commands.get(cmdName);
  if (!command) return false; // Not a registered command

  logger.info(`[COMMAND] Executing /${cmdName} for user @${from.username || from.first_name} (ID: ${from.id})`);

  try {
    // Check if command is administrative only
    if (command.adminOnly) {
      const isConfigAdmin = config.ADMIN_IDS.includes(from.id);
      const isGroupAdmin = await telegramService.isAdmin(chat.id, from.id);
      
      if (!isConfigAdmin && !isGroupAdmin) {
        logger.warn(`[SECURITY] Restricting command /${cmdName} for unauthorized user @${from.username || from.first_name}`);
        await telegramService.sendMessage(chat.id, `⚠️ *Access Denied:* This command is restricted to administrators only\\.`);
        return true;
      }
    }

    // Execute the command
    await command.execute(msg, args, bot);
    return true;
  } catch (error) {
    logger.error(`Error executing command /${cmdName}:`, error.message);
    await telegramService.sendMessage(chat.id, `❌ An unexpected error occurred while executing this command: ${esc(error.message)}`);
    return true;
  }
}

module.exports = {
  handleCommand,
  commands
};
