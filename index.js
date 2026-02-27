const { Client, LocalAuth } = require('whatsapp-web.js');
const qrTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const http = require('http');
const { handleMessage, handleGroupJoin, handleGroupLeave } = require('./commands/handler');

console.log('╔══════════════════════════════════╗');
console.log('║    🤖 WA-BOT — Full Fitur        ║');
console.log('║    by hams_bot                   ║');
console.log('╚══════════════════════════════════╝\n');

// ── State ──
let currentQR = null;
let botReady = false;
let client = null;
let isRestarting = false;
let restartCount = 0;
const MAX_RESTART_DELAY = 60000; // max 60 detik delay antar restart
const BOT_START_TIME = Date.now();
const PORT = process.env.PORT || 3000;

// ── Helper: Format Uptime ──
function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}h`);
  if (h > 0) parts.push(`${h}j`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${sec}d`);
  return parts.join(' ');
}

// ── QR Web Server (untuk scan QR di Railway) ──
const server = http.createServer(async (req, res) => {
  // Health check endpoint — untuk keep-alive ping
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: botReady ? 'connected' : 'waiting',
      uptime: formatUptime(Date.now() - BOT_START_TIME),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      restarts: restartCount,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  if (botReady) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#111;color:#0f0;font-family:Arial;font-size:2em">
      <div style="text-align:center">✅ Bot Sudah Terhubung!<br>
      <small style="color:#888">Uptime: ${formatUptime(Date.now() - BOT_START_TIME)}</small><br>
      <small style="color:#555">Restarts: ${restartCount}</small></div>
    </body></html>`);
    return;
  }
  if (!currentQR) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#111;color:#fff;font-family:Arial;font-size:1.5em">
      <div style="text-align:center">⏳ Menunggu QR Code...<br><small style="color:#888">Refresh halaman ini dalam beberapa detik</small></div>
    </body></html>`);
    return;
  }
  try {
    const qrImage = await QRCode.toDataURL(currentQR, { width: 400, margin: 2 });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#111;font-family:Arial">
      <div style="text-align:center">
        <h2 style="color:#0f0">📱 Scan QR Code WA-BOT</h2>
        <img src="${qrImage}" style="border-radius:12px;border:3px solid #0f0"/>
        <p style="color:#888">Buka WhatsApp → Perangkat Tertaut → Tautkan Perangkat</p>
        <p style="color:#555;font-size:0.8em">Halaman otomatis refresh tiap 10 detik</p>
      </div>
      <script>setTimeout(()=>location.reload(),10000)</script>
    </body></html>`);
  } catch {
    res.writeHead(500);
    res.end('Error generating QR');
  }
});

server.listen(PORT, () => {
  console.log(`🌐 QR Web Server: http://localhost:${PORT}`);
  console.log(`📱 Buka URL di atas untuk scan QR code dari browser!\n`);
});

// ── Keep-alive: Self-ping /health setiap 4 menit ──
// Railway & Render mati-in proses idle, ini mencegahnya
setInterval(() => {
  http.get(`http://localhost:${PORT}/health`, (res) => {
    // Silent consume — hanya untuk keep-alive
    res.resume();
  }).on('error', () => {});
}, 4 * 60 * 1000); // setiap 4 menit

// ── Log uptime setiap 1 jam ──
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(`\n📊 [UPTIME] ${formatUptime(Date.now() - BOT_START_TIME)} | ` +
    `RAM: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.rss / 1024 / 1024)}MB | ` +
    `Restarts: ${restartCount} | ` +
    `Status: ${botReady ? '✅ Online' : '⏳ Offline'}`);
}, 60 * 60 * 1000); // setiap 1 jam

