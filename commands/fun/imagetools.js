const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

// ═══════════════════════════════════════════════════════════════
//  IN-MEMORY CACHE untuk View-Once messages
//  chatId => [ { media, sender, type, timestamp } ]
//  Auto-expire: 10 menit
// ═══════════════════════════════════════════════════════════════
const viewOnceCache = new Map();
const CACHE_EXPIRE = 10 * 60 * 1000;

/**
 * Hook: Dipanggil dari handler.js untuk SETIAP pesan masuk
 * Detect & cache view-once messages sebelum expired
 *
 * whatsapp-web.js v1.26 TIDAK punya msg.isViewOnce
 * Detection harus via msg._data.isViewOnce
 */
async function interceptViewOnce(msg) {
  try {
    // ── Detection: check raw data ──
    const raw = msg._data || {};
    const isVO = raw.isViewOnce === true ||
                 raw.isViewOnce === 1 ||
                 (raw.message && (
                   raw.message.viewOnceMessage != null ||
                   raw.message.viewOnceMessageV2 != null ||
                   raw.message.viewOnceMessageV2Extension != null
                 ));

    if (!isVO) return false;

    // View-once terdeteksi!
    console.log(`👁️ [VIEW-ONCE] Terdeteksi dari ${msg.from} (type: ${msg.type}, hasMedia: ${msg.hasMedia})`);

    // Download media - cek hasMedia dulu, kalau false coba paksa download
    let media = null;
    if (msg.hasMedia) {
      media = await msg.downloadMedia();
    }

    // Fallback: coba download meskipun hasMedia false (kadang view-once hasMedia = false)
    if (!media || !media.data) {
      try {
        media = await msg.downloadMedia();
      } catch (e) {
        console.error('👁️ [VIEW-ONCE] Download fallback gagal:', e.message);
      }
    }

    if (!media || !media.data) {
      console.log('👁️ [VIEW-ONCE] Media gagal di-download');
      return false;
    }

    const contact = await msg.getContact();
    const chatId = msg.from;

    if (!viewOnceCache.has(chatId)) {
      viewOnceCache.set(chatId, []);
    }

    const cache = viewOnceCache.get(chatId);
    cache.push({
      media,
      senderName: contact.pushname || contact.name || contact.id.user,
      senderId: contact.id._serialized,
      senderUser: contact.id.user,
      type: media.mimetype,
      timestamp: Date.now(),
    });

    // Max 5 per chat
    while (cache.length > 5) cache.shift();

    // Auto-cleanup
    setTimeout(() => {
      const arr = viewOnceCache.get(chatId);
      if (arr) {
        const now = Date.now();
        const filtered = arr.filter(e => now - e.timestamp < CACHE_EXPIRE);
        if (filtered.length === 0) viewOnceCache.delete(chatId);
        else viewOnceCache.set(chatId, filtered);
      }
    }, CACHE_EXPIRE);

    console.log(`👁️ [VIEW-ONCE] ✅ Cached! (${media.mimetype}, ${cache.length} items)`);
    return true;
  } catch (err) {
    console.error('👁️ [VIEW-ONCE] Intercept error:', err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
//  1. EKSPOR VIEW-ONCE (!ekspor)
// ═══════════════════════════════════════════════════════════════

async function eksporViewOnce(msg) {
  const chatId = msg.from;
  const cache = viewOnceCache.get(chatId);

  if (!cache || cache.length === 0) {
    return msg.reply(
      `👁️ *EKSPOR VIEW-ONCE*\n\n` +
      `Tidak ada pesan view-once yang tersimpan.\n\n` +
      `*Cara kerja:*\n` +
      `Bot otomatis mendeteksi & menyimpan foto/video view-once saat dikirim ke chat ini.\n` +
      `Lalu ketik \`!ekspor\` untuk mengekspor.\n\n` +
      `📌 *Catatan:*\n` +
      `• Disimpan maks *10 menit*\n` +
      `• Maks 5 view-once per chat\n` +
      `• Bot harus sudah aktif saat view-once dikirim`
    );
  }

  // Filter expired
  const now = Date.now();
  const valid = cache.filter(e => now - e.timestamp < CACHE_EXPIRE);
  if (valid.length === 0) {
    viewOnceCache.delete(chatId);
    return msg.reply('❌ View-once sudah expired (lebih dari 10 menit).');
  }

  const latest = valid[valid.length - 1];

  try {
    const resultMedia = new MessageMedia(
      latest.media.mimetype,
      latest.media.data,
      latest.media.filename || (latest.type.includes('video') ? 'viewonce.mp4' : 'viewonce.jpg')
    );

    const duration = formatMs(now - latest.timestamp);

    await msg.reply(resultMedia, undefined, {
      caption:
        `👁️ *VIEW-ONCE EXPORTED*\n\n` +
        `📤 Dari: @${latest.senderUser}\n` +
        `📁 Type: ${latest.type}\n` +
        `⏰ ${duration} yang lalu\n\n` +
        `_Diekspor menggunakan bot_`,
      mentions: [latest.senderId],
    });

    // Remove from cache
    const idx = valid.indexOf(latest);
    valid.splice(idx, 1);
    if (valid.length === 0) viewOnceCache.delete(chatId);
    else viewOnceCache.set(chatId, valid);
  } catch (err) {
    await msg.reply('❌ Gagal mengekspor: ' + err.message);
  }
}

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} detik`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} menit`;
  return `${Math.floor(m / 60)} jam ${m % 60} menit`;
}

// ═══════════════════════════════════════════════════════════════
//  2. REMOVE BACKGROUND (remove.bg API)
// ═══════════════════════════════════════════════════════════════

async function removeBg(msg) {
  const apiKey = process.env.REMOVEBG_API_KEY || require('../../config').removeBgApiKey;

  if (!apiKey) {
    return msg.reply('❌ API key remove.bg belum diset! Hubungi owner bot.');
  }

  const quotedMsg = await msg.getQuotedMessage?.() || msg;
  if (!quotedMsg.hasMedia) {
    return msg.reply(
      `🖼️ *REMOVE BACKGROUND*\n\n` +
      `Cara pakai: Kirim/reply gambar dengan caption \`!removebg\`\n\n` +
      `Contoh:\n` +
      `1️⃣ Kirim gambar + caption \`!removebg\`\n` +
      `2️⃣ Atau reply gambar → ketik \`!removebg\``
    );
  }

  await msg.reply('⏳ Sedang menghapus background...');

  try {
    const media = await quotedMsg.downloadMedia();
    if (!media || !media.data) return msg.reply('❌ Gagal mendownload gambar.');

    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
      data: { image_file_b64: media.data, size: 'auto', format: 'png' },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const resultBase64 = Buffer.from(response.data).toString('base64');
    const resultMedia = new MessageMedia('image/png', resultBase64, 'nobg.png');

    // Kirim sebagai DOCUMENT agar PNG transparan tidak diconvert jadi JPEG
    await msg.reply(resultMedia, undefined, {
      caption: `✅ *Background berhasil dihapus!*\n\n_Powered by remove.bg_`,
      sendMediaAsDocument: true,
    });
  } catch (err) {
    if (err.response?.status === 402) await msg.reply('❌ Kuota remove.bg habis (50/bulan).');
    else if (err.response?.status === 400) await msg.reply('❌ Gambar tidak valid.');
    else await msg.reply('❌ Gagal: ' + (err.message || 'Unknown error'));
  }
}

// ═══════════════════════════════════════════════════════════════
//  3. HD ENHANCE (DeepAI Super Resolution API — AI-based upscale)
// ═══════════════════════════════════════════════════════════════

async function hdEnhance(msg) {
  const quotedMsg = await msg.getQuotedMessage?.() || msg;
  if (!quotedMsg.hasMedia) {
    return msg.reply(
      `✨ *HD ENHANCE (AI)*\n\n` +
      `Cara pakai: Kirim/reply gambar dengan caption \`!hd\`\n\n` +
      `🤖 Menggunakan AI Super Resolution untuk hasil HD yang beneran tajam!`
    );
  }

  await msg.reply('⏳ Sedang meng-HD-kan gambar pake AI... (±10 detik)');

  try {
    const media = await quotedMsg.downloadMedia();
    if (!media || !media.data) return msg.reply('❌ Gagal mendownload gambar.');

    const apiKey = process.env.DEEPAI_API_KEY || require('../../config').deepAiApiKey;
    if (!apiKey) {
      return msg.reply('❌ API key DeepAI belum diset! Hubungi owner bot.');
    }

    // Kirim ke DeepAI Super Resolution API
    const FormData = require('form-data');
    const form = new FormData();
    const imgBuffer = Buffer.from(media.data, 'base64');
    form.append('image', imgBuffer, { filename: 'input.jpg', contentType: media.mimetype || 'image/jpeg' });

    const response = await axios.post(
      'https://api.deepai.org/api/torch-srgan',
      form,
      {
        headers: {
          'Api-Key': apiKey,
          ...form.getHeaders(),
        },
        timeout: 60000,
      }
    );

    const outputUrl = response.data?.output_url;
    if (!outputUrl) {
      throw new Error('API tidak mengembalikan hasil.');
    }

    // Download hasil HD dari DeepAI
    const hdResponse = await axios.get(outputUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
    });

    const resultBase64 = Buffer.from(hdResponse.data).toString('base64');
    const resultMedia = new MessageMedia('image/png', resultBase64, 'hd_ai.png');

    await msg.reply(resultMedia, undefined, {
      caption:
        `✨ *HD ENHANCE (AI)*\n\n` +
        `🤖 Super Resolution by DeepAI\n` +
        `🔍 AI Upscale + Detail Recovery\n\n` +
        `_Gambar di-enhance pake AI SRGAN untuk hasil HD maksimal_`,
    });
  } catch (err) {
    const errMsg = err.response?.data
      ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data))
      : err.message;
    await msg.reply('❌ Gagal enhance HD: ' + errMsg);
  }
}

module.exports = {
  interceptViewOnce,
  eksporViewOnce,
  removeBg,
  hdEnhance,
};
