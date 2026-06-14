const config = require('../config');
const telegramService = require('./telegramService');
const logger = require('../utils/logger');
const { esc } = require('../utils/formatter');

const PROMO_MESSAGES = [
  'Stay active in the community\\! Promo codes are released randomly, so keep an eye on the group\\.',
  `🔔 Promo codes drop at random times\\! Stay active and don't miss out\\.`,
  '💎 Random promo codes are coming your way\\! Activity increases your chances of catching one\\.',
  '⚡ Promo codes are released unpredictably\\! The more active you are, the better your odds\\.',
  '🎁 Stay tuned\\! Promo codes drop randomly with no announcements\\! Be ready\\.',
  '🔥 Promo codes are scattered throughout the day\\! Stay active to grab yours\\.',
  '💡 Tip: Promo codes are released at random times\\! Keep the chat open and stay active\\.',
  '🚀 No schedules, no announcements\\! Promo codes drop randomly \\- stay sharp\\!',
  '⭐ Activity pays off\\! Promo codes are released randomly to active members\\.',
  '📢 Promo codes come without warning\\! Stay active in the community to catch them\\.'
];

class GroupPromoService {
  constructor() {
    this.timer = null;
    this.groupId = null;
    this.lastMsgIndex = -1;
    this.bot = null;
  }

  init(botInstance) {
    this.bot = botInstance;
  }

  _getRandomDelay() {
    const minMs = 15 * 60 * 1000;
    const maxMs = 30 * 60 * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  async start() {
    try {
      const groupChat = await this.bot.getChat('@CPBloomFX23');
      this.groupId = groupChat.id;
      logger.info(`GroupPromoService started — posting every 15-30 minutes to @CPBloomFX23`);
      this._scheduleNext();
    } catch (e) {
      logger.error('GroupPromoService: Could not find group @CPBloomFX23:', e.message);
    }
  }

  _scheduleNext() {
    const delay = this._getRandomDelay();
    const delayMins = Math.round(delay / 60000);
    logger.info(`Next group promo in ~${delayMins} minutes.`);

    this.timer = setTimeout(async () => {
      await this.postPromo();
      this._scheduleNext();
    }, delay);
  }

  async postPromo() {
    if (!this.groupId) return;

    try {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * PROMO_MESSAGES.length);
      } while (PROMO_MESSAGES.length > 1 && randomIndex === this.lastMsgIndex);
      this.lastMsgIndex = randomIndex;

      const promo = PROMO_MESSAGES[randomIndex];

      const admins = await this.bot.getChatAdministrators(this.groupId);
      const botInfo = await this.bot.getMe();

      const taggable = admins.filter(a => a.user.id !== botInfo.id);
      const mentions = taggable.map(m =>
        `[${esc(m.user.first_name || 'User')}](tg://user?id=${m.user.id})`
      ).join(', ');

      const fullText = `${promo}\n\n${mentions}\n\n📱 ${esc(config.POST_LINK)}`;

      await telegramService.sendMessage(this.groupId, fullText);
      logger.info(`Group promo posted (${randomIndex}/${PROMO_MESSAGES.length})`);
    } catch (e) {
      logger.error('Failed to post group promo:', e.message);
    }
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      logger.info('GroupPromoService stopped.');
    }
  }
}

module.exports = new GroupPromoService();
