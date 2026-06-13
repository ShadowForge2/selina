/**
 * Restricted words that trigger automatic moderation:
 * 1st offense → warn + delete
 * 2nd offense → warn + delete  
 * 3rd offense → 5-day mute (read-only)
 */
const BANNED_WORDS = [
  // Profanities & Slurs
  'fuck', 'bitch', 'asshole', 'bastard', 'motherfucker', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'idiot', 'stupid',

  // Crypto Scams & Spammer Phrases
  'pump and dump', 'guaranteed profit', 'invest $100', 'earn $1000', 'whatsapp me', 'inbox me', 'dm me now',
  'telegram bounty', 'free airdrop', 'send eth to', 'send btc to', 'make money fast', 'get rich quick',
  'doubled investment', 'forex signal secret', 'leak group', 'carding', 'binance leak', 'whatsapp link',
  'click here to win', 'crypto giveaway', 'giftcard giveaway', 'onlyfans', 'free coins', 'easy cash',

  // Group-specific restricted words
  'scam', 'fake', 'dm me', 'sent link'
];

/**
 * Validates text against the unethical word list.
 * Handles casing and basic character replacements (e.g. 0 -> o, 4 -> a).
 * @param {string} text 
 * @returns {boolean}
 */
function hasUnethicalWords(text) {
  if (!text) return false;
  
  // Normalize string: lowercase and remove symbols
  const normalized = text
    .toLowerCase()
    .replace(/[0o]/g, 'o')
    .replace(/[1il]/g, 'i')
    .replace(/[3e]/g, 'e')
    .replace(/[4a]/g, 'a')
    .replace(/[5s]/g, 's')
    .replace(/[^a-z0-9\s]/g, '');

  for (const word of BANNED_WORDS) {
    // Escape regex characters just in case
    const regex = new RegExp(`\\b${word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalized) || normalized.includes(word)) {
      return true;
    }
  }
  
  return false;
}

module.exports = {
  BANNED_WORDS,
  hasUnethicalWords
};
