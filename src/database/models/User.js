const mongoose = require('mongoose');
const { isDbConnected, localCache } = require('../mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true, index: true },
  username: { type: String, default: '' },
  firstName: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  warningCount: { type: Number, default: 0 },
  referralsCount: { type: Number, default: 0 },
  referredBy: { type: Number, default: null },
  joinedAt: { type: Date, default: Date.now },
  isMuted: { type: Boolean, default: false },
  muteExpiresAt: { type: Date, default: null },
  isBanned: { type: Boolean, default: false },
  restrictionCount: { type: Number, default: 0 }
});

const UserModel = mongoose.model('User', UserSchema);

// Crash-proof abstraction API
const User = {
  async findByTelegramId(userId) {
    if (isDbConnected()) {
      return await UserModel.findOne({ userId });
    } else {
      if (!localCache.users[userId]) return null;
      return localCache.users[userId];
    }
  },

  async upsertUser(userId, data) {
    if (isDbConnected()) {
      return await UserModel.findOneAndUpdate(
        { userId },
        { $set: data },
        { new: true, upsert: true }
      );
    } else {
      const existing = localCache.users[userId] || {
        userId,
        username: '',
        firstName: '',
        isVerified: false,
        warningCount: 0,
        referralsCount: 0,
        referredBy: null,
        joinedAt: new Date(),
        isMuted: false,
        muteExpiresAt: null,
        isBanned: false,
        restrictionCount: 0
      };
      
      const updated = { ...existing, ...data };
      localCache.users[userId] = updated;
      return updated;
    }
  },

  async addWarning(userId) {
    if (isDbConnected()) {
      return await UserModel.findOneAndUpdate(
        { userId },
        { $inc: { warningCount: 1 } },
        { new: true, upsert: true }
      );
    } else {
      const user = await this.upsertUser(userId, {});
      user.warningCount = (user.warningCount || 0) + 1;
      localCache.users[userId] = user;
      return user;
    }
  },

  async resetWarnings(userId) {
    if (isDbConnected()) {
      return await UserModel.findOneAndUpdate(
        { userId },
        { $set: { warningCount: 0 } },
        { new: true }
      );
    } else {
      const user = await this.findByTelegramId(userId);
      if (user) {
        user.warningCount = 0;
        localCache.users[userId] = user;
      }
      return user;
    }
  },

  async addReferral(userId, referredByUserId) {
    if (isDbConnected()) {
      // 1. Record the referrer on the new user
      await UserModel.findOneAndUpdate(
        { userId },
        { $set: { referredBy: referredByUserId } },
        { upsert: true }
      );
      // 2. Increment referral count on the referrer
      return await UserModel.findOneAndUpdate(
        { userId: referredByUserId },
        { $inc: { referralsCount: 1 } },
        { new: true, upsert: true }
      );
    } else {
      // Offline fallback
      await this.upsertUser(userId, { referredBy: referredByUserId });
      const referrer = await this.upsertUser(referredByUserId, {});
      referrer.referralsCount = (referrer.referralsCount || 0) + 1;
      localCache.users[referredByUserId] = referrer;
      return referrer;
    }
  },

  async getLeaderboard(limit = 10) {
    if (isDbConnected()) {
      return await UserModel.find({ referralsCount: { $gt: 0 } })
        .sort({ referralsCount: -1 })
        .limit(limit);
    } else {
      return Object.values(localCache.users)
        .filter(u => u.referralsCount > 0)
        .sort((a, b) => b.referralsCount - a.referralsCount)
        .slice(0, limit);
    }
  },

  async getAllUsers() {
    if (isDbConnected()) {
      return await UserModel.find({});
    } else {
      return Object.values(localCache.users);
    }
  }
};

module.exports = { UserModel, User };
