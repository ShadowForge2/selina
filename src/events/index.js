const logger = require('../utils/logger');

// Import event modules
const message = require('./message');
const newChatMembers = require('./newChatMembers');
const leftChatMember = require('./leftChatMember');
const callbackQuery = require('./callbackQuery');

const events = [message, newChatMembers, leftChatMember, callbackQuery];

/**
 * Initializes and registers event listeners on the Telegram bot instance
 */
function initEvents(bot) {
  events.forEach(evt => {
    // Map event handlers to node-telegram-bot-api events
    if (evt.name === 'message') {
      bot.on('message', async (msg) => {
        try {
          await evt.execute(msg, bot);
        } catch (err) {
          logger.error('Error executing message event:', err.message);
        }
      });
    } else if (evt.name === 'new_chat_members') {
      bot.on('new_chat_members', async (msg) => {
        try {
          await evt.execute(msg, bot);
        } catch (err) {
          logger.error('Error executing new_chat_members event:', err.message);
        }
      });
    } else if (evt.name === 'left_chat_member') {
      bot.on('left_chat_member', async (msg) => {
        try {
          await evt.execute(msg, bot);
        } catch (err) {
          logger.error('Error executing left_chat_member event:', err.message);
        }
      });
    } else if (evt.name === 'callback_query') {
      bot.on('callback_query', async (query) => {
        try {
          await evt.execute(query, bot);
        } catch (err) {
          logger.error('Error executing callback_query event:', err.message);
        }
      });
    }
  });

  // Reconnection and connection status polling error logs
  bot.on('polling_error', (error) => {
    // Suppress spammy timeout or network transition errors to keep console clean
    if (error.message && (error.message.includes('EFATAL') || error.message.includes('timeout'))) {
      logger.warn(`Telegram connection warning (polling reconnecting): ${error.message}`);
    } else {
      logger.error('Telegram Polling Error:', error.message);
    }
  });

  bot.on('webhook_error', (error) => {
    logger.error('Telegram Webhook Error:', error.message);
  });

  logger.info('Telegram Bot Event Listeners successfully registered.');
}

module.exports = {
  initEvents
};
