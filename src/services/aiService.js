const config = require('../config');
const logger = require('../utils/logger');
const { esc, header, DIVIDER } = require('../utils/formatter');

const LOCAL_FAQ_DB = [
  // ── SAFETY & TRUST CONCERNS (must be first to avoid clashes with "deposit"/"fund" keywords below) ──
  {
    keywords: [
      'is this safe', 'is it safe', 'hope this is safe', 'is this platform safe',
      'can i trust', 'is this legit', 'is this legitimate', 'is this real',
      'is this genuine', 'is this trustworthy', 'is my money safe',
      'is my deposit safe', 'is this a scam', 'not sure about this platform',
      'looks risky', 'worried about security', 'is this secure',
      'how secure is this', 'should i trust', 'is this reliable',
      'is this authentic', 'can i invest safely', 'is my account protected',
      'are funds protected', 'is cpbloomfx safe', 'is cpbloomfx legit',
      'is cpbloomfx reliable', 'how safe is this', 'is it legit',
      'is it real', 'is it genuine', 'is it trustworthy', 'is it secure',
      'is it reliable', 'is it authentic', 'can i trust cpbloomfx',
      'should i trust cpbloomfx', 'worried about my money',
      'worried about my deposit', 'scam', 'this platform is safe',
      'hope it is safe', 'hope its safe', 'safe platform',
      'is this platform legitimate', 'is cpbloomfx a scam',
      'cpbloomfx scam', 'is cpbloomfx trustworthy',
      'can i rely on this', 'is this company legit',
      'is this company real', 'is this company safe'
    ],
    title: '🔒 Safety & Trust',
    response: `We understand that safety is important when choosing any trading platform\\.\n\n` +
      `CPBloomFX is built with security, risk management, and transparency in mind\\. User funds, account security features, and trading controls are designed to help provide a secure experience for our community\\.\n\n` +
      `However, all trading and investment activities involve risk, and no platform can guarantee profits or eliminate market risk entirely\\. We encourage every user to do their own research, start with an amount they are comfortable with, and review all available information before making financial decisions\\.\n\n` +
      `If you have specific questions about security, deposits, withdrawals, account protection, or how the platform works, our support team will be happy to assist\\.`
  },
  {
    keywords: ['deposit', 'fund', 'paystack', 'payment', 'how to deposit', 'how do i deposit', 'funding'],
    title: 'Funding Your Account',
    response: `To deposit funds into your CPBloomFX brokerage/trading account:\n\n` +
      `1️⃣ Click on the *Finance* tab in the user app\\.\n` +
      `2️⃣ Enter your desired deposit amount and select your payment method \\(e\\.g\\., Paystack, Crypto, Bank Transfer\\)\\.\n` +
      `3️⃣ Complete the transaction securely\\. Deposits are normally approved within *10\\-30 minutes*\\.\n\n` +
      `⚠️ *Important:* Never send funds directly to anyone claiming to be a CPBloomFX admin in DMs\\.`
  },
  {
    keywords: ['withdraw', 'cashout', 'withdrawal', 'how to withdraw', 'how do i withdraw'],
    title: 'Withdrawing Funds',
    response: `To withdraw your trading profits:\n\n` +
      `1️⃣ Open the *Finance Screen* in your mobile application\\.\n` +
      `2️⃣ Select the *Withdrawal* option\\.\n` +
      `3️⃣ Choose your destination channel \\(Bank Account, USDT Wallet\\) and enter the amount\\.\n` +
      `4️⃣ Approvals are processed within *1\\-24 hours* in compliance with standard security checks\\.`
  },
  {
    keywords: ['signals', 'vip', 'premium group', 'join vip', 'trading signals'],
    title: 'CPBloomFX VIP Signals',
    response: `Access our elite premium trade signals channel:\n\n` +
      `📈 We boast an average *87% historical accuracy* across Forex, Gold, and Crypto markets\\.\n` +
      `• VIP members receive between *3\\-5 high-probability signals* daily with clear TP, SL, and risk ratings\\.\n` +
      `• Click the *📢 Official Channel* link below or visit our site to upgrade to VIP status\\!`
  },
  {
    keywords: ['rules', 'guidelines', 'ban', 'warning'],
    title: 'Community Rules Summary',
    response: `To maintain safety and quality:\n` +
      `• Absolutely no external links, unauthorized groups, or advertisements\\.\n` +
      `• Profanity and unethical/scam languages are automatically deleted\\.\n` +
      `• Repeated offences will lead to temporary muting or a permanent ban\\.`
  },
  {
    keywords: ['forex', 'what is forex', 'trading', 'learn trading'],
    title: 'New to Trading?',
    response: `Forex \\(Foreign Exchange\\) trading is the decentralized global market for buying and selling currencies\\.\n\n` +
      `🎓 *CPBloomFX* offers absolute beginners a comprehensive step\\-by\\-step Academy within our portal\\.\n` +
      `Select the *📘 Getting Started* button to receive your welcome kit\\!`
  },
  {
    keywords: ['how do i earn', 'how to earn', 'how to make money', 'how does this work', 'how to make profit'],
    title: 'How to Earn on CPBloomFX',
    response: `Download our official app, make a deposit, and start AI copy\\-trading\\. Your account automatically mirrors expert trades\\.`
  },
  {
    keywords: ['copy trading', 'what is copy trading', 'copy trade', 'automated trading'],
    title: 'Copy Trading Explained',
    response: `Copy trading lets you automatically mirror the trades of experienced professionals\\.\n\n` +
      `1️⃣ Download the BloomFX App\\.\n` +
      `2️⃣ Fund your account\\.\n` +
      `3️⃣ One tap to start\\. Your portfolio copies every move of our master traders in real\\-time\\.`
  },
  {
    keywords: ['minimum deposit', 'how much to start', 'minimum investment', 'starting balance'],
    title: 'Minimum Deposit',
    response: `You can start trading with a minimum deposit\\. The exact minimum is displayed inside the BloomFX App after registration\\. Higher deposits unlock higher tiers and bigger trading limits\\.`
  },
  {
    keywords: ['app', 'download app', 'android app', 'where to download', 'bloomfx app'],
    title: 'Download the App',
    response: `Download the official BloomFX App from the link pinned in our channel\\. Only download from official sources to protect your account\\.`
  },
  {
    keywords: ['referral', 'refer', 'invite', 'referral link', 'referral bonus'],
    title: 'Referral Program',
    response: `Share your unique referral link to earn rewards when your invited friends make deposits\\.\nYour referral link is available in the bot DM via /start\\.`
  },
  {
    keywords: ['profit', 'returns', 'how much can i make', 'monthly profit', 'earning potential'],
    title: 'Profit Potential',
    response: `Our AI trading platform is optimized to target competitive monthly returns\\. Actual results vary based on market conditions and your account tier\\. Remember: trading involves risk\\.`
  },
  {
    keywords: ['kyc', 'verification', 'verify account', 'identity', 'id card'],
    title: 'KYC & Account Verification',
    response: `KYC verification is coming soon\\. You can use the app without KYC for now, but future withdrawals and higher limits will require identity verification\\.`
  },
  {
    keywords: ['ios', 'iphone', 'apple', 'app store'],
    title: 'iOS App',
    response: `The iOS version is currently under development\\. Android users can download the APK from our official website\\. Stay tuned for the App Store release\\!`
  },
  {
    keywords: ['suspended', 'blocked', 'locked', "can't access", 'account issue'],
    title: 'Account Issues',
    response: `If you\\'re experiencing account issues, please contact support through the in\\-app live chat or open a support ticket via the bot\\. Our team will assist you promptly\\.`
  },

  // ── GREETINGS ──────────────────────────────────────────────
  {
    keywords: ['good morning', 'morning'],
    title: '🌅',
    response: `Good morning\\! How are you doing today\\? Ready to make a deposit and start your investment journey\\? 🚀`
  },
  {
    keywords: ['good afternoon', 'good evening', 'good day'],
    title: '👋',
    response: `Hello\\! Hope you\\'re having a great day\\! Ready to grow your investments with CPBloomFX\\? 🚀`
  },
  {
    keywords: ['hello', 'hi ', 'hey', 'howdy', 'greetings'],
    title: '👋',
    response: `Hey there\\! Welcome\\! Are you ready to make a deposit and start your investment journey\\? 🚀`
  },
  {
    keywords: ['how far', "what's up", 'wassup', 'sup', 'yo'],
    title: '🙌',
    response: `Hey\\! All good here\\! Are you ready to make a deposit and start your investment journey\\? 🚀`
  },
  {
    keywords: ['how are you', 'how do you do'],
    title: '💚',
    response: `I\\'m doing great, thanks for asking\\! Are you ready to make a deposit and start your investment journey\\? 🚀`
  },
  {
    keywords: ['good to be here', 'nice to meet', 'just joined'],
    title: '🎉',
    response: `Great to have you here\\! Are you ready to make a deposit and start your investment journey\\? 🚀`
  },

  // ── CONGRATULATIONS ────────────────────────────────────────
  {
    keywords: ['i got paid', 'i received', 'got my withdrawal', 'withdrawal received',
      'got my profit', 'made profit', 'i withdrew', 'just withdrew', 'my withdrawal',
      'got paid', 'payment received', 'received my', 'bonus received', 'got the bonus',
      'profit taking', 'taking profit', 'made money', 'earned', 'withdrawal successful'],
    title: '🎉 CONGRATULATIONS',
    response: `Congratulations\\! 🎉🎉🎉 We\\'re happy to see you succeeding with CPBloomFX\\. Keep it up and aim higher\\! 🚀`
  },
];

