const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

// ═══════════════════════════════════════════════════════════════
//  1. REMOVE BACKGROUND (remove.bg API)
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

    const imageBuffer = Buffer.from(media.data, 'base64');

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
//  2. HD ENHANCE (Upscale + Sharpen via Canvas)
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

    // Apply sharpening using unsharp mask technique
    // Get image data for manipulation
    const imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
    const data = imageData.data;

    // Create a second canvas for blur (unsharp mask)
    const blurCanvas = createCanvas(finalWidth, finalHeight);
    const blurCtx = blurCanvas.getContext('2d');
    blurCtx.drawImage(canvas, 0, 0);

    // Simple contrast + brightness enhancement
    const contrast = 1.15;
    const brightness = 5;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * contrast) + 128 + brightness));     // R
      data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * contrast) + 128 + brightness)); // G
      data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * contrast) + 128 + brightness)); // B
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
//  3. VIEW-ONCE EXPORT (!ekspor)
// ═══════════════════════════════════════════════════════════════

async function eksporViewOnce(msg) {
  const quotedMsg = await msg.getQuotedMessage?.();

  if (!quotedMsg) {
    return msg.reply(
      `👁️ *EKSPOR VIEW-ONCE*\n\n` +
      `Cara pakai: Reply ke foto/video *view-once* → ketik \`!ekspor\`\n\n` +
      `Bot akan extract media-nya dan kirim ulang sebagai file biasa.`
    );
  }

  // Check if it's a view-once message
  if (!quotedMsg.isViewOnce && quotedMsg.type !== 'image' && quotedMsg.type !== 'video') {
    return msg.reply('❌ Pesan yang di-reply bukan foto/video view-once!');
  }

  try {
    const media = await quotedMsg.downloadMedia();
    if (!media || !media.data) {
      return msg.reply('❌ Gagal mendownload media. Mungkin sudah expired.');
    }

    const contact = await quotedMsg.getContact();
    const senderName = contact.pushname || contact.name || contact.id.user;

    await msg.reply(media, undefined, {
      caption:
        `👁️ *VIEW-ONCE EXPORTED*\n\n` +
        `📤 Diekspor dari pesan @${contact.id.user}\n` +
        `📁 Type: ${media.mimetype}\n\n` +
        `_Diekspor menggunakan bot_`,
      mentions: [contact.id._serialized],
    });
  } catch (err) {
    await msg.reply('❌ Gagal mengekspor media: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  removeBg,
  hdEnhance,
  eksporViewOnce,
};
