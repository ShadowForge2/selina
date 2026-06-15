const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.splat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    const rest = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '';
    if (rest) msg += ` | ${rest}`;
    return msg;
  })
);

// Colorized format for terminal
const consoleFormat = winston.format.combine(
  winston.format.splat(),
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `\x1b[90m[${timestamp}]\x1b[0m ${level}: ${message}`;
    const rest = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '';
    if (rest) msg += ` | ${rest}`;
    return msg;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Console output
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// Add logs directories if deployed in environments where persistence exists
try {
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    maxsize: 5242880,
    maxFiles: 5
  }));
} catch (e) {
  // If file permissions deny directory creation, fallback to console only
  logger.warn('Failed to initialize file log transports. Running in Console-only mode.');
}

// Dedicated helpers for specific community logs
logger.moderation = (admin, target, action, reason) => {
  logger.info(`[MODERATION] Admin @${admin} performed [${action}] on @${target}. Reason: ${reason || 'N/A'}`);
};

logger.join = (username, userId, invitedBy = 'Direct') => {
  logger.info(`[USER JOIN] @${username} (ID: ${userId}) joined. Invited by: ${invitedBy}`);
};

module.exports = logger;
