const express = require('express');
const cors = require('cors');
const config = require('./src/config');
const { connectDatabase, isDbConnected } = require('./src/database/mongoose');
const { startBot, getBotInstance } = require('./bot');
const telegramService = require('./src/services/telegramService');
const autoPostService = require('./src/services/autoPostService');
const groupPromoService = require('./src/services/groupPromoService');
const { User } = require('./src/database/models/User');
const { Ticket } = require('./src/database/models/Ticket');
const { Stat } = require('./src/database/models/Stat');
const logger = require('./src/utils/logger');

const app = express();

// Configure middlewares
app.use(cors());
app.use(express.json());

// Bootstrapping function
async function bootstrap() {
  // 1. Setup Database Connection
  await connectDatabase();

  // 2. Initialize Telegram Bot
  startBot();

  // 3. Setup Express Routes
  
  // ── Health Check Endpoints ─────────────────────────────────────────────

  // Liveness probe — server is alive
  app.get('/health/live', (req, res) => {
    res.status(200).json({
      status: 'alive',
      uptimeSeconds: process.uptime(),
      timestamp: new Date()
    });
  });

  // Readiness probe — critical services are ready
  app.get('/health/ready', (req, res) => {
    const dbReady = isDbConnected();
    const botRunning = !!getBotInstance();

    const ready = dbReady && botRunning;

    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not ready',
      checks: {
        database: dbReady ? 'connected' : 'disconnected',
        telegramBot: botRunning ? 'running' : 'stopped'
      },
      timestamp: new Date()
    });
  });

  // Detailed health dashboard
  app.get('/health', (req, res) => {
    const bot = getBotInstance();
    const botRunning = !!bot;
    const dbReady = isDbConnected();

    res.json({
      status: 'active',
      timestamp: new Date(),
      uptimeSeconds: process.uptime(),
      services: {
        database: {
          status: dbReady ? 'connected' : 'offline',
          url: config.DATABASE_URL ? 'configured' : 'not configured'
        },
        telegramBot: {
          status: botRunning ? 'running' : 'stopped',
          configured: !!config.BOT_TOKEN,
          polling: botRunning ? bot.isPolling() : false
        },
        autoPoster: {
          running: autoPostService.timer !== null,
          channelId: config.CHANNEL_ID || 'not configured'
        },
        groupPromo: {
          running: groupPromoService.timer !== null
        }
      },
      config: {
        adminsConfigured: config.ADMIN_IDS.length,
        warnLimit: config.WARN_LIMIT,
        verificationTimeoutMs: config.VERIFICATION_TIMEOUT_MS,
        geminiEnabled: !!config.GEMINI_API_KEY,
        supportLink: config.SUPPORT_LINK
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsageMb: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        },
        cpuLoad: process.cpuUsage ? process.cpuUsage() : null
      }
    });
  });

  // Premium Web Dashboard
  app.get('/', async (req, res) => {
    try {
      // Fetch live data from Database/Memory
      const allUsers = await User.getAllUsers();
      const totalUsers = allUsers.length;
      const verifiedUsers = allUsers.filter(u => u.isVerified).length;
      const mutedUsers = allUsers.filter(u => u.isMuted).length;

      const activeTickets = await Ticket.getActiveTickets();
      const openTicketsCount = activeTickets.length;

      const metrics = await Stat.getStats();

      // HTML/CSS Template for Glassmorphism Dashboard
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CPBloomFX - Community Control Panel</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --panel: rgba(17, 24, 39, 0.7);
      --border: rgba(255, 255, 255, 0.08);
      --primary: #00f2fe;
      --primary-glow: rgba(0, 242, 254, 0.15);
      --accent: #4facfe;
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.15);
      --warning: #f59e0b;
      --danger: #ef4444;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 10% 20%, rgba(79, 172, 254, 0.05) 0px, transparent 50%),
        radial-gradient(at 90% 80%, rgba(0, 242, 252, 0.05) 0px, transparent 50%);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.5;
    }

    /* Container */
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Header styling */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5rem;
      backdrop-filter: blur(10px);
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-container {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px var(--primary-glow);
    }

    .logo-icon {
      font-size: 24px;
      font-weight: 800;
      color: #000;
    }

    h1 {
      font-size: 1.8rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(to right, #ffffff, #9ca3af);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .badge {
      background: var(--success-glow);
      border: 1px solid var(--success);
      color: var(--success);
      padding: 0.35rem 0.85rem;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Grid Layout */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .card {
      background: var(--panel);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 1.75rem;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card:hover {
      transform: translateY(-5px);
      border-color: rgba(0, 242, 254, 0.25);
      box-shadow: 0 10px 30px rgba(0, 242, 254, 0.05);
    }

    .card-glow {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 80px;
      height: 80px;
      background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
      border-radius: 50%;
    }

    .card-label {
      font-size: 0.9rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .card-value {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -1px;
      color: #fff;
    }

    .card-footer {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    /* Split Section Layout */
    .split-layout {
      display: grid;
      grid-template-columns: 1.8fr 1.2fr;
      gap: 2rem;
    }

    @media (max-width: 1024px) {
      .split-layout {
        grid-template-columns: 1fr;
      }
    }

    /* Panel Content */
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .panel-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Tickets Table */
    .table-container {
      background: var(--panel);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 1.75rem;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      padding: 1rem;
      color: var(--text-muted);
      font-weight: 600;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
    }

    td {
      padding: 1.2rem 1rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.95rem;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .ticket-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .ticket-badge.open {
      background: rgba(0, 242, 254, 0.1);
      color: var(--primary);
      border: 1px solid rgba(0, 242, 254, 0.3);
    }

    .ticket-badge.closed {
      background: rgba(156, 163, 175, 0.1);
      color: var(--text-muted);
      border: 1px solid rgba(156, 163, 175, 0.3);
    }

    .ticket-id {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: var(--primary);
    }

    .empty-state {
      text-align: center;
      padding: 3rem 0;
      color: var(--text-muted);
    }

    /* Logger Terminal Console */
    .console-panel {
      background: var(--panel);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .terminal {
      background: #060913;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1.25rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      height: 400px;
      overflow-y: auto;
      color: #38bdf8;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.8);
    }

    .terminal-line {
      margin-bottom: 0.5rem;
      line-height: 1.4;
      border-left: 2px solid #00f2fe;
      padding-left: 8px;
    }

    .terminal-time {
      color: #94a3b8;
    }

    .terminal-tag {
      color: #fb7185;
      font-weight: 700;
    }

    .terminal-msg {
      color: #e2e8f0;
    }
  </style>
  <script>
    // Refresh stats every 15 seconds to display live counts
    setInterval(() => {
      window.location.reload();
    }, 15000);
  </script>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header>
      <div class="brand-section">
        <div class="logo-container">
          <div class="logo-icon">C</div>
        </div>
        <div>
          <h1>CPBloomFX Control Center</h1>
          <div class="subtitle">FinTech Telegram Community Assistant</div>
        </div>
      </div>
      <div class="badge">
        <span style="display:inline-block; width:8px; height:8px; background:var(--success); border-radius:50%"></span>
        BOT ACTIVE & SECURED
      </div>
    </header>

    <!-- Metrics Cards Grid -->
    <div class="grid">
      <div class="card">
        <div class="card-glow"></div>
        <div class="card-label">Verified Members</div>
        <div class="card-value">${verifiedUsers} <span style="font-size:1.2rem; color:var(--success); font-weight:400">/ ${totalUsers}</span></div>
        <div class="card-footer">
          👥 Captcha clearance active
        </div>
      </div>

      <div class="card">
        <div class="card-glow"></div>
        <div class="card-label">Active Support Tickets</div>
        <div class="card-value">${openTicketsCount}</div>
        <div class="card-footer" style="color: ${openTicketsCount > 0 ? 'var(--warning)' : 'var(--text-muted)'}">
          🎟️ Open DM assistance channels
        </div>
      </div>

      <div class="card">
        <div class="card-glow"></div>
        <div class="card-label">Messages Processed</div>
        <div class="card-value">${metrics.messagesCount || 0}</div>
        <div class="card-footer">
          ✉️ Filters & Word blacklist active
        </div>
      </div>

      <div class="card">
        <div class="card-glow"></div>
        <div class="card-label">Violations Blocked</div>
        <div class="card-value">${metrics.warnsCount || 0}</div>
        <div class="card-footer">
          ⚠️ Warnings issued to spammers
        </div>
      </div>
    </div>

    <!-- Split Panels Layout -->
    <div class="split-layout">
      <!-- Open Tickets -->
      <div class="table-container">
        <div class="panel-header">
          <div class="panel-title">
            <span>🎫</span> Open Support Tickets
          </div>
          <span class="badge" style="background:var(--primary-glow); border-color:var(--primary); color:var(--primary)">Live Queue</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Member Name</th>
              <th>Query Subject</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${activeTickets.length === 0 ? `
              <tr>
                <td colspan="5" class="empty-state">
                  No active support tickets in queue. Everyone is happy!
                </td>
              </tr>
            ` : activeTickets.map(ticket => `
              <tr>
                <td class="ticket-id">${ticket.ticketId}</td>
                <td>@${ticket.username}</td>
                <td><em>${ticket.subject.length > 50 ? ticket.subject.substring(0, 50) + '...' : ticket.subject}</em></td>
                <td><span class="ticket-badge open">Active</span></td>
                <td style="color:var(--text-muted); font-size:0.85rem">${new Date(ticket.createdAt).toLocaleTimeString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Live Activities Log Console -->
      <div class="console-panel">
        <div class="panel-header">
          <div class="panel-title">
            <span>💻</span> Moderation Log Console
          </div>
        </div>
        <div class="terminal">
          <div class="terminal-line">
            <span class="terminal-time">[00:00:00]</span> 
            <span class="terminal-tag">[SYSTEM]</span> 
            <span class="terminal-msg">CPBloomFX Bot server core listening on Port ${config.PORT}</span>
          </div>
          <div class="terminal-line">
            <span class="terminal-time">[00:00:01]</span> 
            <span class="terminal-tag">[DATABASE]</span> 
            <span class="terminal-msg">Mongoose connection verified. Operational caches mounted.</span>
          </div>
          <div class="terminal-line">
            <span class="terminal-time">[00:00:02]</span> 
            <span class="terminal-tag">[CRON]</span> 
            <span class="terminal-msg">Scheduled hourly VIP signals auto-posts mounted to channel.</span>
          </div>
          ${allUsers.slice(-5).map(u => `
            <div class="terminal-line">
              <span class="terminal-time">[${new Date(u.joinedAt).toLocaleTimeString()}]</span> 
              <span class="terminal-tag">[USER JOIN]</span> 
              <span class="terminal-msg">@${u.username || u.firstName} logged. Verified status: ${u.isVerified}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      logger.error('Dashboard rendering error:', err.message);
      res.status(500).send('Dashboard failed to render.');
    }
  });

  // Launch express server
  app.listen(config.PORT, () => {
    logger.info(`Express Web Server hosting Dashboard on Port ${config.PORT}`);
  });
}

// Bootstrap application
bootstrap().catch(err => {
  logger.error('Fatal crash during application bootstrap:', err.message);
});
