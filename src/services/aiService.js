const config = require('../config');
const logger = require('../utils/logger');
const { esc, header, DIVIDER } = require('../utils/formatter');

// Local High-Performance FinTech FAQ Repository
const LOCAL_FAQ_DB = [
  {
    keywords: ['deposit', 'fund', 'paystack', 'payment', 'how to deposit'],
    title: 'Funding Your Account',
    response: `To deposit funds into your CPBloomFX brokerage/trading account:\n\n` +
      `1️⃣ Click on the *Finance* tab in the user app\\.\n` +
      `2️⃣ Enter your desired deposit amount and select your payment method \\(e\\.g\\., Paystack, Crypto, Bank Transfer\\)\\.\n` +
      `3️⃣ Complete the transaction securely\\. Deposits are normally approved within *10\\-30 minutes*\\.\n\n` +
      `⚠️ *Important:* Never send funds directly to anyone claiming to be a CPBloomFX admin in DMs\\.`
  },
  {
    keywords: ['withdraw', 'cashout', 'withdrawal', 'how to withdraw'],
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
  }
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
