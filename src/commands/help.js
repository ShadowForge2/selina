const telegramService = require('../services/telegramService');

const HELP_TEXT = `📱 <b>CPBloomFX Setup Guide</b>

<b>1️⃣ Download the App</b>
• Android: Download the APK from the official CPBloomFX website only.
• iOS version is currently under development.
• Play Store release is coming soon.

<b>2️⃣ Create an Account</b>
• Open the app and tap <b>Sign Up</b>.
• Enter your details and create a strong password.
• Enable 2FA for added security.
• KYC is coming soon. You can use the app without KYC for now, but future withdrawals and higher limits will require verification.

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
• Contact Support via the in-app live chat.
• Visit the Help Center for guides and FAQs.
• Follow official channels for updates on iOS, Play Store launch, KYC, and new features.

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