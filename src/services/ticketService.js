const { Ticket } = require('../database/models/Ticket');
const telegramService = require('./telegramService');
const config = require('../config');
const logger = require('../utils/logger');
const { esc, header, DIVIDER } = require('../utils/formatter');

class TicketService {
  /**
   * Opens a new support ticket and alerts all community administrators
   */
  async openUserTicket(userId, username, queryText) {
    try {
      // 1. Check if user already has an open ticket
      const activeTicket = await Ticket.findActiveTicketByUser(userId);
      if (activeTicket) {
        return {
          success: false,
          message: '⚠️ You already have an open support ticket\\. Please wait for our team to resolve it before opening a new one\\.'
        };
      }

      // 2. Create the ticket
      const ticket = await Ticket.createTicket(userId, username, queryText);
      logger.info(`New support ticket opened: ${ticket.ticketId} by @${username}`);

      // 3. Notify all admins in the admin list
      const adminAlertText = `${header('New Support Ticket', '🎟️')}` +
        `🎫 *Ticket ID:* \`${ticket.ticketId}\`\n` +
        `👤 *User:* @${esc(username)} \\(ID: \`${userId}\`\\)\n` +
        `💬 *Subject/Query:* \n_"${esc(queryText)}_" \n` +
        `${DIVIDER}` +
        `⚡ *How to respond:* \nUse \`/reply ${ticket.ticketId} <message>\` to answer directly\\.\n` +
        `Or click below to close the ticket\\.`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '🔒 Close Ticket', callback_data: `close_ticket_${ticket.ticketId}` }
          ]
        ]
      };

      for (const adminId of config.ADMIN_IDS) {
        await telegramService.sendDirectMessage(adminId, adminAlertText, { reply_markup: replyMarkup });
      }

      return {
        success: true,
        ticket,
        message: `${header('Ticket Opened', '🎫')}` +
          `Your support request has been registered successfully\\!\n\n` +
          `🔑 *Ticket Ref:* \`${ticket.ticketId}\`\n\n` +
          `Our technical and financial support agents have been notified\\. You will receive their reply directly here in this chat shortly\\.`
      };
    } catch (error) {
      logger.error('Failed to open user ticket:', error.message);
      return { success: false, message: '❌ An error occurred while opening your support ticket\\. Please try again later\\.' };
    }
  }

  /**
   * Forwards an admin reply to the ticket's creator
   */
  async replyToTicket(ticketId, adminUsername, replyText) {
    try {
      const ticket = await Ticket.findByTicketId(ticketId);
      if (!ticket) {
        return { success: false, message: `❌ Ticket \`${ticketId}\` not found\\.` };
      }

      if (ticket.status === 'closed') {
        return { success: false, message: `⚠️ Ticket \`${ticketId}\` is already closed\\.` };
      }

      // 1. Add reply to DB history
      await Ticket.addMessage(ticketId, 'admin', replyText);
      
      // 2. Format and send DM to the user
      const userMessage = `${header('Support Representative Reply', '👨‍💼')}` +
        `🎫 *Ticket Ref:* \`${ticketId}\`\n` +
        `👤 *Agent:* *CPBloomFX Support Team*\n\n` +
        `💬 *Message:*\n_${esc(replyText)}_\n` +
        `${DIVIDER}` +
        `💡 If you need further assistance, just send a direct reply here\\!`;

      const dmSent = await telegramService.sendDirectMessage(ticket.userId, userMessage);
      if (!dmSent) {
        return {
          success: false,
          message: `⚠️ Reply registered in database, but the DM could not be delivered\\. The user may have blocked the bot or not started it in private chat\\.`
        };
      }

      logger.info(`Admin reply sent to user ${ticket.userId} for ticket ${ticketId}`);
      return { success: true, ticket };
    } catch (error) {
      logger.error('Failed to send ticket reply:', error.message);
      return { success: false, message: '❌ An error occurred while sending the ticket reply\\.' };
    }
  }

  /**
   * Closes a ticket and informs the creator
   */
  async closeTicket(ticketId, closedByAdmin = true) {
    try {
      const ticket = await Ticket.findByTicketId(ticketId);
      if (!ticket) {
        return { success: false, message: `❌ Ticket \`${ticketId}\` not found\\.` };
      }

      if (ticket.status === 'closed') {
        return { success: false, message: `⚠️ Ticket \`${ticketId}\` is already closed\\.` };
      }

      // 1. Update ticket in DB
      await Ticket.closeTicket(ticketId);
      logger.info(`Support ticket ${ticketId} has been closed.`);

      // 2. Alert the user
      const userAlert = `${header('Ticket Resolved', '🔒')}` +
        `🎫 *Ticket Ref:* \`${ticketId}\`\n\n` +
        `Your ticket has been marked as *RESOLVED* and closed by our administration team\\.\n` +
        `Thank you for reaching out to CPBloomFX support\\!`;

      await telegramService.sendDirectMessage(ticket.userId, userAlert);

      // 3. Alert admins
      const adminAlert = `🔒 *Support Ticket ${ticketId}* has been closed successfully\\.`;
      for (const adminId of config.ADMIN_IDS) {
        await telegramService.sendDirectMessage(adminId, adminAlert);
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to close ticket:', error.message);
      return { success: false, message: '❌ Failed to close ticket due to server error\\.' };
    }
  }
}

module.exports = new TicketService();
