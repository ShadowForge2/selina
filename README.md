# 📈 CPBloomFX Community Manager & Welcome Bot

A production-ready, modular, and robust Telegram Bot designed to act as an elite FinTech & Crypto community manager assistant. Built using **Node.js**, **Express.js**, **Mongoose (MongoDB)**, and **node-telegram-bot-api**. 

The bot features automatic captchas/verifications, anti-spam (flood & link deletion), profanity word filtering, automatic DMs, interactive FAQs, a support ticketing system, channel auto-posting, referral tracking, and a gorgeous **Glassmorphism Dark-Mode Web Analytics Dashboard** served locally or on Render.

---

## ⚡ Core Features

1. **Auto Welcome & Security Captha (Verification)**
   * Detects new member joints.
   * Prompts them to verify via inline button click within a configurable period (default: 2 mins).
   * Kicks users automatically if they fail verification to prevent automated bot entries.
2. **Strict Spam & Flood Protection**
   * Limits message rate (e.g., 5 messages in 5 seconds).
   * Automatically deletes unauthorized external links, username invitations, and Telegram invite links.
   * Auto-deletes unethical/profane words and registers a warning.
   * Automatically mutes repeat offenders for 24 hours when they hit warning limits.
3. **Channel Auto-Posting (Scheduled signals & insights)**
   * Runs an automated background service using `node-cron` to post premium trading signals (BTC/USDT, ETH/USDT), financial insights, and trading tips to the official channel every 2 hours.
   * Admins can trigger instant posts using `/broadcast channel <text>`.
4. **Interactive Private Console (Auto DM)**
   * DMs joining users instantly with onboarding instructions, trading rules, and getting started buttons.
   * Hosts interactive FAQs (`/faq`) regarding deposits, withdrawals, and signals.
5. **Interactive Support Tickets**
   * Users can type `/ticket <issue>` in DMs to open support channels.
   * Forwards queries to administrators who can reply instantly with `/reply <TicketID> <message>` or close them cleanly.
6. **Live Analytics Web Dashboard**
   * Renders a premium, glassmorphism visual layout showing live database counts, ticket queues, processed message tallies, and mod log console events.
   * Keeps Render and other PaaS instances alive automatically by responding to ping queries.

---

## 📁 Modular Directory Structure

```text
/src
  /config
    index.js            # Dotenv config parser and validator
  /database
    mongoose.js         # Connection pooler with Offline Mock Cache fallback
    /models
      User.js           # Member histories, referral links, and mod states
      Ticket.js         # Dynamic support tickets and messages history
      Stat.js           # Core aggregates and dashboard counters
  /commands
    index.js            # Command registry & permissions check
    start.js            # User onboarding & referral deep links
    help.js             # Permission-aware lists
    rules.js            # Prints community rules
    verify.js           # User manual status check
    mute.js             # Mute spammers (Admin)
    ban.js              # Permanent ban (Admin)
    warn.js             # Warnings and escalations (Admin)
    stats.js            # Terminal telemetry report (Admin)
    broadcast.js        # DM alert blasts and channel posts (Admin)
    faq.js              # Inline interactive Q&A
    reply.js            # Ticket answer relay (Admin)
  /events
    index.js            # Binds event listeners
    message.js          # Processes command flows and group filter pipelines
    newChatMembers.js   # New entrants captcha and timers
    leftChatMember.js   # Exit logger
    callbackQuery.js    # Button click dispatcher
  /middlewares
    spamFilter.js       # Flood limiters, link blockers, and unethical word list
    verificationCheck.js# Restricts group writing to verified users
  /services
    telegramService.js  # Wrapper for Telegram API (ban, mute, delete, DM)
    ticketService.js    # Ticket queues, forwards, and resolutions
    aiService.js        # Keyword faq matchers and Google Gemini NLP triggers
    autoPostService.js  # cron scheduler for official channel announcements
  /utils
    logger.js           # Colorized logger
    formatter.js        # MarkdownV2 sanitizers and templates
    wordList.js         # Curated unethical wordlists and pattern matching
- bot.js                # Core Telegram initialization and crash boundaries
- index.js              # Express.js backend bootstrapper & Web Dashboard
```

---

## ⚙️ Installation & Configuration

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **MongoDB** (Atlas cluster URL or local installation).
* A **Telegram Bot Token** (Get from [@BotFather](https://t.me/BotFather))

### Step 1: Clone and Install
Extract the files into your directory and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and fill out your configurations:
```bash
cp .env.example .env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `BOT_TOKEN` | Telegram Bot Token from @BotFather | `7123456789:AAF...` |
| `DATABASE_URL` | MongoDB Connection URL (falls back to memory if empty) | `mongodb://localhost:27017/cpbloomfx` |
| `ADMIN_IDS` | Comma-separated admin Telegram IDs | `553412321,77823901` |
| `CHANNEL_ID` | Telegram Channel ID for auto-posts (bot must be admin) | `-1001234567890` |
| `SUPPORT_LINK` | Support group link | `https://t.me/CPBloomFXSupport` |
| `CHANNEL_LINK` | Official channel link | `https://t.me/CPBloomFXChannel` |
| `WEBSITE_LINK` | Website address | `https://cpbloomfx.com` |

---

## 🚀 Running the Application

### Local Development Mode
Starts the bot and runs the Express Web server:
```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your web browser to view the live dashboard!

### Production Mode
```bash
npm start
```

---

## 🛡️ Administrative Command Console Reference

All administration commands can be called by replying to a spammer's message or supplying their user ID.

* **Warn user:** `/warn [reply/userId] [reason]`
* **Mute user:** `/mute [reply/userId] [minutes]`
* **Ban user:** `/ban [reply/userId]`
* **Broadcast to group members in DM:** `/broadcast <message>`
* **Auto-post announcement to Telegram Channel:** `/broadcast channel <message>`
* **Reply to ticket:** `/reply <TKT-ID> <response message>`
* **View community analytics:** `/stats`

---

## ☁️ Deployment Ready (Render)

This bot is fully configured for zero-stress deployments on **Render**, **Railway**, or **Heroku**:
1. Create a **Web Service** on Render.
2. Link your GitHub repository.
3. Configure the Build Command to `npm install` and the Start Command to `npm start`.
4. Add all environment variables listed in `.env.example` in the Render environment variables tab.
5. Render will automatically keep the bot alive because our Express server serves a root `/` dashboard and `/health` route, perfect for standard HTTP ping monitors.
