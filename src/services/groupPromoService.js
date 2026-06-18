const config = require('../config');
const telegramService = require('./telegramService');
const logger = require('../utils/logger');
const { esc } = require('../utils/formatter');

const PROMO_MESSAGES = [
  'Stay active in the community\\! Promo codes are released randomly, so keep an eye on the group\\.',
  '🔔 Promo codes drop at random times\\! Stay active and don\'t miss out\\.',
  '💎 Random promo codes are coming your way\\! Activity increases your chances of catching one\\.',
  '⚡ Promo codes are released unpredictably\\! The more active you are, the better your odds\\.',
  '🎁 Stay tuned\\! Promo codes drop randomly with no announcements\\! Be ready\\.',
  '🔥 Promo codes are scattered throughout the day\\! Stay active to grab yours\\.',
  '💡 Tip: Promo codes are released at random times\\! Keep the chat open and stay active\\.',
  '🚀 No schedules, no announcements\\! Promo codes drop randomly \\- stay sharp\\!',
  '⭐ Activity pays off\\! Promo codes are released randomly to active members\\.',
  '📢 Promo codes come without warning\\! Stay active in the community to catch them\\.'
];

const SENTIMENT_MESSAGES = [
  'Bigger locked balance\\. Bigger rewards\\.',
  'Lock more\\. Earn more\\.',
  'Your balance determines your earning potential\\.',
  'Every deposit moves you closer to higher rewards\\.',
  'Grow your capital\\. Grow your income\\.',
  'Higher deposits unlock higher ranks\\.',
  'Every rank opens new opportunities\\.',
  'Smart investing starts with commitment\\.',
  'Let your capital work for you\\.',
  'Earn while your funds stay secured\\.',
  'Bigger commitments deserve bigger returns\\.',
  'Wealth favors consistency\\.',
  'Unlock the next level of passive income\\.',
  'Build your portfolio one deposit at a time\\.',
  'Invest today\\. Benefit tomorrow\\.',
  'Stronger portfolios earn stronger rewards\\.',
  'Scale your deposits\\. Scale your earnings\\.',
  'Every rank is a milestone toward financial growth\\.',
  'Higher tiers unlock premium earning rates\\.',
  'Success starts with a single deposit\\.',
  'Stay invested\\. Stay rewarded\\.',
  'More capital creates more possibilities\\.',
  'Consistent growth begins with commitment\\.',
  'The journey to financial freedom starts here\\.',
  'Bigger deposits unlock greater opportunities\\.',
  'Your financial future starts today\\.',
  'Let AI do the heavy lifting\\.',
  'Intelligent trading\\. Consistent opportunities\\.',
  'Your wealth deserves intelligent automation\\.',
  'Automated strategies\\. Smarter investing\\.',
  'Unlock the power of AI\\-driven trading\\.',
  'Every second your assets keep working\\.',
  'Invest smarter, not harder\\.',
  'Put your money to work around the clock\\.',
  'AI never sleeps\\.',
  'Trade beyond human limitations\\.',
  'Automation meets opportunity\\.',
  'Experience the future of investing\\.',
  'The smarter way to grow wealth\\.',
  'Precision\\-powered investing\\.',
  'Designed for ambitious investors\\.',
  'Your capital deserves premium performance\\.',
  'Invest with confidence\\.',
  'Premium rewards for committed investors\\.',
  'The future belongs to disciplined investors\\.',
  'Bigger visions require bigger investments\\.',
  'Every level brings greater possibilities\\.',
  'Every deposit builds momentum\\.',
  'The higher the rank, the greater the rewards\\.',
  'Financial growth begins with decisive action\\.',
  'Lock assets to maximize potential\\.',
  'Build wealth with confidence\\.',
  'Smart decisions create lasting rewards\\.',
  'Turn idle funds into active opportunities\\.',
  'Every investment tells a success story\\.',
  'Opportunity rewards commitment\\.',
  'Your next level is one deposit away\\.',
  'The path to premium rewards starts here\\.',
  'Higher ranks\\. Greater benefits\\.',
  'Grow stronger with every upgrade\\.',
  'Unlock exclusive earning advantages\\.',
  'Invest with purpose\\.',
  'Your capital is your greatest asset\\.',
  'Premium investors enjoy premium opportunities\\.',
  'Bigger balances unlock elite status\\.',
  'Wealth grows through consistency\\.',
  'Stay committed\\. Stay rewarded\\.',
  'Unlock more with every milestone\\.',
  'Progress starts with participation\\.',
  'The future rewards those who prepare today\\.',
  'Every deposit strengthens your portfolio\\.',
  'Invest in your future self\\.',
  'Every rank is earned through commitment\\.',
  'Success compounds over time\\.',
  'Greater commitment unlocks greater possibilities\\.',
  'Financial excellence starts here\\.',
  'Build a stronger financial tomorrow\\.',
  'AI\\-powered opportunities never stop\\.',
  'Advanced automation\\. Real opportunities\\.',
  'Powered by intelligent market analysis\\.',
  'Every opportunity counts\\.',
  'Let technology amplify your investing journey\\.',
  'Consistency creates confidence\\.',
  'Higher ranks mean higher earning potential\\.',
  'Commit more\\. Unlock more\\.',
  'Your journey to elite investing begins now\\.',
  'Bigger deposits accelerate your progress\\.',
  'Every level rewards your commitment\\.',
  'Smart capital deserves smart management\\.',
  'Wealth creation starts with action\\.',
  'Every locked balance contributes to your growth\\.',
  'Intelligent investing made simple\\.',
  'Grow with every milestone\\.',
  'Every upgrade unlocks greater earning power\\.',
  'More deposits\\. More advantages\\.',
  'Invest with vision\\.',
  'The future of wealth is automated\\.',
  'Financial growth through intelligent technology\\.',
  'Your success is built one investment at a time\\.',
  'Bigger ambitions deserve bigger opportunities\\.',
  'Unlock your full earning potential\\.',
  'Every day is another opportunity to grow\\.',
  'Build wealth through disciplined investing\\.',
  'Progress is measured by commitment\\.',
  'Every rank is a step toward financial excellence\\.',
  'Invest confidently\\. Earn consistently\\.',
  'Strong foundations create lasting wealth\\.',
  'Elevate your financial journey\\.',
  'Premium performance begins with premium commitment\\.',
  'The next level is waiting for you\\.',
  'Smart investing never stops\\.',
  'Every contribution moves you forward\\.',
  'Wealth grows through intelligent decisions\\.',
  'Stay ahead with AI\\-powered investing\\.',
  'Make your money work harder\\.',
  'Unlock greater rewards every month\\.',
  'Invest today for tomorrow\'s opportunities\\.',
  'Bigger balances unlock bigger futures\\.',
  'Rise through the ranks with every deposit\\.',
  'Every investment is a step toward financial independence\\.'
];

