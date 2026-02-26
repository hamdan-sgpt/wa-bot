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

module.exports = { toSticker, toImage };
