const TelegramBot = require('node-telegram-bot-api');
const config = require('./src/config');
const telegramService = require('./src/services/telegramService');
const autoPostService = require('./src/services/autoPostService');
const groupPromoService = require('./src/services/groupPromoService');
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

    // Initialize Scheduled Group Promotions
    groupPromoService.init(bot);
    groupPromoService.start();

    // Core Bot Startup log
    bot.getMe().then((me) => {
      logger.info(`Telegram Community Manager Bot started successfully! Username: @${me.username}`);
    }).catch(err => {
      logger.error('Failed to query bot user details during startup:', err.message);
    });

    // Auto-recover from polling errors (e.g. 409 Conflict during deploy overlap)
    // CRITICAL: isRestarting guard prevents cascading retry loops when 409 errors
    // arrive in rapid bursts (10+/sec). Only ONE retry is ever pending at a time.
    let pollRetries = 0;
    let isRestarting = false;
    const MAX_POLL_RETRIES = 10;

    bot.on('polling_error', (error) => {
      logger.error(`Telegram Polling Error: ${error.message}`);

      // Guard: if a restart is already scheduled/running, ignore this event
      if (isRestarting) return;

      if (pollRetries >= MAX_POLL_RETRIES) {
        logger.error('Max polling restart attempts reached. Will not retry.');
        return;
      }

      isRestarting = true;
      pollRetries++;

      // For 409 Conflict: wait 35s so the competing instance's 30s long-poll
      // timeout expires before we reconnect. For other errors: exponential backoff.
      const is409 = error.message && error.message.includes('409');
      const delay = is409 ? 35000 : Math.min(pollRetries * 5000, 30000);

      logger.info(`Restarting polling in ${delay / 1000}s (attempt ${pollRetries}/${MAX_POLL_RETRIES})${is409 ? ' [409 cooldown]' : ''}...`);

      setTimeout(async () => {
        try {
          // Stop any lingering poll session before starting a new one
          await bot.stopPolling({ cancel: true }).catch(() => {});
          await new Promise(r => setTimeout(r, 2000)); // brief settle delay
          await bot.startPolling();
          pollRetries = 0;
          isRestarting = false;
          logger.info('Polling restarted successfully.');
        } catch (err) {
          logger.error(`Failed to restart polling: ${err.message}`);
          isRestarting = false; // Allow next error event to try again
        }
      }, delay);
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
  groupPromoService.stop();
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
