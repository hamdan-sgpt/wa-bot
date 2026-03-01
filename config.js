module.exports = {
  // ==================== BOT CONFIG ====================
  botName: 'WA-BOT',
  botTagline: 'Asisten WhatsApp Terlengkap 🚀',
  botVersion: '2.0.0',
  prefix: '!',

  // Nomor owner (format: 628xxx@c.us) — ganti dengan nomormu
  // Bisa lebih dari satu
  owners: ['6281456099028@c.us'],

  // ==================== PENYIMPANAN DATA ====================
  // Gunakan lokasi dari Environment Variable (Railway dll) atau default ke folder lokal 'data'
  dataPath: process.env.DATA_DIR || './data',

  // ==================== GEMINI AI ====================
  geminiApiKey: 'AIzaSyDxuJ8ckx3wvePlPXLSKDfRTS-1N7mSD1A',
  aiEnabled: true,

  // ==================== FITUR TOGGLE ====================
  features: {
    antiLink: true,      // Anti link grup WA
    antiSpam: true,      // Anti spam / flood
    welcome: true,       // Pesan selamat datang
    goodbye: true,       // Pesan perpisahan
  },

  // ==================== ANTI SPAM ====================
  spam: {
    maxMessages: 5,       // Max pesan dalam interval
    intervalMs: 5000,    // Jendela waktu (ms)
    warnBeforeKick: 3,   // Jumlah warn sebelum kick
  },

  // ==================== AI CREDIT SYSTEM ====================
  aiCredits: {
    enabled: true,          // Aktifkan sistem kredit
    defaultCredits: 10,     // Kredit awal setiap user baru
    dailyReset: true,       // Reset kredit setiap hari (jam 00:00)
    maxCredits: 999,        // Maksimal kredit yang bisa dimiliki
  },

  // ==================== MISC ====================
  startTime: Date.now(),
};
