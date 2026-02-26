const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

const TIKWM_API = 'https://www.tikwm.com/api/';

async function getTikTokData(url) {
  const response = await axios.post(TIKWM_API, null, {
    params: { url, hd: 1 },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });

  const data = response.data;
  if (!data || data.code !== 0) throw new Error('Gagal mengambil data TikTok. Cek URL-nya!');
  return data.data;
}

// Download TikTok sebagai video (tanpa watermark)
async function tiktokVideo(msg, args) {
  const url = args[1];
  if (!url || !url.includes('tiktok')) {
    return msg.reply(
      '❌ *Format salah!*\n\n' +
      'Gunakan: `!tt [link tiktok]`\n' +
      'Contoh: `!tt https://vt.tiktok.com/xxxxx`'
    );
  }

  const loadingMsg = await msg.reply('⏳ Mengunduh video TikTok, harap tunggu...');

  try {
    const data = await getTikTokData(url);

    const title = data.title?.slice(0, 100) || 'TikTok Video';
    const author = data.author?.nickname || 'Unknown';
    const plays = Number(data.play_count || 0).toLocaleString('id-ID');
    const likes = Number(data.digg_count || 0).toLocaleString('id-ID');
    const duration = data.duration ? `${data.duration}s` : '-';

    // Download video buffer
    const videoResp = await axios.get(data.play, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const sizeMB = (videoResp.data.byteLength / 1024 / 1024).toFixed(1);
    const base64 = Buffer.from(videoResp.data).toString('base64');
    const media = new MessageMedia('video/mp4', base64, 'tiktok.mp4');

    const caption =
      `🎵 *TikTok Downloader*\n\n` +
      `📝 *Judul:* ${title}\n` +
      `👤 *Author:* @${author}\n` +
      `⏱️ *Durasi:* ${duration}\n` +
      `▶️ *Views:* ${plays}\n` +
      `❤️ *Likes:* ${likes}\n` +
      `📦 *Ukuran:* ${sizeMB} MB\n\n` +
      `_Video tanpa watermark ✅_`;

    await msg.reply(media, undefined, { caption });

    try { await loadingMsg.delete(true); } catch {}

  } catch (err) {
    try { await loadingMsg.delete(true); } catch {}
    console.error('TikTok video error:', err.message);
    await msg.reply(
      `❌ *Gagal mengunduh video!*\n\n` +
      `Kemungkinan penyebab:\n` +
      `• Link tidak valid / sudah dihapus\n` +
      `• Video privat\n` +
      `• File terlalu besar\n\n` +
      `Coba lagi dengan link lain.`
    );
  }
}

// Download audio saja dari TikTok
async function tiktokAudio(msg, args) {
  const url = args[1];
  if (!url || !url.includes('tiktok')) {
    return msg.reply(
      '❌ *Format salah!*\n\n' +
      'Gunakan: `!ttaudio [link tiktok]`\n' +
      'Contoh: `!ttaudio https://vt.tiktok.com/xxxxx`'
    );
  }

  const loadingMsg = await msg.reply('🎵 Mengekstrak audio TikTok, harap tunggu...');

  try {
    const data = await getTikTokData(url);

    const title = data.title?.slice(0, 100) || 'TikTok Audio';
    const author = data.author?.nickname || 'Unknown';
    const musicTitle = data.music_info?.title || title;
    const musicAuthor = data.music_info?.author || author;

    const audioUrl = data.music || data.music_info?.play;
    if (!audioUrl) throw new Error('Tidak ada audio tersedia.');

    const audioResp = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const sizeMB = (audioResp.data.byteLength / 1024 / 1024).toFixed(1);
    const base64 = Buffer.from(audioResp.data).toString('base64');
    const media = new MessageMedia('audio/mpeg', base64, `${musicTitle}.mp3`);

    const caption =
      `🎵 *TikTok Audio Downloader*\n\n` +
      `🎶 *Judul:* ${musicTitle}\n` +
      `🎤 *Artis:* ${musicAuthor}\n` +
      `👤 *Creator:* @${author}\n` +
      `📦 *Ukuran:* ${sizeMB} MB\n\n` +
      `_Audio berhasil diekstrak ✅_`;

    await msg.reply(media, undefined, { caption, sendAudioAsVoice: false });

    try { await loadingMsg.delete(true); } catch {}

  } catch (err) {
    try { await loadingMsg.delete(true); } catch {}
    console.error('TikTok audio error:', err.message);
    await msg.reply(
      `❌ *Gagal mengekstrak audio!*\n\n` +
      `Kemungkinan penyebab:\n` +
      `• Link tidak valid / sudah dihapus\n` +
      `• Video privat\n` +
      `• Audio tidak tersedia\n\n` +
      `Coba lagi dengan link lain.`
    );
  }
}

module.exports = { tiktokVideo, tiktokAudio };
