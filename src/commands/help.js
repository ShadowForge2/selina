const telegramService = require('../services/telegramService');

const config = require('../config');

const HELP_TEXT = `🌐 <b>CPBloomFX Setup Guide</b>

<b>1️⃣ Visit the Website</b>
• Go to the official website: <a href="${config.WEBSITE_LINK}">${config.WEBSITE_LINK}</a>
• Web-based platform — no app download needed.

<b>2️⃣ Create an Account</b>
• Open the website and tap <b>Sign Up</b>.
• Enter your details and create a strong password.
• Enable 2FA for added security.
• KYC is coming soon. You can use the platform without KYC for now, but future withdrawals and higher limits will require verification.

<b>3️⃣ Deposit Funds</b>
Go to <b>Finance → Deposit</b> and choose a method:

🇳🇬 <b>Nigerian Users:</b>
• Bank Transfer
• Visa/Mastercard
• Mobile Money

🌍 <b>International Users:</b>
• Crypto (USDT, BTC, ETH, etc.)

Once your deposit is confirmed, your trading limits unlock automatically based on your deposit tier.

<b>4️⃣ Start AI Copy Trading</b>
• Tap <b>Start Copy Trading</b>.
• The AI will automatically execute trades using disciplined trading strategies and built-in risk management.
• Monitor trades, profit/loss, and account activity from your dashboard.

⚙️ <b>How It Works</b>
• The platform is optimized to target up to 50% monthly returns.
• No separate broker account is required.
• Integrated trading limits help protect capital.
• Higher deposits unlock higher trading limits and account tiers.

💡 <b>Tips</b>
• Higher deposits unlock more trading power.
• Maintain your balance to keep your trading tier active.
• Enable notifications for trade updates.
• Review your trading history regularly.

🛟 <b>Need Help?</b>
• Contact Support via the website live chat.
• Visit the Help Center for guides and FAQs.
• Follow official channels for updates on new features and KYC.

🚀 <b>CPBloomFX — AI that doesn't just recommend, it trades.</b>`;

module.exports = {
  name: 'help',
  description: 'View CPBloomFX setup guide and information.',
  adminOnly: false,
  async execute(msg, args, bot) {
    const { chat } = msg;
    await telegramService.sendMessage(chat.id, HELP_TEXT, { parse_mode: 'HTML' });
  }
};