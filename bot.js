const TelegramBot = require('node-telegram-bot-api');
const config = require('./src/config');
const telegramService = require('./src/services/telegramService');
const autoPostService = require('./src/services/autoPostService');
const groupPromoService = require('./src/services/groupPromoService');
const { initEvents } = require('./src/events');
const logger = require('./src/utils/logger');

let bot = null;

const MAX_POLL_RETRIES = 10;
const RESTART_DEBOUNCE_MS = 8000;

/**
 * Resolves the public webhook URL that Render can reach this instance on.
 * Priority: explicit WEBHOOK_URL → Render's RENDER_EXTERNAL_URL → RENDER_URL
 * env → the well-known hostname for this service (last-resort, only if it
 * matches the expected pattern). Returns null if nothing can be determined.
 */
function getWebhookUrl() {
  if (config.WEBHOOK_URL) return config.WEBHOOK_URL;
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
  if (config.RENDER_URL) return config.RENDER_URL;
  if (process.env.RENDER_URL) return process.env.RENDER_URL;
  // Render legacy free-tier exposes the service at:
  //   https://<service-name>-<hash>.onrender.com
  // RENDER_SERVICE_NAME + RENDER_INSTANCE_ID aren't reliable for this, so only
  // honor an explicit value. Never try to guess an unreachable hostname.
  return null;
}

/**
 * Initializes and starts the Telegram Community Management Bot.
 *
 * Two connection modes:
 *  - webhook (default on Render/production): Telegram POSTs updates to
 *    <WEBHOOK_URL>/webhook. Only ONE instance ever holds the webhook slot, so
 *    409 polling conflicts are impossible, even across deploy overlaps.
 *  - polling (local dev only): long-polling with 409 auto-recovery.
 */
function startBot() {
  if (!config.BOT_TOKEN) {
    logger.error('CRITICAL: BOT_TOKEN is empty in environment variables. Bot startup aborted.');
    return null;
  }

  try {
    logger.info('Initializing Telegram bot instance...');

    const useWebhook = config.CONNECTION_MODE === 'webhook';
    const webhookUrl = getWebhookUrl();

    // Instantiate Telegram Bot WITHOUT auto-starting polling.
    // For webhook mode we must not poll; for polling mode we start it below.
    bot = new TelegramBot(config.BOT_TOKEN, {
      polling: false
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

    if (useWebhook) {
      if (!webhookUrl) {
        logger.error('WEBHOOK MODE ACTIVE but no webhook URL could be resolved. Set WEBHOOK_URL (or RENDER_EXTERNAL_URL) in the environment, otherwise the bot will be disconnected from Telegram.');
        return bot;
      }
      // ── WEBHOOK MODE (production / Render) ─────────────────────────────
      // The Express server exposes POST <PUBLIC_URL>/webhook (see index.js);
      // bot.processUpdate() is called there. setWebhook always redirects the
      // single Telegram update slot to THIS instance, eliminating 409s.
      const full = webhookUrl.replace(/\/+$/, '') + '/webhook';
      registerWebhook(bot, full);
    } else {
      // ── POLLING MODE (local dev) ───────────────────────────────────────
      logger.warn('No webhook URL configured — using long-polling (dev mode). Set WEBHOOK_URL or RENDER_URL to use webhooks on Render.');
      bot.startPolling({ timeout: 10 }).catch(err => {
        logger.error('Failed to start polling:', err.message);
      });

      bot.getMe().then((me) => {
        logger.info(`Telegram Community Manager Bot started successfully! Username: @${me.username}`);
      }).catch(err => {
        logger.error('Failed to query bot user details during startup:', err.message);
      });

      installPollingRecovery();
    }

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
 * Registers/keeps-alive the Telegram webhook.
 * - Registers on startup.
 * - Verifies it every WEBHOOK_CHECK_MS; if Telegram reports an empty webhook
 *   URL (e.g. cleared externally, or a deploy raced and none got set), it
 *   re-registers. Retries on failure with backoff.
 */
function registerWebhook(bot, fullUrl) {
  const WEBHOOK_CHECK_MS = 30000;
  let retries = 0;

  const doRegister = () => {
    bot.setWebHook(fullUrl, {
      allowed_updates: ['message', 'callback_query', 'new_chat_members', 'left_chat_member']
    }).then(() => {
      logger.info(`Telegram webhook registered → ${fullUrl} (mode: webhook)`);
      retries = 0;
      return bot.getMe();
    }).then((me) => {
      logger.info(`Telegram Community Manager Bot started successfully! Username: @${me.username}`);
    }).catch((err) => {
      retries++;
      const delay = Math.min(retries * 15000, 120000);
      logger.error(`Failed to register Telegram webhook (${err.message}). Retrying in ${delay / 1000}s...`);
      setTimeout(doRegister, delay);
    });
  };

  // Verify the registered webhook is not empty/the correct one; re-register if needed.
  const verify = () => {
    bot.getWebHookInfo().then((info) => {
      const current = (info && info.url) || '';
      if (!current) {
        logger.warn('Webhook URL is empty on Telegram — re-registering.');
        doRegister();
      } else if (current !== fullUrl) {
        logger.warn(`Webhook points to ${current} instead of ${fullUrl} — re-registering.`);
        doRegister();
      }
    }).catch(() => {
      // Transient — attempt re-register on next cycle.
    });
  };

  doRegister();
  setInterval(verify, WEBHOOK_CHECK_MS);
}

/**
 * Auto-recovery for long-polling mode (dev only) if a 409 conflict occurs.
 * Not used in webhook mode.
 */
function installPollingRecovery() {
  let pollRetries = 0;
  let lastRestartTime = 0;

  bot.on('polling_error', (error) => {
    const now = Date.now();
    if (now - lastRestartTime < RESTART_DEBOUNCE_MS) return;

    if (pollRetries >= MAX_POLL_RETRIES) {
      logger.error('Max polling restart attempts reached. Will not retry.');
      return;
    }

    pollRetries++;
    logger.error(`Telegram Polling Error: ${error.message}`);

    const is409 = error.message && error.message.includes('409');
    const delay = is409
      ? Math.min(pollRetries * 35000, 180000)
      : Math.min(pollRetries * 5000, 30000);

    logger.info(`Restarting polling in ${delay / 1000}s (attempt ${pollRetries}/${MAX_POLL_RETRIES})${is409 ? ' [409 cooldown]' : ''}...`);

    setTimeout(async () => {
      try {
        await bot.stopPolling({ cancel: true }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));
        await bot.startPolling({ timeout: 10 });
        pollRetries = 0;
        lastRestartTime = Date.now();
        logger.info('Polling restarted successfully.');
      } catch (err) {
        logger.error(`Failed to restart polling: ${err.message}`);
      }
    }, delay);
  });
}

/**
 * Handles clean termination of resources on server crash or shutdown.
 *
 * In webhook mode we intentionally do NOT delete the webhook: Telegram holds a
 * single update slot that the next booting instance re-claims via setWebHook.
 * Deleting on shutdown would race with the successor and clear its registration.
 */
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down services gracefully...`);
  autoPostService.stop();
  groupPromoService.stop();

  if (bot) {
    if (config.CONNECTION_MODE === 'webhook') {
      // No polling running in webhook mode — nothing left to clean up.
      process.exit(0);
    } else {
      bot.stopPolling().then(() => {
        logger.info('Telegram Bot polling stopped cleanly.');
        process.exit(0);
      }).catch(err => {
        logger.error('Error stopping bot polling:', err.message);
        process.exit(1);
      });
    }
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
