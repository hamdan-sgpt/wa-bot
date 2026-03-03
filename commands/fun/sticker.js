const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

async function toSticker(client, msg) {
  let media;

  // Handle quoted message with media
  if (msg.hasQuotedMsg) {
    const quoted = await msg.getQuotedMessage();
    if (!quoted.hasMedia) return msg.reply('❌ Quote gambar/GIF yang ingin dijadikan sticker!');
    media = await quoted.downloadMedia();
  } else if (msg.hasMedia) {
    media = await msg.downloadMedia();
  } else {
    return msg.reply('❌ Kirim gambar/GIF dengan caption *!sticker* atau quote sebuah gambar!');
  }

  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'].includes(media.mimetype)) {
    return msg.reply('❌ Format tidak didukung! Gunakan: JPG, PNG, GIF, atau WebP');
  }

  try {
    const chat = await msg.getChat();
    await chat.sendMessage(media, {
      sendMediaAsSticker: true,
    });
  } catch (err) {
    console.error('Sticker error:', err);
    await msg.reply('❌ Gagal membuat sticker. Pastikan format file didukung.');
  }
}

async function toImage(client, msg) {
  let media;

  if (msg.hasQuotedMsg) {
    const quoted = await msg.getQuotedMessage();
    if (!quoted.hasMedia) return msg.reply('❌ Quote sticker yang ingin diubah menjadi gambar!');
    media = await quoted.downloadMedia();
  } else if (msg.hasMedia) {
    media = await msg.downloadMedia();
  } else {
    return msg.reply('❌ Quote sebuah sticker untuk mengubahnya menjadi gambar!');
  }

  if (media.mimetype !== 'image/webp') {
    return msg.reply('❌ Bukan sticker! Sticker berformat WebP.');
  }

  // Convert webp to image by re-sending as regular image
  const imageMedia = new MessageMedia('image/png', media.data, 'sticker.png');
  await msg.reply(imageMedia);
}

// ═══════════════════════════════════════════════════════════════
//  3. STICKER TEXT (!st) — Tambah teks ke sticker/gambar
// ═══════════════════════════════════════════════════════════════
async function stickerText(client, msg, args) {
  const text = args.slice(1).join(' ');
  if (!text) {
    return msg.reply(
      `✍️ *STICKER TEXT*\n\n` +
      `Cara pakai:\n` +
      `• Reply sticker/gambar + \`!st [teks]\`\n` +
      `• Kirim gambar + caption \`!st [teks]\`\n\n` +
      `Contoh: \`!st Halo Dunia\`\n\n` +
      `Teks akan ditambahkan di bagian bawah sticker!`
    );
  }

  let media;
  if (msg.hasQuotedMsg) {
    const quoted = await msg.getQuotedMessage();
    if (!quoted.hasMedia) return msg.reply('❌ Reply ke sticker/gambar yang mau dikasih teks!');
    media = await quoted.downloadMedia();
  } else if (msg.hasMedia) {
    media = await msg.downloadMedia();
  } else {
    return msg.reply('❌ Reply sticker/gambar atau kirim gambar + caption \`!st [teks]\`!');
  }

  try {
    const { createCanvas, loadImage } = require('@napi-rs/canvas');

    const imgBuffer = Buffer.from(media.data, 'base64');
    const img = await loadImage(imgBuffer);

    // Sticker is 512x512
    const size = 512;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Draw original image centered/fitted
    const scale = Math.min(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2;
    const y = (size - h) / 2;

    // Transparent background
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, x, y, w, h);

    // Auto-size text to fit width
    let fontSize = 64;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    while (ctx.measureText(text).width > size - 40 && fontSize > 16) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    }

    // Text position (bottom center)
    const textX = size / 2;
    const textY = size - 20;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Black outline (stroke)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(4, fontSize / 8);
    ctx.lineJoin = 'round';
    ctx.strokeText(text, textX, textY);

    // White fill
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, textX, textY);

    const buffer = canvas.toBuffer('image/png');
    const resultMedia = new MessageMedia('image/png', buffer.toString('base64'), 'stickertext.png');

    const chat = await msg.getChat();
    await chat.sendMessage(resultMedia, {
      sendMediaAsSticker: true,
    });
  } catch (err) {
    console.error('StickerText error:', err);
    await msg.reply('❌ Gagal bikin sticker: ' + err.message);
  }
}

module.exports = { toSticker, toImage, stickerText };
