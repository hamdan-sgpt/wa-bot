const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const path   = require('path');
const fs     = require('fs');
const BANNER_PATH = path.join(__dirname, '../../assets/banner.png');

/**
 * Command: !start / !intro
 * Kirim pesan intro keren + gambar banner + audio sambutan
 */
async function showIntro(client, msg) {
  try {
    const chat   = await msg.getChat();
    const sender = await msg.getContact();
    const name   = sender.pushname || sender.name || 'Kak';
    const p      = config.prefix;

    // ── 1. Kirim gambar banner + pesan intro ──
    const introText =
`✨ *Halo ${name}! Selamat datang!* ✨

╔══════════════════════════════╗
║    🤖 *${config.botName}*
║    ${config.botTagline || 'Asisten WhatsApp Terlengkap'}
║    📌 Versi: ${config.botVersion || '1.0.0'}
╚══════════════════════════════╝

Aku adalah bot WhatsApp yang siap membantu kamu dengan berbagai fitur keren! 🚀

┌─── 📋 *Fitur Utama* ───
│ 🧠 Chat dengan AI (Gemini)
│ 🎮 Games & Fun Commands
│ 🛡️ Manajemen Grup Lengkap
│ 🎬 Download TikTok
│ 🖼️ Sticker Maker
│ 🟢 Brat Generator
└──────────────────────

💡 Ketik *${p}menu* untuk melihat semua perintah!

_Made with ❤️ by hams_bot_`;

    if (fs.existsSync(BANNER_PATH)) {
      const bannerBase64 = fs.readFileSync(BANNER_PATH).toString('base64');
      const bannerMedia  = new MessageMedia('image/png', bannerBase64, 'wa-bot-banner.png');
      await chat.sendMessage(bannerMedia, { caption: introText });
    } else {
      await chat.sendMessage(introText);
    }

    // ── 2. Kirim audio musik intro (dari file lokal) ──
    const audioPath = path.join(__dirname, '../../assets/intro.mp3');
    try {
      if (fs.existsSync(audioPath)) {
        const audioBase64 = fs.readFileSync(audioPath).toString('base64');
        const audioMedia  = new MessageMedia('audio/mpeg', audioBase64, 'intro.mp3');
        await chat.sendMessage(audioMedia, { sendAudioAsVoice: true });
      }
    } catch (audioErr) {
      console.log('Audio intro gagal (skip):', audioErr.message);
    }

  } catch (err) {
    console.error('Intro error:', err.message);
    await msg.reply('❌ Gagal menampilkan intro: ' + err.message);
  }
}

module.exports = { showIntro };
