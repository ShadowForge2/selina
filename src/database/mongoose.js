const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

let isConnected = false;
let offlineFallback = false;

// Local offline cache to prevent crashes if DB is completely unavailable during dev
const localCache = {
  users: {},
  tickets: {},
  stats: {
    messagesCount: 0,
    joinsCount: 0,
    warnsCount: 0,
    kicksCount: 0,
    bansCount: 0
  }
};

/**
 * Initializes connection to MongoDB.
 * Falls back to offline-mode gracefully to avoid bot crashes.
 */
async function connectDatabase() {
  if (!config.DATABASE_URL) {
    logger.warn('DATABASE_URL is missing. Bot will operate in Offline Memory Mode (Data will not persist across restarts).');
    offlineFallback = true;
    return;
  }

  try {
    mongoose.set('strictQuery', true);
    
    // Connect to database
    await mongoose.connect(config.DATABASE_URL, {
      serverSelectionTimeoutMS: 5000 // Timeout fast if DB offline
    });

    isConnected = true;
    offlineFallback = false;
    logger.info('Successfully connected to MongoDB.');
  } catch (error) {
    logger.error('Mongoose connection error, falling back to Offline Memory Mode:', error.message);
    offlineFallback = true;
  }
}

// Database Status helpers
function isDbConnected() {
  return isConnected && !offlineFallback;
}

module.exports = {
  connectDatabase,
  isDbConnected,
  localCache
};
