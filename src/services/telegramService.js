const logger = require('../utils/logger');
const { esc } = require('../utils/formatter');

// We will export a service that is initialized with the bot instance
class TelegramService {
  constructor() {
    this.bot = null;
  }

  // Set the bot instance after it's initialized in bot.js
  init(botInstance) {
    this.bot = botInstance;
    logger.info('TelegramService initialized with bot instance.');
  }

  /**
   * Send a robust MarkdownV2 message to any Chat/Channel
   */
  async sendMessage(chatId, text, options = {}) {
    if (!this.bot) return logger.error('Bot not initialized in TelegramService');
    try {
      const defaultOptions = {
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
        ...options
      };
      return await this.bot.sendMessage(chatId, text, defaultOptions);
    } catch (error) {
      logger.error(`Failed to send message to ${chatId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete any message in a group/channel (if bot is admin)
   */
  async deleteMessage(chatId, messageId) {
    if (!this.bot) return;
    try {
      await this.bot.deleteMessage(chatId, messageId);
      logger.info(`Message ${messageId} deleted from chat ${chatId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete message ${messageId} from ${chatId}:`, error.message);
      return false;
    }
  }

  /**
   * Mute a group member temporarily
   */
  async muteUser(chatId, userId, durationMinutes = 60) {
    if (!this.bot) return;
    try {
      const untilDate = Math.floor(Date.now() / 1000) + (durationMinutes * 60);
      
      // Restrict chat member permissions to false
      await this.bot.restrictChatMember(chatId, userId, {
        until_date: untilDate,
        permissions: {
          can_send_messages: false,
          can_send_media_messages: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false
        }
      });
      logger.info(`User ${userId} muted in chat ${chatId} for ${durationMinutes}m.`);
      return true;
    } catch (error) {
      logger.error(`Failed to mute user ${userId} in ${chatId}:`, error.message);
      return false;
    }
  }

  /**
   * Unmute a group member
   */
  async unmuteUser(chatId, userId) {
    if (!this.bot) return;
    try {
      await this.bot.restrictChatMember(chatId, userId, {
        permissions: {
          can_send_messages: true,
          can_send_media_messages: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
          can_invite_users: true
        }
      });
      logger.info(`User ${userId} unmuted in chat ${chatId}.`);
      return true;
    } catch (error) {
      logger.error(`Failed to unmute user ${userId} in ${chatId}:`, error.message);
      return false;
    }
  }

  /**
   * Ban a member from a group (removes them and prevents re-entry)
   */
  async banUser(chatId, userId) {
    if (!this.bot) return;
    try {
      await this.bot.banChatMember(chatId, userId);
      logger.info(`User ${userId} banned from chat ${chatId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to ban user ${userId} from ${chatId}:`, error.message);
      return false;
    }
  }

  /**
   * Kick/Remove a user from a group (can re-join via link)
   */
  async kickUser(chatId, userId) {
    if (!this.bot) return;
    try {
      // Ban and immediately unban to simulate a kick in Telegram APIs
      await this.bot.banChatMember(chatId, userId);
      await this.bot.unbanChatMember(chatId, userId);
      logger.info(`User ${userId} kicked from chat ${chatId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to kick user ${userId} from ${chatId}:`, error.message);
      return false;
    }
  }

  /**
   * Check if a Telegram user is an administrator in the group
   */
  async isAdmin(chatId, userId) {
    if (!this.bot) return false;
    try {
      // Direct message is always considered authorized
      if (chatId === userId) return true;
      
      const chatMember = await this.bot.getChatMember(chatId, userId);
      return ['creator', 'administrator'].includes(chatMember.status);
    } catch (error) {
      // If error (like user not found), return false
      return false;
    }
  }

  /**
   * Send a beautiful DM to a user (Auto DM system)
   */
  async sendDirectMessage(userId, text, options = {}) {
    if (!this.bot) return;
    try {
      const defaultOptions = {
        parse_mode: 'MarkdownV2',
        ...options
      };
      return await this.bot.sendMessage(userId, text, defaultOptions);
    } catch (error) {
      // Often happens if user hasn't started the bot in DM
      logger.warn(`Could not send DM to user ${userId}: ${error.message}. User might not have started the bot in DM.`);
      return null;
    }
  }

  /**
   * Send a physical document/file directly to a Telegram chat
   */
  async sendDocument(chatId, filePath, options = {}) {
    if (!this.bot) return;
    try {
      return await this.bot.sendDocument(chatId, filePath, options);
    } catch (error) {
      logger.error(`Failed to send document to ${chatId}: ${error.message}`);
      return null;
    }
  }
}

module.exports = new TelegramService();
