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
    response: `Great question\\! You can be fully confident in CPBloomFX\\. We\\'re a *very accurate, genuine, and sustainable* platform built for long\\-term success\\. ✅\n\n` +
      `🔹 *Real Value:* Our AI\\-driven copy\\-trading infrastructure is backed by proven strategies and real market execution\\.\n` +
      `🔹 *Sustainable Returns:* We\\'re engineered for consistent, reliable performance \\- designed to last, not a quick scheme\\.\n` +
      `🔹 *Transparent & Secure:* User funds and accounts are protected with strong security practices and clear controls\\.\n` +
      `🔹 *Thriving Community:* Thousands of traders already trust us\\. You\\'re joining a real, growing ecosystem\\.\n\n` +
      `💎 _As with any investment, we always encourage you to start with an amount you\\'re comfortable with \\- but rest assured, you\\'re with a platform built for accuracy and longevity\\._\n\n` +
      `If you have any specific questions about security, deposits, or withdrawals, our support team is always happy to assist\\!`
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
    response: `Sign up on our official website, make a deposit, and start AI copy\\-trading\\. Your account automatically mirrors expert trades\\.`
  },
  {
    keywords: ['copy trading', 'what is copy trading', 'copy trade', 'automated trading'],
    title: 'Copy Trading Explained',
    response: `Copy trading lets you automatically mirror the trades of experienced professionals\\.\n\n` +
      `1️⃣ Sign up on our official website\\.\n` +
      `2️⃣ Fund your account\\.\n` +
      `3️⃣ One tap to start\\. Your portfolio copies every move of our master traders in real\\-time\\.`
  },
  {
    keywords: ['minimum deposit', 'how much to start', 'minimum investment', 'starting balance'],
    title: 'Minimum Deposit',
    response: `You can start trading with a minimum deposit\\. The exact minimum is displayed on the platform after registration\\. Higher deposits unlock higher tiers and bigger trading limits\\.`
  },
  {
    keywords: ['app', 'download app', 'android app', 'where to download', 'bloomfx app', 'website', 'visit website'],
    title: 'Access the Platform',
    response: `You can access the platform directly from your browser at our official website\\: https\\://xprfire\\.site\\, no app download needed\\. Only use official sources to protect your account\\.`
  },
  {
    keywords: ['referral', 'refer', 'invite', 'referral link', 'referral bonus'],
    title: 'Getting Started',
    response: `To get started, visit our website https\\://xprfire\\.site to access the platform and create your account\\.`
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
    title: 'Platform Access',
    response: `The platform runs entirely in your browser at https\\://xprfire\\.site, so it works on any device with no app download needed\\.`
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
    response: `Good morning\\! I hope you\\'re having a great day\\! 😊 How can I help you today\\?`
  },
  {
    keywords: ['good afternoon', 'good evening', 'good day'],
    title: '👋',
    response: `Hello\\! I hope you\\'re having a great day\\! How can I help you today\\?`
  },
  {
    keywords: ['hello', 'hi', 'hey', 'howdy', 'greetings'],
    title: '👋',
    response: `Hey there\\! 👋 How can I help you today\\?`
  },
  {
    keywords: ['how far', "what's up", 'wassup', 'sup', 'yo'],
    title: '🙌',
    response: `Hey\\! All good here\\! What can I do for you today\\?`
  },
  {
    keywords: ['how are you', 'how do you do'],
    title: '💚',
    response: `I\\'m doing great, thanks for asking\\! How can I help you today\\?`
  },
  {
    keywords: ['good to be here', 'nice to meet', 'just joined'],
    title: '🎉',
    response: `Great to have you here\\! I\\'m here if you have any questions\\!`
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
      if (matchesKeyword(cleanText, faq.keywords)) {
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
            text: `You are the CPBloomFX AI Community Manager, a highly knowledgeable, professional, and friendly trading and financial assistant for the CPBloomFX platform. You represent an elite forex and crypto copy-trading community.

PLATFORM FACTS YOU MUST USE when relevant:
- CPBloomFX is a copy-trading platform: users sign up at the website, make a deposit, and their account automatically mirrors expert/AI traders (copy trading).
- How to earn: Sign up at the website -> Make a deposit -> Start copy trading -> your account mirrors expert trades and can earn up to 50% monthly returns on the tradable balance (results vary with market conditions and account tier).
- Higher deposits unlock higher ranks/tiers with bigger trading limits.
- It is browser-based (no app download needed).

TASK: Provide a direct, helpful, concise answer to this user query: "${promptText}". If it is a greeting, reply warmly and briefly. If it is a question about the platform, earning, deposits, withdrawals, or safety, answer using the platform facts above. Keep your reply under 120 words, professional, and informative. RESPOND IN PLAIN TEXT ONLY: do NOT use markdown, asterisks, underscores, backticks, or special formatting characters. Use simple text.`
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

  /**
   * Gemini-enhanced ethics check.
   * Distinguishes legitimate questions / expressions of doubt from actual
   * abuse, harassment, false accusations/scam allegations, scam attempts,
   * or disruptive behavior.
   * @param {string} text The user message to evaluate.
   * @returns {Promise<{unethical: boolean, reason: string}>}
   */
  async detectUnethical(text) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.GEMINI_API_KEY}`;

      const payload = {
        contents: [{
          parts: [{
            text: `You are a careful community safety moderator for a legitimate forex and crypto copy-trading community called CPBloomFX.

Determine whether the following user message is UNETHICAL/DISRUPTIVE and should be flagged for moderation, or whether it is a legitimate question, concern, or expression of doubt that should be ALLOWED.

IMPORTANT DISTINCTION:
- Flag as UNETHICAL: outright abuse or profanity, harassment or personal attacks, spreading unverified false accusations presented as facts (e.g. "this is a scam", "you are thieves", "they steal money"), attempted phishing/scams ("verify your wallet", "send me your seed phrase"), spam/promotion of other projects, or aggressive trolling trying to disrupt the community.
- ALLOW: people simply asking questions or expressing doubt ("is this platform safe?", "I suspect this might be risky, is it legit?", "I have concerns about safety", "can I trust this?"). Asking for reassurance is normal and should NOT be flagged.

Respond with a STRICT JSON object and nothing else:
{"unethical": true/false, "reason": "short reason"}

Message: "${text}"
`
          }]
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);

      const data = await response.json();
      const raw = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts
        ? data.candidates[0].content.parts[0].text
        : null;
      if (!raw) return { unethical: false, reason: '' };

      // Extract the JSON object from the response (Gemini may wrap it in code fences)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          unethical: !!parsed.unethical,
          reason: parsed.reason || ''
        };
      }
      return { unethical: false, reason: '' };
    } catch (error) {
      logger.error('Gemini ethics check error:', error.message);
      return { unethical: false, reason: '' };
    }
  }
}

module.exports = new AiService();
module.exports.LOCAL_FAQ_DB = LOCAL_FAQ_DB;

/**
 * Smart keyword matcher.
 * - Multi-word phrases: substring match on normalized text (so "how to deposit" matches naturally).
 * - Single words: word-boundary matching so e.g. "fund" does NOT match "refund" or "fundamental".
 */
function matchesKeyword(cleanText, keywords) {
  return keywords.some(keyword => {
    const normalized = keyword.toLowerCase().trim();
    if (!normalized) return false;
    // Multi-word phrase -> straight substring match
    if (normalized.includes(' ')) {
      return cleanText.includes(normalized);
    }
    // Single word -> match on whole-word boundaries (English letters, digits, apostrophes)
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(cleanText);
  });
}