class AiService {
  /**
   * Processes messages to provide intelligent replies.
   * Leverages Gemini API if GEMINI_API_KEY is defined, otherwise uses fast local FAQ matcher.
   */
  async processMessage(userMessageText) {
    if (!userMessageText) return null;
    const cleanText = userMessageText.toLowerCase().trim();

    // 1. Try local exact-keyword matcher (fastest and free)
    for (const faq of LOCAL_FAQ_DB) {
      if (faq.keywords.some(keyword => cleanText.includes(keyword))) {
        logger.info(`Local AI FAQ match triggered for query: "${userMessageText}"`);
        return `${header(faq.title, '🤖')}${faq.response}${DIVIDER}💬 Type your questions anytime, or click \`💬 Support\` for live agents\\.`;
      }
    }

    // 2. If Gemini API key is configured, fallback to natural language generator
    if (config.GEMINI_API_KEY) {
      try {
        logger.info(`Processing query via Gemini NLP AI: "${userMessageText}"`);
        const geminiResponse = await this.queryGemini(userMessageText);
        if (geminiResponse) {
          return `${header('AI Assistant Response', '🤖')}${esc(geminiResponse)}${DIVIDER}⚡ Powered by CPBloomFX AI Intelligence\\.`;
        }
      } catch (err) {
        logger.error('Gemini AI Query failure:', err.message);
      }
    }

    // 3. General catch-all fallback (returns null to let other event handlers process normally)
    return null;
  }

  /**
   * Queries Google Gemini API for natural language answers
   */
  async queryGemini(promptText) {
    try {
      // Gemini developer endpoint URL
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.GEMINI_API_KEY}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `You are the CPBloomFX AI Community Manager, a highly knowledgeable, professional, and friendly trading and financial assistant. You represent an elite forex and crypto trading community. Provide direct, helpful answers to this user query: "${promptText}". Keep your reply concise (under 120 words), professional, and informative. Do not use markdown tags other than bold or lists.`
          }]
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text;
      }
      return null;
    } catch (error) {
      logger.error('Gemini API communication error:', error.message);
      return null;
    }
  }
}

module.exports = new AiService();
module.exports.LOCAL_FAQ_DB = LOCAL_FAQ_DB;
