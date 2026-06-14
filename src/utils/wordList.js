/**
 * Restricted words that trigger automatic moderation:
 * 1st offense → warn + delete
 * 2nd offense → warn + delete  
 * 3rd offense → 5-day mute (read-only)
 */
const BANNED_WORDS = [
  // ── SCAM / FUD ─────────────────────────────────────────────
  'scam', 'scaaaaam', 'scamm', 'scammer', 'fraud', 'fake', 'ponzi',
  'rugpull', 'rug pull', 'exit scam', 'pyramid scheme', 'not legit',
  'stay away', 'avoid this', "don't invest", 'waste of money',
  'stolen funds', 'thieves', 'criminals', 'reported scam',
  'be careful', 'warning everyone', 'red flag',

  // ── DM SOLICITATION ────────────────────────────────────────
  'dm me', 'send me a dm', 'pm me', 'private message me',
  'message me', 'inbox me', 'contact me', 'text me', 'reach out',
  'telegram me', 'whatsapp me', "let's chat privately",
  'check your dm', 'i sent you a dm', 'reply in dm', 'talk privately',

  // ── PROMOTION / SHILLING ───────────────────────────────────
  'new project', 'new opportunity', 'join my project',
  'check my project', 'investment opportunity', 'great opportunity',
  "don't miss out", 'huge profits', '100x', '1000x', 'moonshot',
  'next bitcoin', 'next ethereum', 'guaranteed profits', 'easy money',
  'financial freedom', 'earn daily', 'earn passive income',
  'instant earnings', 'high returns', 'best investment',

  // ── COMPETITOR PROMOTION ───────────────────────────────────
  'other platform', 'better than cpbloomfx', 'join our platform',
  'switch platforms', 'move your funds', 'withdraw and join',
  'better project', 'better returns elsewhere',

  // ── REFERRAL SPAM ──────────────────────────────────────────
  'referral link', 'use my code', 'use my referral',
  'signup under me', 'register with my code', 'bonus code',
  'invite code', 'affiliate link', 'earn commissions',
  'join my team', 'build your downline',

  // ── CRYPTO AIRDROP SPAM ────────────────────────────────────
  'free airdrop', 'claim airdrop', 'free tokens', 'token giveaway',
  'free crypto', 'airdrop ending soon', 'claim now', 'instant rewards',
  'wallet connect', 'connect wallet', 'verify wallet',

  // ── FAKE SUPPORT ───────────────────────────────────────────
  'official support', 'admin here', 'support team', 'customer service',
  'recovery team', 'account manager', 'technical support',
  'send me your details', 'i can help recover',
  'verify your account with me',

  // ── PHISHING WORDS ─────────────────────────────────────────
  'seed phrase', 'recovery phrase', 'private key', 'wallet phrase',
  'mnemonic', 'secret phrase', 'password please', 'send credentials',
  'verify wallet', 'wallet verification', 'wallet sync',
  'wallet connect here',

  // ── LINK SPAM ──────────────────────────────────────────────
  'bit.ly', 'tinyurl', 'cutt.ly', 't.me/', 'telegram.me/',
  'discord.gg', 'whatsapp.com', 'chat.whatsapp', 'linktr.ee',
  'goo.gl', 'shorturl',

  // ── AGGRESSIVE SALES ───────────────────────────────────────
  'buy now', 'act now', 'limited offer', 'limited time',
  "don't miss out", 'exclusive offer', 'special deal',
  'today only', 'last chance', 'instant access', 'premium package',

  // ── ABUSE / TOXICITY ───────────────────────────────────────
  'idiot', 'stupid', 'dumb', 'moron', 'loser', 'trash', 'garbage',
  'worthless', 'fool', 'clown', 'shut up', 'screw you', 'hate you',
  'useless',

  // ── SPAM PATTERNS ──────────────────────────────────────────
  'free money', 'earn now', 'click here', 'join now',
  'message me now', '100% profit', 'guaranteed returns', 'risk free',
  'double your money', 'triple your money',

  // ── BYPASS VARIATIONS ──────────────────────────────────────
  's c a m', 's c a m', 's c a m', 'scammm', 'scaaam',
  'd m me', 'p m me',

  // ── ORIGINAL (keep) ────────────────────────────────────────
  'fuck', 'bitch', 'asshole', 'bastard', 'motherfucker', 'cunt',
  'dick', 'pussy', 'whore', 'slut',
  'pump and dump', 'send eth to', 'send btc to', 'make money fast',
  'get rich quick', 'doubled investment',
  'carding', 'binance leak',
  'crypto giveaway', 'giftcard giveaway', 'onlyfans', 'easy cash'
];

/**
 * Validates text against the unethical word list.
 * Handles casing and basic character replacements (e.g. 0 -> o, 4 -> a).
 * @param {string} text 
 * @returns {boolean}
 */
function normalize(str) {
  return str.toLowerCase()
    .replace(/[0o]/g, 'o')
    .replace(/[1il]/g, 'i')
    .replace(/[3e]/g, 'e')
    .replace(/[4a]/g, 'a')
    .replace(/[5s]/g, 's')
    .replace(/[^a-z0-9\s]/g, '');
}

function hasUnethicalWords(text) {
  if (!text) return false;
  
  const normalized = normalize(text);

  for (const word of BANNED_WORDS) {
    const normalizedWord = normalize(word);
    if (normalizedWord.length < 3) continue; // skip very short matches
    const regex = new RegExp(`\\b${normalizedWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalized) || normalized.includes(normalizedWord)) {
      return true;
    }
  }
  
  return false;
}

module.exports = {
  BANNED_WORDS,
  hasUnethicalWords
};
