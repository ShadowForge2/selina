const logger = require('../utils/logger');

module.exports = {
  name: 'left_chat_member',
  async execute(msg, bot) {
    const { chat, left_chat_member } = msg;

    const username = left_chat_member.username || left_chat_member.first_name;
    const userId = left_chat_member.id;

    logger.info(`[USER LEAVE] @${username} (ID: ${userId}) has left the group chat ${chat.title}`);
  }
};