// ── Create & Initialize Client ──
function createClient() {
  const c = new Client({
    authStrategy: new LocalAuth({
      dataPath: './sessions',
    }),
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      protocolTimeout: 300000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-translate',
        '--disable-sync',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--single-process',       // hemat memory
        '--disable-background-timer-throttling', // cegah throttle
      ],
    },
    webVersion: '2.3000.1017280120-alpha',
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1017280120-alpha.html',
    },
  });

  // ── QR CODE ──
  c.on('qr', (qr) => {
    currentQR = qr;
    botReady = false;
    console.log('\n📱 QR Code baru tersedia! Buka web server untuk scan.');
    qrTerminal.generate(qr, { small: true });
    console.log('\n💡 Atau buka browser: http://localhost:' + PORT + '\n');
  });

  // ── LOADING ──
  c.on('loading_screen', (percent, message) => {
    process.stdout.write(`\r⏳ Loading: ${percent}% — ${message}   `);
  });

  // ── AUTHENTICATED ──
  c.on('authenticated', () => {
    console.log('\n✅ Autentikasi berhasil! Session disimpan.');
  });

  c.on('auth_failure', (msg) => {
    console.error('\n❌ Autentikasi gagal:', msg);
    console.log('🔄 Akan coba restart dalam 10 detik...');
    scheduleRestart(10000);
  });

  // ── READY ──
  c.on('ready', async () => {
    botReady = true;
    currentQR = null;
    restartCount = Math.max(0, restartCount); // keep count but bot is healthy
    const info = c.info;
    console.log('\n╔══════════════════════════════════╗');
    console.log('║    ✅ BOT SIAP DIGUNAKAN!        ║');
    console.log('╚══════════════════════════════════╝');
    console.log(`📱 Terhubung sebagai: ${info.pushname} (${info.wid.user})`);
    console.log(`⏰ Waktu: ${new Date().toLocaleString('id-ID')}`);
    console.log(`🔄 Total restart: ${restartCount}`);
    console.log('\n💡 Ketik !help di WhatsApp untuk melihat semua perintah\n');
  });

  // ── INCOMING MESSAGE ──
  c.on('message', async (msg) => {
    try {
      await handleMessage(c, msg);
    } catch (err) {
      console.error('❌ Error saat memproses pesan:', err.message);
    }
  });

  // ── MEMBER JOIN (welcome) ──
  c.on('group_join', async (notification) => {
    try {
      await handleGroupJoin(c, notification);
    } catch (err) {
      console.error('❌ Error group_join:', err.message);
    }
  });

  // ── MEMBER LEAVE (goodbye) ──
  c.on('group_leave', async (notification) => {
    try {
      await handleGroupLeave(c, notification);
    } catch (err) {
      console.error('❌ Error group_leave:', err.message);
    }
  });

  // ── DISCONNECTED — auto restart ──
  c.on('disconnected', (reason) => {
    console.log('\n⚠️ Bot terputus:', reason);
    botReady = false;
    scheduleRestart();
  });

  // ── CHANGE STATE — detect connection issues ──
  c.on('change_state', (state) => {
    console.log(`📡 Status koneksi: ${state}`);
    if (state === 'CONFLICT' || state === 'UNLAUNCHED' || state === 'UNPAIRED') {
      console.log('⚠️ Koneksi bermasalah, akan restart...');
      botReady = false;
      scheduleRestart(15000);
    }
  });

  return c;
}

// ── Smart Restart with backoff ──
async function scheduleRestart(customDelay) {
  if (isRestarting) {
    console.log('🔄 Restart sudah dijadwalkan, skip...');
    return;
  }
  isRestarting = true;
  restartCount++;

  // Exponential backoff: 5s, 10s, 20s, 40s... max 60s
  const delay = customDelay || Math.min(5000 * Math.pow(2, Math.min(restartCount - 1, 4)), MAX_RESTART_DELAY);
  console.log(`🔄 Restart #${restartCount} dalam ${delay / 1000} detik...`);

  // Cleanup client lama
  try {
    if (client) {
      await client.destroy().catch(() => {});
    }
  } catch (e) {
    console.log('⚠️ Gagal destroy client lama:', e.message);
  }

  setTimeout(() => {
    isRestarting = false;
    console.log('\n🚀 Memulai ulang bot...\n');
    client = createClient();
    client.initialize().catch((err) => {
      console.error('❌ Gagal initialize:', err.message);
      scheduleRestart();
    });
  }, delay);
}

// ── Global Error Handlers — cegah process mati ──
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection:', reason);
  // Jangan exit, biarkan bot tetap jalan
});

process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err.message);
  console.error(err.stack);
  // Kalau error fatal dari Puppeteer, restart bot
  if (err.message.includes('Protocol error') ||
      err.message.includes('Target closed') ||
      err.message.includes('Session closed') ||
      err.message.includes('Navigation failed') ||
      err.message.includes('Execution context was destroyed')) {
    console.log('🔄 Error fatal Puppeteer, restarting bot...');
    botReady = false;
    scheduleRestart(5000);
  }
  // Untuk error lain, biarkan proses tetap jalan
});

// ── Memory Monitor — restart jika RAM kebanyakan ──
setInterval(() => {
  const mem = process.memoryUsage();
  const heapMB = Math.round(mem.heapUsed / 1024 / 1024);
  const rssMB = Math.round(mem.rss / 1024 / 1024);

  // Jika RSS > 500MB, kemungkinan memory leak, restart
  if (rssMB > 500) {
    console.log(`\n🚨 [MEMORY] RSS terlalu tinggi: ${rssMB}MB — restarting bot...`);
    botReady = false;
    scheduleRestart(3000);
  }
}, 5 * 60 * 1000); // cek setiap 5 menit

// ── START ──
console.log('🚀 Memulai bot, harap tunggu...\n');
client = createClient();
client.initialize().catch((err) => {
  console.error('❌ Gagal initialize:', err.message);
  scheduleRestart();
});

// ── Graceful shutdown ──
async function gracefulShutdown(signal) {
  console.log(`\n\n👋 Menerima ${signal}, mematikan bot...`);
  try {
    if (client) await client.destroy().catch(() => {});
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
