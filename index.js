const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage, handleGroupJoin, handleGroupLeave } = require('./commands/handler');

console.log('╔══════════════════════════════════╗');
console.log('║    🤖 WA-BOT — Full Fitur        ║');
console.log('║    by hams_bot                   ║');
console.log('╚══════════════════════════════════╝\n');

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
  console.log('\n📱 Scan QR code di bawah ini dengan WhatsApp kamu:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n💡 Buka WhatsApp → Perangkat Tertaut → Tautkan Perangkat\n');
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
