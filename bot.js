const TelegramBot = require('node-telegram-bot-api');
const config = require('./src/config');
const telegramService = require('./src/services/telegramService');
const autoPostService = require('./src/services/autoPostService');
const { initEvents } = require('./src/events');
const logger = require('./src/utils/logger');

let bot = null;

/**
 * Initializes and starts the Telegram Community Management Bot
 */
function startBot() {
  if (!config.BOT_TOKEN) {
    logger.error('CRITICAL: BOT_TOKEN is empty in environment variables. Bot startup aborted.');
    return null;
  }

  try {
    logger.info('Initializing Telegram bot instance...');
    
    // Instantiate Telegram Bot with Polling
    bot = new TelegramBot(config.BOT_TOKEN, {
      polling: {
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });

    // Initialize Services with Bot Instance
    telegramService.init(bot);
    
    // Register Events and Command Dispatchers
    initEvents(bot);

    // Initialize Scheduled Channel Auto-Posts
    autoPostService.start();

    // Core Bot Startup log
    bot.getMe().then((me) => {
      logger.info(`Telegram Community Manager Bot started successfully! Username: @${me.username}`);
    }).catch(err => {
      logger.error('Failed to query bot user details during startup:', err.message);
    });

    // Handle process events to clean up on shutdown
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    return bot;

  } catch (error) {
    logger.error('Fatal crash during bot initialization:', error.message);
    // Anti-Crash: attempt restart after 10s
    setTimeout(startBot, 10000);
    return null;
  }
}

/**
 * Handles clean termination of resources on server crash or shutdown
 */
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down services gracefully...`);
  autoPostService.stop();
  if (bot) {
    bot.stopPolling().then(() => {
      logger.info('Telegram Bot polling stopped cleanly.');
      process.exit(0);
    }).catch(err => {
      logger.error('Error stopping bot polling:', err.message);
      process.exit(1);
    });
  } else {
    process.exit(0);
  }
}

// Global Exception Catchers to keep application alive in production (Render-ready)
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION CRITICAL SYSTEM ERROR:', error.stack || error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION CRITICAL SYSTEM ERROR:', reason.stack || reason.message || reason);
});

module.exports = {
  startBot,
  getBotInstance: () => bot
};
