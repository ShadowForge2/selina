const config = require('../config');
const telegramService = require('./telegramService');
const logger = require('../utils/logger');
const { esc, header, DIVIDER } = require('../utils/formatter');
const { Stat } = require('../database/models/Stat');

// ─────────────────────────────────────────────────────────────────────────────
// RICH CHANNEL CONTENT LIBRARY
// Each post is a unique, engaging message about trading, copy-trading, risk
// management, market insights, and the CPBloomFX platform value proposition.
// ─────────────────────────────────────────────────────────────────────────────

const CHANNEL_POSTS = [

  // ── MARKET INSIGHTS ────────────────────────────────────────────────────────
  {
    type: 'MARKET_INSIGHT',
    build: () => {
      return `${header('ETHEREUM MARKET PULSE', '📊')}` +
        `Ethereum continues to demonstrate strong institutional demand as the network processes over *1\\.2 million* daily transactions\\.\n\n` +
        `📈 *Current Price Zone:* ETH is consolidating near key support, signaling a potential breakout\\.\n` +
        `🔥 *Market Volatility:* Moderate \\- ideal conditions for strategic copy\\-trading entries\\.\n` +
        `💎 *Smart Money Flow:* Whale wallets have accumulated over *120K ETH* in the past 7 days\\.\n\n` +
        `🤖 _Our CPBloomFX algorithm is already positioned\\. Your copy\\-trading node mirrors every move in real\\-time\\._\n` +
        `${DIVIDER}` +
        `⚡ *CPBloomFX* \\| Automated profits, zero guesswork\\.`;
    }
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => {
      return `${header('BITCOIN DOMINANCE REPORT', '🏆')}` +
        `Bitcoin dominance is currently trending at *54\\.2%*, indicating that capital is rotating between BTC and altcoins\\.\n\n` +
        `📊 *What this means for you:*\n` +
        `• Altcoin season may be approaching \\- diversified exposure is key\\.\n` +
        `• Our master traders are actively adjusting portfolio allocations\\.\n` +
        `• Your CPBloomFX account automatically mirrors these institutional moves\\.\n\n` +
        `🚀 _While retail traders guess, our copy\\-trading engine executes with precision\\._\n` +
        `${DIVIDER}` +
        `📈 *CPBloomFX* \\| Copy the experts, grow your capital\\.`;
    }
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => {
      return `${header('GOLD & FOREX VOLATILITY ALERT', '🌍')}` +
        `Global forex markets are experiencing elevated volatility following central bank policy updates\\.\n\n` +
        `💹 *Key Pairs in Focus:*\n` +
        `• *EUR/USD* \\- High momentum, trending near critical resistance\\.\n` +
        `• *GBP/JPY* \\- Breakout potential on the 4H timeframe\\.\n` +
        `• *XAU/USD \\(Gold\\)* \\- Safe\\-haven demand pushing prices higher\\.\n\n` +
        `🔍 Our experienced master traders are capitalizing on these moves right now\\. Every trade is mirrored to your CPBloomFX account automatically\\.\n` +
        `${DIVIDER}` +
        `🌐 *CPBloomFX* \\| Professional trading, accessible to everyone\\.`;
    }
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => {
      return `${header('CRYPTO MARKET OVERVIEW', '🔎')}` +
        `The total crypto market cap has surpassed *$2\\.8 Trillion*, with strong momentum across major assets\\.\n\n` +
        `📊 *Assets We\\'re Tracking:*\n` +
        `• *BTC* \\- Institutional inflows remain strong via spot ETFs\\.\n` +
        `• *ETH* \\- Layer 2 adoption driving demand\\.\n` +
        `• *SOL* \\- Ecosystem growth accelerating\\.\n\n` +
        `💡 _Our CPBloomFX master nodes are actively trading these assets\\. Connect your account and let the algorithm work for you\\._\n` +
        `${DIVIDER}` +
        `🤖 *CPBloomFX* \\| Your personal trading team, 24/7\\.`;
    }
  },

  // ── MARKET INSIGHTS (NEW) ──────────────────────────────────────────────────
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('ETH MOMENTUM WATCH', '📊')}ETH is gaining momentum today as traders monitor key support and resistance levels\\. Market activity remains strong\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('BITCOIN DOMINANCE UPDATE', '🏆')}Bitcoin dominance continues to rise, showing investors are focusing on the market leader during current conditions\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('GOLD VOLATILITY WATCH', '🌍')}Gold volatility has increased this week, creating opportunities for traders who understand risk management\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('FOREX MARKET UPDATE', '💹')}Forex markets remain active with major currency pairs reacting to economic news and central bank updates\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('ETHEREUM VOLUME SURGE', '📊')}Ethereum trading volume has expanded significantly, reflecting increased interest from investors\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('INSTITUTIONAL BTC INTEREST', '🏆')}Bitcoin continues to attract attention as institutional participation in digital assets grows\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('VOLATILITY OPPORTUNITIES', '🌍')}Market volatility often creates opportunities for disciplined investors who follow a proven strategy\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('ETH ECOSYSTEM GROWTH', '📊')}ETH remains one of the most watched digital assets due to its ecosystem growth and utility\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('GLOBAL MARKETS OVERVIEW', '💹')}Global markets are showing mixed signals, making risk management more important than ever\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('BTC MARKET SENTIMENT', '🏆')}BTC price movements continue to influence overall crypto market sentiment\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('INFLATION DATA WATCH', '📊')}Investors are closely watching inflation data for clues about future market direction\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('GOLD AS SAFE HAVEN', '🌍')}Gold remains a popular store of value during uncertain economic conditions\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('CRYPTO ADOPTION TRENDS', '🏆')}Crypto adoption continues expanding across businesses and consumers worldwide\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('ETH STAKING GROWTH', '📊')}Ethereum staking participation highlights growing confidence in the network\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('LONG-TERM FOCUS', '💹')}Smart investors focus on long\\-term trends rather than short\\-term noise\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('ECONOMIC ANNOUNCEMENTS', '🌍')}Major economic announcements can create sudden volatility across all markets\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('BITCOIN BENCHMARK', '🏆')}Bitcoin remains the benchmark asset for the cryptocurrency sector\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('MARKET CYCLES', '📊')}Market cycles reward patience and strategic decision\\-making\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('DIVERSIFICATION BENEFITS', '💹')}Diversified investors often benefit from exposure to multiple asset classes\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'MARKET_INSIGHT',
    build: () => `${header('MARKET SENTIMENT ANALYSIS', '🌍')}Understanding market sentiment can improve investment decisions\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },

  // ── COPY-TRADING PLATFORM PROMOTION ────────────────────────────────────────
  {
    type: 'PLATFORM',
    build: () => {
      return `${header('WHY COPY-TRADING WINS', '🏅')}` +
        `Most retail traders lose money because of *emotions, poor timing, and lack of experience*\\.\n\n` +
        `✅ *CPBloomFX solves this:*\n` +
        `• 🧠 *Expert Traders* \\- You copy professionals with years of experience\\.\n` +
        `• 🤖 *Automated Execution* \\- Trades are mirrored instantly to your account\\.\n` +
        `• 📊 *Optimized Returns* \\- Our platform is engineered to deliver up to *50% returns* on your tradable balance monthly\\.\n` +
        `• 🛡️ *Risk Controls* \\- Built\\-in safeguards protect your capital at all times\\.\n\n` +
        `🎯 _Stop guessing\\. Start copying the best\\._\n` +
        `${DIVIDER}` +
        `📱 *Download the BloomFX App* to get started today\\!`;
    }
  },
  {
    type: 'PLATFORM',
    build: () => {
      return `${header('HOW CPBLOOMFX WORKS', '⚙️')}` +
        `Getting started is simple\\. Here\\'s how our copy\\-trading platform works:\\n\n` +
        `1️⃣ *Download* the BloomFX App and create your trading account\\.\n` +
        `2️⃣ *Fund* your account via Paystack or Crypto deposit\\.\n` +
        `3️⃣ *Connect* to our automated MT4/MT5 master trading node\\.\n` +
        `4️⃣ *Sit Back* \\- Our expert traders execute, your account mirrors every move\\.\n\n` +
        `💰 *Expected Performance:* Up to *50% monthly returns* on your tradable balance, optimized by our proprietary algorithms\\.\n\n` +
        `🔒 _Your funds stay in YOUR account\\. We only mirror the trades\\._\n` +
        `${DIVIDER}` +
        `🚀 *CPBloomFX* \\| Smart money, simplified\\.`;
    }
  },
  {
    type: 'PLATFORM',
    build: () => {
      return `${header('UNLOCK HIGHER LIMITS WITH RANKS', '🥇')}` +
        `CPBloomFX uses a *tiered ranking system* to protect both the market and platform accuracy\\.\n\n` +
        `📈 *How Ranks Work:*\n` +
        `• 🥉 *Bronze* \\- Starter tier with conservative trade mirroring\\.\n` +
        `• 🥈 *Silver* \\- Increased trading limits and exposure\\.\n` +
        `• 🥇 *Gold* \\- Premium access to high\\-frequency strategies\\.\n` +
        `• 💎 *Diamond* \\- Maximum limits with VIP master node allocation\\.\n\n` +
        `⬆️ *Higher deposits unlock higher ranks*, which increases your monthly trading limit and profit potential\\.\n\n` +
        `🛡️ _Limits exist to maintain platform accuracy and protect your capital\\. This is how we sustain consistent 50% returns\\._\n` +
        `${DIVIDER}` +
        `👑 *CPBloomFX* \\| Grow your rank, grow your wealth\\.`;
    }
  },
  {
    type: 'PLATFORM',
    build: () => {
      return `${header('50% MONTHLY RETURNS — HOW?', '💎')}` +
        `People ask: *"How does CPBloomFX deliver up to 50% monthly returns?"*\n\n` +
        `Here\\'s the truth:\n` +
        `• 📊 *Expert Execution* \\- Our master traders have 5\\-10\\+ years of market experience\\.\n` +
        `• 🤖 *Algorithmic Precision* \\- AI\\-optimized entry and exit points\\.\n` +
        `• 🛡️ *Strict Risk Limits* \\- We cap exposure per trade to protect the entire ecosystem\\.\n` +
        `• 📈 *Diversified Strategies* \\- Forex, Crypto, and Commodities across multiple timeframes\\.\n\n` +
        `The *50% monthly target* is a carefully calibrated limit \\- not a promise of reckless gains\\. It\\'s engineered for sustainability\\.\n\n` +
        `⚠️ _Higher deposits increase your rank and trading limits, allowing you to maximize this target\\._\n` +
        `${DIVIDER}` +
        `🏆 *CPBloomFX* \\| Performance you can trust\\.`;
    }
  },

  // ── PLATFORM (NEW) ─────────────────────────────────────────────────────────
  {
    type: 'PLATFORM',
    build: () => `${header('COPY TRADING SIMPLIFIED', '⚙️')}CPBloomFX makes copy trading simple by connecting investors with experienced traders\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('FOCUS ON YOUR GOALS', '🎯')}Let professional traders do the market analysis while you focus on your goals\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('ACCESS PRO STRATEGIES', '📊')}Copy trading allows beginners to access strategies used by experienced market participants\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('TRANSPARENT RANKINGS', '🥇')}Our ranking system helps investors identify consistent trading performance\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('SIMPLICITY & TRANSPARENCY', '⚙️')}CPBloomFX is designed for investors who value simplicity and transparency\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('LEARN FROM THE BEST', '🎯')}Build your portfolio by following traders with proven track records\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('EXPERTISE OVER GUESSWORK', '📊')}Smart investing starts with leveraging expertise instead of relying on guesswork\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('REMOVE EMOTIONAL TRADING', '🧠')}Automated copy trading helps remove emotional decision\\-making from investing\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('MARKET ACCESS', '🌐')}Gain exposure to market opportunities without spending hours studying charts\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('BRIDGING THE GAP', '⚙️')}Our platform helps bridge the gap between new and experienced investors\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('PERFORMANCE METRICS', '📊')}Investors can monitor performance metrics in a transparent environment\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('SAVE TIME INVESTING', '⏰')}Following skilled traders can save time while maintaining market exposure\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('MODERN INVESTOR TOOLS', '🎯')}CPBloomFX provides tools designed for modern investors\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('ACCESSIBLE STRATEGIES', '🌐')}Professional strategies are now more accessible than ever before\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('CONVENIENCE MATTERS', '⚙️')}Many investors choose copy trading because of its convenience and simplicity\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('DISCIPLINED INVESTING', '📊')}Our platform encourages disciplined and consistent investing practices\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('TECH MEETS EXPERIENCE', '🧠')}Smart technology and experienced traders work together to create opportunities\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('INVESTING UNCOMPLICATED', '🎯')}Investing doesn\\'t need to be complicated when you have the right tools\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('BUILD CONFIDENCE', '🌐')}Build confidence by learning from experienced market participants\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'PLATFORM',
    build: () => `${header('JOIN THE COMMUNITY', '⚙️')}Join a growing community of investors exploring copy trading\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },

  // ── RISK MANAGEMENT & EDUCATION ────────────────────────────────────────────
  {
    type: 'EDUCATION',
    build: () => {
      return `${header('RISK MANAGEMENT 101', '🛡️')}` +
        `The *#1 reason* traders blow their accounts? *Poor risk management\\.*\n\n` +
        `📚 *Golden Rules of Trading:*\n` +
        `• Never risk more than *1\\-2%* of your account on a single trade\\.\n` +
        `• Always define your *stop\\-loss BEFORE entering* a position\\.\n` +
        `• Diversify across assets \\- never go all\\-in on one trade\\.\n` +
        `• Emotions kill profits \\- stick to your strategy\\.\n\n` +
        `🤖 _This is exactly why CPBloomFX exists\\. Our system removes emotional decisions and applies institutional\\-grade risk controls to every trade\\._\n` +
        `${DIVIDER}` +
        `📖 *CPBloomFX Academy* \\| Knowledge is the ultimate leverage\\.`;
    }
  },
  {
    type: 'EDUCATION',
    build: () => {
      return `${header('WHAT IS COPY-TRADING?', '📘')}` +
        `New to the markets? Here\\'s a simple breakdown:\n\n` +
        `🔄 *Copy\\-Trading* means your account automatically mirrors the trades of experienced, profitable traders in real\\-time\\.\n\n` +
        `✅ *You DON\\'T need to:*\n` +
        `• Spend hours analyzing charts\\.\n` +
        `• Learn complex technical indicators\\.\n` +
        `• Stay glued to your screen 24/7\\.\n\n` +
        `✅ *You DO get:*\n` +
        `• Professional\\-grade trade execution\\.\n` +
        `• Automated risk management\\.\n` +
        `• Up to 50% returns on your balance monthly\\.\n\n` +
        `📱 _Download the BloomFX App and connect to our master node in under 5 minutes\\._\n` +
        `${DIVIDER}` +
        `🎓 *CPBloomFX* \\| Trading made accessible\\.`;
    }
  },
  {
    type: 'EDUCATION',
    build: () => {
      return `${header('UNDERSTANDING MARKET VOLATILITY', '🌊')}` +
        `Volatility is not your enemy \\- it\\'s your *opportunity*\\.\n\n` +
        `📈 *High Volatility =* More price movement = More profit potential\\.\n` +
        `📉 *Low Volatility =* Calm markets = Time to prepare positions\\.\n\n` +
        `🧠 *How CPBloomFX handles volatility:*\n` +
        `• Our master traders thrive in volatile conditions\\.\n` +
        `• Risk parameters are dynamically adjusted based on market conditions\\.\n` +
        `• Drawdown limits protect your capital during sudden moves\\.\n\n` +
        `💡 _Whether the market pumps or dumps, our copy\\-trading engine is built to perform\\._\n` +
        `${DIVIDER}` +
        `📊 *CPBloomFX* \\| Profit in any market condition\\.`;
    }
  },
  {
    type: 'EDUCATION',
    build: () => {
      return `${header('THE POWER OF COMPOUND GROWTH', '📐')}` +
        `Let\\'s talk numbers\\.\n\n` +
        `💰 If you deposit *$500* and earn *50% monthly*:\n` +
        `• Month 1: *$750*\n` +
        `• Month 2: *$1,125*\n` +
        `• Month 3: *$1,687*\n` +
        `• Month 6: *$5,695*\n\n` +
        `📈 That\\'s the power of *compound growth* when you reinvest your returns\\.\n\n` +
        `⚠️ _Results vary based on market conditions and your rank tier\\. Higher deposits unlock higher trading limits and amplify your compounding potential\\._\n` +
        `${DIVIDER}` +
        `💎 *CPBloomFX* \\| Let your money work for you\\.`;
    }
  },

  // ── EDUCATION (NEW) ────────────────────────────────────────────────────────
  {
    type: 'EDUCATION',
    build: () => `${header('RISK MANAGEMENT FOUNDATION', '🛡️')}Risk management is the foundation of every successful investment strategy\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('INVEST WISELY', '📘')}Never invest money you cannot afford to lose\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('DIVERSIFICATION MATTERS', '🛡️')}Diversification helps reduce exposure to any single market risk\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('THE POWER OF COMPOUNDING', '📐')}Compound growth rewards consistency and patience over time\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('LONG-TERM MINDSET', '📘')}Successful investors focus on long\\-term outcomes rather than short\\-term emotions\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('EXPECT VOLATILITY', '📊')}Market volatility is normal and should be expected\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('UNDERSTAND RISK', '🛡️')}Understanding risk is just as important as seeking returns\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('AVOID EMOTIONAL DECISIONS', '🧠')}Emotional decisions often lead to avoidable investing mistakes\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('CONSISTENCY OVER TIMING', '📐')}Consistency frequently outperforms attempts to predict every market move\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('INVEST IN EDUCATION', '📘')}Education is one of the most valuable assets an investor can have\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('LEARN FROM CYCLES', '📊')}Every market cycle offers opportunities to learn and improve\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('PROCESS & DISCIPLINE', '🛡️')}Smart investors focus on process, discipline, and risk control\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('PATIENCE PAYS', '🧠')}Patience is often rewarded in financial markets\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('SUSTAINABLE GROWTH', '📐')}Sustainable growth requires a long\\-term perspective\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('KNOW THE MARKETS', '📘')}Learning how markets work can improve investment confidence\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('PROTECT CAPITAL FIRST', '🛡️')}Successful traders prioritize protecting capital before seeking profits\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('MARKET PSYCHOLOGY', '🧠')}Market psychology plays a major role in price movements\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('STAY CALM DURING VOLATILITY', '📊')}Understanding volatility can help investors stay calm during uncertainty\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('INVESTING IS A JOURNEY', '📐')}Investing is a journey that benefits from continuous learning\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'EDUCATION',
    build: () => `${header('SMALL GAINS ADD UP', '📘')}Small consistent gains can accumulate into meaningful long\\-term growth\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },

  // ── TESTIMONIAL / SOCIAL PROOF STYLE ───────────────────────────────────────
  {
    type: 'SOCIAL_PROOF',
    build: () => {
      return `${header('COMMUNITY GROWTH UPDATE', '📣')}` +
        `Our CPBloomFX community continues to grow rapidly\\!\n\n` +
        `🌍 *Active Users:* Thousands of traders across 30\\+ countries\\.\n` +
        `📈 *Monthly Volume:* Millions in copy\\-traded positions executed\\.\n` +
        `🏆 *Top Performers:* Diamond\\-tier members consistently hitting maximum returns\\.\n\n` +
        `🔥 *Why traders choose CPBloomFX:*\n` +
        `• Zero trading experience required\\.\n` +
        `• Fully automated copy\\-trading\\.\n` +
        `• Up to 50% returns monthly\\.\n` +
        `• Transparent, secure, and fully controlled by YOU\\.\n\n` +
        `📱 _Join the movement\\. Download the BloomFX App and start today\\._\n` +
        `${DIVIDER}` +
        `🚀 *CPBloomFX* \\| The future of passive income\\.`;
    }
  },
  {
    type: 'SOCIAL_PROOF',
    build: () => {
      return `${header('WHY SMART INVESTORS CHOOSE US', '🧠')}` +
        `In a market full of noise, CPBloomFX stands apart\\.\n\n` +
        `✅ *No hype, just results:*\n` +
        `• Our platform is built on *real trading infrastructure* \\(MT4/MT5\\)\\.\n` +
        `• Every trade is executed by verified, experienced professionals\\.\n` +
        `• Returns are capped at *50% monthly* to ensure long\\-term sustainability\\.\n` +
        `• Risk limits and rank tiers protect both you and the ecosystem\\.\n\n` +
        `💡 _We don\\'t promise the moon\\. We deliver consistent, optimized returns with institutional\\-grade safety\\._\n` +
        `${DIVIDER}` +
        `🛡️ *CPBloomFX* \\| Built for serious investors\\.`;
    }
  },

  // ── SOCIAL PROOF (NEW) ─────────────────────────────────────────────────────
  {
    type: 'SOCIAL_PROOF',
    build: () => `${header('SMARTER INVESTING', '📣')}Thousands of investors are exploring smarter ways to participate in the markets\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'SOCIAL_PROOF',
    build: () => `${header('GROWING COMMUNITY', '🌍')}Our community continues growing as more people discover copy trading\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'SOCIAL_PROOF',
    build: () => `${header('TRANSPARENCY MATTERS', '🧠')}Investors appreciate transparency and access to experienced traders\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'SOCIAL_PROOF',
    build: () => `${header('MODERN INVESTING', '📣')}Community growth reflects increasing interest in modern investment solutions\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'SOCIAL_PROOF',
    build: () => `${header('TECH-DRIVEN APPROACH', '🌍')}More investors are choosing technology\\-driven approaches to investing\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'SOCIAL_PROOF',
    build: () => `${header('STRONGER TOGETHER', '🧠')}Shared knowledge helps strengthen the investment community\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'SOCIAL_PROOF',
    build: () => `${header('LEARN FROM EXPERTS', '📣')}Investors value the ability to learn from experienced market participants\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'SOCIAL_PROOF',
    build: () => `${header('TRUST THROUGH RESULTS', '🌍')}Trust is built through consistency, transparency, and performance\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'SOCIAL_PROOF',
    build: () => `${header('COLLABORATIVE APPROACH', '🧠')}Many investors prefer collaborative approaches rather than investing alone\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'SOCIAL_PROOF',
    build: () => `${header('GLOBAL MOVEMENT', '📣')}Community\\-driven investing continues gaining popularity worldwide\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },

  // ── CTA (NEW) ──────────────────────────────────────────────────────────────
  {
    type: 'CTA',
    build: () => `${header('YOUR MONEY', '⏰')}Your money is working—or waiting\\. Which would you prefer?${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('SMARTER INVESTING', '🚀')}Ready to explore smarter ways to invest?${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('BUILD YOUR FUTURE', '💰')}Take the first step toward building your financial future today\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('SIMPLIFY YOUR JOURNEY', '⏰')}Discover how copy trading can simplify your investment journey\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('START LEARNING', '🚀')}Start learning from experienced traders and market professionals\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('YOUR CAPITAL AT WORK', '💰')}Let your capital work while you focus on your daily priorities\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('MODERN OPPORTUNITIES', '⏰')}Explore opportunities designed for modern investors\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('BUILD MOMENTUM', '🚀')}Build momentum with disciplined investing habits\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('FIRST STEP', '💰')}Every investment journey begins with a single step\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('NEW POSSIBILITIES', '⏰')}Learn more about copy trading and discover new possibilities\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('GET STARTED', '🚀')}Ready to start? Explore the platform and see how it works\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('TAKE ACTION', '💰')}Take action today and continue building toward your long\\-term goals\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('NEVER STOP LEARNING', '⏰')}Smart investors never stop learning and improving\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('START SMALL', '🚀')}Start small, stay consistent, and focus on the long term\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('LEARN TODAY', '💰')}The best time to learn about investing is today\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('OPPORTUNITIES AWAIT', '⏰')}Market opportunities appear every day for prepared investors\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('CONSISTENT HABITS', '🚀')}Consistent investing habits often produce better long\\-term outcomes\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('EXPLORE STRATEGIES', '💰')}Explore strategies used by experienced market participants\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('KEYS TO SUCCESS', '⏰')}Knowledge and discipline remain key ingredients for success\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('BUILD CONFIDENCE', '🚀')}Build confidence through education and practical experience\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('STAY INFORMED', '💰')}Stay informed about market developments and emerging opportunities\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('BETTER DECISIONS', '⏰')}Investors who focus on learning often make better decisions\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('STRONG STRATEGY', '🚀')}A strong strategy helps navigate changing market conditions\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('LONG-TERM THINKING', '💰')}Long\\-term thinking can help reduce emotional decision\\-making\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('PROFESSIONAL INSIGHTS', '⏰')}Professional guidance can provide valuable market insights\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('DEVELOP A PLAN', '🚀')}Develop an investment plan and stick to it consistently\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('VOLATILITY OPPORTUNITY', '💰')}Market volatility creates both challenges and opportunities\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('STRONG FOUNDATION', '⏰')}Understanding risk helps create a stronger investment foundation\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('NEW WAYS TO INVEST', '🚀')}Explore new ways to participate in today\\'s financial markets\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },
  {
    type: 'CTA',
    build: () => `${header('YOUR FINANCIAL FUTURE', '💰')}Your financial future is shaped by the decisions you make today\\.${DIVIDER}📈 *CPBloomFX* \\| Smart investing, simplified\\.`
  },

  // ── CALL TO ACTION / URGENCY ───────────────────────────────────────────────
  {
    type: 'CTA',
    build: () => {
      return `${header('YOUR MONEY IS SLEEPING', '⏰')}` +
        `While your cash sits idle in a savings account earning *0\\.5% annually*, the markets are generating massive opportunities *every single day*\\.\n\n` +
        `📊 *The difference:*\n` +
        `• 🏦 Traditional Savings: *0\\.5% per year*\n` +
        `• 📈 CPBloomFX Copy\\-Trading: *Up to 50% per month*\n\n` +
        `You don\\'t need to be a trader\\. You don\\'t need to watch charts\\. You just need to *connect your account* to our master node and let the experts handle the rest\\.\n\n` +
        `📱 _Download the BloomFX App \\> Fund \\> Connect \\> Earn\\._\n` +
        `${DIVIDER}` +
        `💰 *CPBloomFX* \\| Make your money work harder\\.`;
    }
  },
  {
    type: 'CTA',
    build: () => {
      return `${header('READY TO START EARNING?', '🚀')}` +
        `Here\\'s your 3\\-step path to automated profits:\n\n` +
        `📱 *Step 1:* Download the BloomFX App from our official channel\\.\n` +
        `💳 *Step 2:* Register and fund your trading account\\.\n` +
        `🤖 *Step 3:* Connect to the CPBloomFX CopyTrading master node\\.\n\n` +
        `That\\'s it\\. From here, our experienced traders execute \\- and your account mirrors every profitable move automatically\\.\n\n` +
        `📈 *Target:* Up to *50% monthly returns* on your tradable balance\\.\n` +
        `🛡️ *Safety:* Built\\-in limits protect your capital and the platform\\'s accuracy\\.\n` +
        `⬆️ *Growth:* Higher deposits unlock higher ranks and increased trading limits\\.\n` +
        `${DIVIDER}` +
        `🔥 *CPBloomFX* \\| Start now, thank yourself later\\.`;
    }
  },
  {
    type: 'CTA',
    build: () => {
      return `${header('DEPOSIT MORE, EARN MORE', '💎')}` +
        `Our ranking system rewards commitment\\.\n\n` +
        `📊 *The math is simple:*\n` +
        `• Higher deposit ➜ Higher rank\\.\n` +
        `• Higher rank ➜ Increased trading limits\\.\n` +
        `• Increased limits ➜ Greater monthly returns\\.\n\n` +
        `🥉 *Bronze* \\- Great for starters learning the system\\.\n` +
        `🥈 *Silver* \\- Unlocked exposure to more asset pairs\\.\n` +
        `🥇 *Gold* \\- Access to advanced strategies and higher frequency trades\\.\n` +
        `💎 *Diamond* \\- Maximum limits, priority allocation, VIP master node\\.\n\n` +
        `⬆️ _Upgrade your rank today and maximize your earning potential\\._\n` +
        `${DIVIDER}` +
        `👑 *CPBloomFX* \\| Levels of excellence\\.`;
    }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// AUTO POST SERVICE
// Posts content to the configured channel at random intervals (30-60 minutes)
// ─────────────────────────────────────────────────────────────────────────────

class AutoPostService {
  constructor() {
    this.timer = null;
    this.lastPostIndex = -1;
  }

  /**
   * Returns a random delay between 30 and 60 minutes (in milliseconds)
   */
  _getRandomDelay() {
    const minMs = 30 * 60 * 1000; // 30 minutes
    const maxMs = 60 * 60 * 1000; // 60 minutes
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  /**
   * Initializes the auto-posting loop for the configured Telegram Channel
   */
  start() {
    if (!config.CHANNEL_ID) {
      logger.warn('CHANNEL_ID is not configured. Automated channel auto-posts will be disabled.');
      return;
    }

    this._scheduleNext();
    logger.info('AutoPostService started — posting every 30-60 minutes to channel.');
  }

  /**
   * Schedules the next post after a random delay
   */
  _scheduleNext() {
    const delay = this._getRandomDelay();
    const delayMins = Math.round(delay / 60000);

    logger.info(`Next auto-post scheduled in ~${delayMins} minutes.`);

    this.timer = setTimeout(async () => {
      await this.postRandomContent();
      this._scheduleNext(); // Loop: schedule the next one after posting
    }, delay);
  }

  /**
   * Selects a random post (avoiding immediate repeats) and sends it to the channel
   */
  async postRandomContent() {
    if (!config.CHANNEL_ID) {
      logger.error('Cannot post content: CHANNEL_ID is empty.');
      return false;
    }

    // Pick a random index, avoiding the last one posted
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * CHANNEL_POSTS.length);
    } while (CHANNEL_POSTS.length > 1 && randomIndex === this.lastPostIndex);

    this.lastPostIndex = randomIndex;
    const post = CHANNEL_POSTS[randomIndex];

    try {
      const message = post.build();

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '📱 Download App', url: config.WEBSITE_LINK },
            { text: '💬 Contact Support', url: config.SUPPORT_LINK }
          ],
          [
            { text: '📢 Join Community', url: config.CHANNEL_LINK }
          ]
        ]
      };

      await telegramService.sendMessage(config.CHANNEL_ID, message, { reply_markup: replyMarkup });
      await Stat.incrementMetric('messagesCount');
      logger.info(`Auto-posted [${post.type}] to channel ${config.CHANNEL_ID} (Index: ${randomIndex}/${CHANNEL_POSTS.length})`);
      return true;
    } catch (error) {
      logger.error('Failed to auto-post to channel:', error.message);
      return false;
    }
  }

  /**
   * Stop the automated scheduler
   */
  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      logger.info('AutoPostService stopped.');
    }
  }
}

module.exports = new AutoPostService();
