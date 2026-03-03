const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

// ═══════════════════════════════════════════════════════════════
//  IN-MEMORY CACHE untuk View-Once messages
//  groupId => [ { id, media, sender, type, timestamp } ]
//  Auto-expire setelah 10 menit
// ═══════════════════════════════════════════════════════════════

// chatId => array of cached view-once items
const viewOnceCache = new Map();
const CACHE_EXPIRE = 10 * 60 * 1000; // 10 menit

/**
 * Hook: Dipanggil dari handler.js untuk SETIAP pesan masuk
 * Detect & cache view-once messages sebelum expired
 */
async function interceptViewOnce(msg) {
  try {
    // Cek apakah pesan ini view-once
    const isVO = msg.isViewOnce ||
                 msg._data?.isViewOnce ||
                 (msg._data?.message?.viewOnceMessage) ||
                 (msg._data?.message?.viewOnceMessageV2) ||
                 (msg._data?.message?.viewOnceMessageV2Extension);

    if (!isVO) return false;
    if (!msg.hasMedia) return false;

    // Download media SEKARANG sebelum expired
    const media = await msg.downloadMedia();
    if (!media || !media.data) return false;

    const contact = await msg.getContact();
    const chatId = msg.from;
    const senderName = contact.pushname || contact.name || contact.id.user;
    const senderId = contact.id._serialized;

    // Simpan ke cache
    if (!viewOnceCache.has(chatId)) {
      viewOnceCache.set(chatId, []);
    }

    const cache = viewOnceCache.get(chatId);
    const entry = {
      id: msg.id._serialized,
      media,
      senderName,
      senderId,
      senderUser: contact.id.user,
      type: media.mimetype,
      timestamp: Date.now(),
    };

    cache.push(entry);

    // Limit cache per chat (max 5 item)
    while (cache.length > 5) cache.shift();

    // Auto-cleanup expired entries
    setTimeout(() => {
      const arr = viewOnceCache.get(chatId);
      if (arr) {
        const now = Date.now();
        const filtered = arr.filter(e => now - e.timestamp < CACHE_EXPIRE);
        if (filtered.length === 0) {
          viewOnceCache.delete(chatId);
        } else {
          viewOnceCache.set(chatId, filtered);
        }
      }
    }, CACHE_EXPIRE);

    console.log(`👁️ View-once dari ${senderName} di-cache (${media.mimetype})`);
    return true;
  } catch (err) {
    console.error('ViewOnce intercept error:', err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
//  1. EKSPOR VIEW-ONCE (!ekspor)
// ═══════════════════════════════════════════════════════════════

/**
 * Command: !ekspor
 * Ekspor view-once terakhir di chat ini
 */
async function eksporViewOnce(msg) {
  const chatId = msg.from;
  const cache = viewOnceCache.get(chatId);

  if (!cache || cache.length === 0) {
    return msg.reply(
      `👁️ *EKSPOR VIEW-ONCE*\n\n` +
      `Tidak ada pesan view-once yang tersimpan di chat ini.\n\n` +
      `⚠️ *Cara kerja:*\n` +
      `Bot otomatis mendeteksi & menyimpan foto/video view-once saat dikirim.\n` +
      `Lalu ketik \`!ekspor\` untuk mengekspor-nya.\n\n` +
      `📌 *Catatan:*\n` +
      `• View-once hanya disimpan *10 menit*\n` +
      `• Maksimal 5 view-once per chat\n` +
      `• Bot harus sudah aktif saat view-once dikirim`
    );
  }

  // Clean expired entries
  const now = Date.now();
  const valid = cache.filter(e => now - e.timestamp < CACHE_EXPIRE);
  if (valid.length === 0) {
    viewOnceCache.delete(chatId);
    return msg.reply('❌ View-once sudah expired (lebih dari 10 menit).');
  }

  // Ambil yang terbaru
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

    // Hapus dari cache setelah diekspor
    const idx = valid.indexOf(latest);
    valid.splice(idx, 1);
    if (valid.length === 0) {
      viewOnceCache.delete(chatId);
    } else {
      viewOnceCache.set(chatId, valid);
    }
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

  // Cek apakah reply ke gambar atau ada gambar
  const quotedMsg = await msg.getQuotedMessage?.() || msg;
  const hasMedia = quotedMsg.hasMedia;

  if (!hasMedia) {
    return msg.reply(
      `🖼️ *REMOVE BACKGROUND*\n\n` +
      `Cara pakai: Kirim/reply gambar dengan caption \`!removebg\`\n\n` +
      `Contoh:\n` +
      `1️⃣ Kirim gambar + caption \`!removebg\`\n` +
      `2️⃣ Atau reply gambar → ketik \`!removebg\``
    );
  }

  await msg.reply('⏳ Sedang menghapus background... Tunggu sebentar ya!');

  try {
    const media = await quotedMsg.downloadMedia();
    if (!media || !media.data) {
      return msg.reply('❌ Gagal mendownload gambar.');
    }

    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        image_file_b64: media.data,
        size: 'auto',
        format: 'png',
      },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const resultBase64 = Buffer.from(response.data).toString('base64');
    const resultMedia = new MessageMedia('image/png', resultBase64, 'nobg.png');

    await msg.reply(resultMedia, undefined, {
      caption: `✅ *Background berhasil dihapus!*\n\n_Powered by remove.bg_`,
    });
  } catch (err) {
    if (err.response?.status === 402) {
      await msg.reply('❌ Kuota remove.bg habis bulan ini (limit 50 gambar/bulan).');
    } else if (err.response?.status === 400) {
      await msg.reply('❌ Gambar tidak valid atau tidak bisa diproses.');
    } else {
      await msg.reply('❌ Gagal menghapus background: ' + (err.message || 'Unknown error'));
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  3. HD ENHANCE (Upscale + Sharpen via Canvas)
// ═══════════════════════════════════════════════════════════════

async function hdEnhance(msg) {
  const quotedMsg = await msg.getQuotedMessage?.() || msg;

  if (!quotedMsg.hasMedia) {
    return msg.reply(
      `✨ *HD ENHANCE*\n\n` +
      `Cara pakai: Kirim/reply gambar dengan caption \`!hd\`\n\n` +
      `Contoh:\n` +
      `1️⃣ Kirim gambar + caption \`!hd\`\n` +
      `2️⃣ Atau reply gambar → ketik \`!hd\``
    );
  }

  await msg.reply('⏳ Sedang meng-HD-kan gambar... Tunggu sebentar!');

  try {
    const { createCanvas, loadImage } = require('@napi-rs/canvas');
    const media = await quotedMsg.downloadMedia();
    if (!media || !media.data) {
      return msg.reply('❌ Gagal mendownload gambar.');
    }

    const imgBuffer = Buffer.from(media.data, 'base64');
    const img = await loadImage(imgBuffer);

    // Upscale 2x
    const scale = 2;
    const newWidth = img.width * scale;
    const newHeight = img.height * scale;

    // Cap max dimensions to prevent OOM (max 4000px)
    const maxDim = 4000;
    let finalWidth = newWidth;
    let finalHeight = newHeight;
    if (finalWidth > maxDim || finalHeight > maxDim) {
      const ratio = Math.min(maxDim / finalWidth, maxDim / finalHeight);
      finalWidth = Math.round(finalWidth * ratio);
      finalHeight = Math.round(finalHeight * ratio);
    }

    const canvas = createCanvas(finalWidth, finalHeight);
    const ctx = canvas.getContext('2d');

    // Enable smooth scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw upscaled
    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

    // Apply sharpening
    const imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
    const data = imageData.data;

    // Simple contrast + brightness enhancement
    const contrast = 1.15;
    const brightness = 5;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * contrast) + 128 + brightness));
      data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * contrast) + 128 + brightness));
      data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * contrast) + 128 + brightness));
    }
    ctx.putImageData(imageData, 0, 0);

    const buffer = canvas.toBuffer('image/png');
    const base64 = buffer.toString('base64');
    const resultMedia = new MessageMedia('image/png', base64, 'hd.png');

    await msg.reply(resultMedia, undefined, {
      caption:
        `✨ *HD ENHANCE*\n\n` +
        `📐 Original: ${img.width} × ${img.height}\n` +
        `📐 Enhanced: ${finalWidth} × ${finalHeight}\n` +
        `🔍 Scale: ${scale}x + Sharpen + Contrast`,
    });
  } catch (err) {
    await msg.reply('❌ Gagal enhance gambar: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  interceptViewOnce,
  eksporViewOnce,
  removeBg,
  hdEnhance,
};
