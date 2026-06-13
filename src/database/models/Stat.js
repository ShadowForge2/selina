const mongoose = require('mongoose');
const { isDbConnected, localCache } = require('../mongoose');

const StatSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global_stats' },
  messagesCount: { type: Number, default: 0 },
  joinsCount: { type: Number, default: 0 },
  warnsCount: { type: Number, default: 0 },
  kicksCount: { type: Number, default: 0 },
  bansCount: { type: Number, default: 0 }
});

const StatModel = mongoose.model('Stat', StatSchema);

const Stat = {
  async getStats() {
    if (isDbConnected()) {
      let stats = await StatModel.findOne({ key: 'global_stats' });
      if (!stats) {
        stats = await StatModel.create({ key: 'global_stats' });
      }
      return stats;
    } else {
      return localCache.stats;
    }
  },

  async incrementMetric(metricName) {
    if (isDbConnected()) {
      const inc = {};
      inc[metricName] = 1;
      return await StatModel.findOneAndUpdate(
        { key: 'global_stats' },
        { $inc: inc },
        { new: true, upsert: true }
      );
    } else {
      if (typeof localCache.stats[metricName] !== 'undefined') {
        localCache.stats[metricName] += 1;
      }
      return localCache.stats;
    }
  }
};

module.exports = { StatModel, Stat };