const ALL_MESSAGES = [...PROMO_MESSAGES, ...SENTIMENT_MESSAGES];

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
    if (!config.GROUP_ID) {
      logger.warn('GROUP_ID not configured. GroupPromoService disabled.');
      return;
    }
    this.groupId = parseInt(config.GROUP_ID, 10);
    logger.info(`GroupPromoService started — posting every 15-30 minutes to ${config.GROUP_LINK}`);
    this._scheduleNext();
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
        randomIndex = Math.floor(Math.random() * ALL_MESSAGES.length);
      } while (ALL_MESSAGES.length > 1 && randomIndex === this.lastMsgIndex);
      this.lastMsgIndex = randomIndex;

      const promo = ALL_MESSAGES[randomIndex];

      const admins = await this.bot.getChatAdministrators(this.groupId);
      const botInfo = await this.bot.getMe();

      const taggable = admins.filter(a => a.user.id !== botInfo.id);
      const mentions = taggable.map(m =>
        `[${esc(m.user.first_name || 'User')}](tg://user?id=${m.user.id})`
      ).join(', ');

      const fullText = `${promo}\n\n${mentions}\n\n📱 ${esc(config.POST_LINK)}`;

      await telegramService.sendMessage(this.groupId, fullText);
      logger.info(`Group promo posted (${randomIndex}/${ALL_MESSAGES.length})`);
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
