const mongoose = require('mongoose');
const { isDbConnected, localCache } = require('../mongoose');

const TicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  userId: { type: Number, required: true },
  username: { type: String, default: '' },
  subject: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  messages: [{
    sender: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
});

const TicketModel = mongoose.model('Ticket', TicketSchema);

const Ticket = {
  async createTicket(userId, username, subject) {
    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticketData = {
      ticketId,
      userId,
      username: username || 'Anonymous',
      subject,
      status: 'open',
      createdAt: new Date(),
      messages: [{ sender: 'user', text: subject, timestamp: new Date() }]
    };

    if (isDbConnected()) {
      return await TicketModel.create(ticketData);
    } else {
      localCache.tickets[ticketId] = ticketData;
      return ticketData;
    }
  },

  async findByTicketId(ticketId) {
    if (isDbConnected()) {
      return await TicketModel.findOne({ ticketId });
    } else {
      return localCache.tickets[ticketId] || null;
    }
  },

  async findActiveTicketByUser(userId) {
    if (isDbConnected()) {
      return await TicketModel.findOne({ userId, status: 'open' });
    } else {
      return Object.values(localCache.tickets).find(t => t.userId === userId && t.status === 'open') || null;
    }
  },

  async addMessage(ticketId, sender, text) {
    if (isDbConnected()) {
      return await TicketModel.findOneAndUpdate(
        { ticketId },
        { $push: { messages: { sender, text, timestamp: new Date() } } },
        { new: true }
      );
    } else {
      const ticket = localCache.tickets[ticketId];
      if (ticket) {
        ticket.messages.push({ sender, text, timestamp: new Date() });
        localCache.tickets[ticketId] = ticket;
      }
      return ticket;
    }
  },

  async closeTicket(ticketId) {
    if (isDbConnected()) {
      return await TicketModel.findOneAndUpdate(
        { ticketId },
        { $set: { status: 'closed' } },
        { new: true }
      );
    } else {
      const ticket = localCache.tickets[ticketId];
      if (ticket) {
        ticket.status = 'closed';
        localCache.tickets[ticketId] = ticket;
      }
      return ticket;
    }
  },

  async getActiveTickets() {
    if (isDbConnected()) {
      return await TicketModel.find({ status: 'open' }).sort({ createdAt: -1 });
    } else {
      return Object.values(localCache.tickets).filter(t => t.status === 'open');
    }
  },

  async getAllTickets() {
    if (isDbConnected()) {
      return await TicketModel.find({}).sort({ createdAt: -1 });
    } else {
      return Object.values(localCache.tickets).sort((a, b) => b.createdAt - a.createdAt);
    }
  }
};

module.exports = { TicketModel, Ticket };
