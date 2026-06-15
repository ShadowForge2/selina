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
    // Uses timestamp-based debounce to ignore stale error events that accumulate
    // during cooldown and fire after restart completes.
    let pollRetries = 0;
    let lastRestartTime = 0;
    const MAX_POLL_RETRIES = 10;
    const RESTART_DEBOUNCE_MS = 8000; // ignore errors within 8s of a successful restart

    bot.on('polling_error', (error) => {
      const now = Date.now();

      // Ignore stale events that fired shortly after a successful restart
      if (now - lastRestartTime < RESTART_DEBOUNCE_MS) return;

      if (pollRetries >= MAX_POLL_RETRIES) {
        logger.error('Max polling restart attempts reached. Will not retry.');
        return;
      }

      pollRetries++;
      logger.error(`Telegram Polling Error: ${error.message}`);

      // For 409: use progressive cooldown (35s, 70s, 105s...) so competing
      // instances eventually time out. For other errors: exponential backoff.
      const is409 = error.message && error.message.includes('409');
      const delay = is409
        ? Math.min(pollRetries * 35000, 180000)
        : Math.min(pollRetries * 5000, 30000);

      logger.info(`Restarting polling in ${delay / 1000}s (attempt ${pollRetries}/${MAX_POLL_RETRIES})${is409 ? ' [409 cooldown]' : ''}...`);

      setTimeout(async () => {
        try {
          await bot.stopPolling({ cancel: true }).catch(() => {});
          await new Promise(r => setTimeout(r, 2000));
          await bot.startPolling();
          pollRetries = 0;
          lastRestartTime = Date.now();
          logger.info('Polling restarted successfully.');
        } catch (err) {
          logger.error(`Failed to restart polling: ${err.message}`);
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
