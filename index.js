const { Client, LocalAuth } = require('whatsapp-web.js');
const qrTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const http = require('http');
const { handleMessage, handleGroupJoin, handleGroupLeave } = require('./commands/handler');

console.log('╔══════════════════════════════════╗');
console.log('║    🤖 WA-BOT — Full Fitur        ║');
console.log('║    by hams_bot                   ║');
console.log('╚══════════════════════════════════╝\n');

// ── QR Web Server (untuk scan QR di Railway) ──
let currentQR = null;
let botReady = false;
const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  if (botReady) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#111;color:#0f0;font-family:Arial;font-size:2em">
      <div style="text-align:center">✅ Bot Sudah Terhubung!<br><small style="color:#888">QR tidak diperlukan lagi</small></div>
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

// Initialize WhatsApp client with persistent session
const client = new Client({
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
    ],
  },
  webVersion: '2.3000.1017280120-alpha',
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1017280120-alpha.html',
  },
});

// ── QR CODE ──
client.on('qr', (qr) => {
  currentQR = qr;
  botReady = false;
  console.log('\n📱 QR Code baru tersedia! Buka web server untuk scan.');
  qrTerminal.generate(qr, { small: true });
  console.log('\n💡 Atau buka browser: http://localhost:' + PORT + '\n');
});

// ── LOADING ──
client.on('loading_screen', (percent, message) => {
  process.stdout.write(`\r⏳ Loading: ${percent}% — ${message}   `);
});

// ── AUTHENTICATED ──
client.on('authenticated', () => {
  console.log('\n✅ Autentikasi berhasil! Session disimpan.');
});

client.on('auth_failure', (msg) => {
  console.error('\n❌ Autentikasi gagal:', msg);
  console.log('Hapus folder sessions/ lalu jalankan ulang bot.');
  process.exit(1);
});

// ── READY ──
client.on('ready', async () => {
  botReady = true;
  currentQR = null;
  const info = client.info;
  console.log('\n╔══════════════════════════════════╗');
  console.log('║    ✅ BOT SIAP DIGUNAKAN!        ║');
  console.log('╚══════════════════════════════════╝');
  console.log(`📱 Terhubung sebagai: ${info.pushname} (${info.wid.user})`);
  console.log(`⏰ Waktu: ${new Date().toLocaleString('id-ID')}`);
  console.log('\n💡 Ketik !help di WhatsApp untuk melihat semua perintah\n');
});

// ── INCOMING MESSAGE ──
client.on('message', async (msg) => {
  try {
    await handleMessage(client, msg);
  } catch (err) {
    console.error('❌ Error saat memproses pesan:', err.message);
  }
});

// ── MEMBER JOIN (welcome) ──
client.on('group_join', async (notification) => {
  try {
    await handleGroupJoin(client, notification);
  } catch (err) {
    console.error('❌ Error group_join:', err.message);
  }
});

// ── MEMBER LEAVE (goodbye) ──
client.on('group_leave', async (notification) => {
  try {
    await handleGroupLeave(client, notification);
  } catch (err) {
    console.error('❌ Error group_leave:', err.message);
  }
});

// ── DISCONNECTED ──
client.on('disconnected', (reason) => {
  console.log('\n⚠️ Bot terputus:', reason);
  console.log('🔄 Mencoba reconnect...');
  client.initialize();
});

// ── START ──
console.log('🚀 Memulai bot, harap tunggu...\n');
client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Mematikan bot...');
  await client.destroy();
  process.exit(0);
});
