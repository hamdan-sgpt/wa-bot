const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

const TIKWM_API = 'https://www.tikwm.com/api/';
const MAX_FILE_SIZE_MB = 15; // Batas maksimum ukuran file (MB)
const MAX_RETRIES = 2; // Jumlah percobaan ulang kirim media

async function getTikTokData(url) {
  const response = await axios.post(TIKWM_API, null, {
    params: { url, hd: 1 },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 20000,
  });

  const data = response.data;
  if (!data || data.code !== 0) throw new Error('Gagal mengambil data TikTok. Cek URL-nya!');
  return data.data;
}

// Helper: kirim media dengan retry supaya tidak timeout
async function sendMediaWithRetry(msg, media, options, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      await msg.reply(media, undefined, options);
      return; // berhasil, langsung keluar
    } catch (err) {
      const isTimeout = err.message?.includes('timed out') || err.message?.includes('protocolTimeout');
      if (isTimeout && i < retries - 1) {
        console.log(`⏳ Percobaan kirim ke-${i + 1} gagal (timeout), mencoba lagi...`);
        await new Promise(r => setTimeout(r, 3000)); // tunggu 3 detik sebelum retry
      } else {
        throw err; // lempar error jika sudah habis percobaan atau bukan timeout
      }
    }
  }
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

    // Coba SD dulu (lebih kecil), kalau gagal baru HD
    const videoUrl = data.play || data.hdplay;
    if (!videoUrl) throw new Error('URL video tidak tersedia.');

    // Download video buffer
    const videoResp = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 90000, // 90 detik untuk download
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const sizeMB = (videoResp.data.byteLength / 1024 / 1024).toFixed(1);

    // Cek ukuran file - tolak jika terlalu besar
    if (parseFloat(sizeMB) > MAX_FILE_SIZE_MB) {
      try { await loadingMsg.delete(true); } catch {}
      return msg.reply(
        `⚠️ *Video terlalu besar!*\n\n` +
        `📦 Ukuran: ${sizeMB} MB\n` +
        `📏 Batas maksimum: ${MAX_FILE_SIZE_MB} MB\n\n` +
        `_Video yang terlalu besar menyebabkan timeout._\n` +
        `_Coba video TikTok yang lebih pendek._`
      );
    }

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

    // Kirim dengan retry logic
    await sendMediaWithRetry(msg, media, { caption });

    try { await loadingMsg.delete(true); } catch {}

  } catch (err) {
    try { await loadingMsg.delete(true); } catch {}
    console.error('TikTok video error:', err.message);

    const isTimeout = err.message?.includes('timed out') || err.message?.includes('protocolTimeout');
    const errorMsg = isTimeout
      ? `❌ *Gagal mengirim video (timeout)!*\n\n` +
        `Video berhasil diunduh tapi gagal dikirim karena terlalu besar.\n` +
        `Coba video TikTok yang lebih pendek/kecil.`
      : `❌ *Gagal mengunduh video!*\n\n` +
        `Kemungkinan penyebab:\n` +
        `• Link tidak valid / sudah dihapus\n` +
        `• Video privat\n` +
        `• Server TikTok sedang gangguan\n\n` +
        `Coba lagi dengan link lain.`;

    await msg.reply(errorMsg);
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

    // Cek ukuran file audio
    if (parseFloat(sizeMB) > MAX_FILE_SIZE_MB) {
      try { await loadingMsg.delete(true); } catch {}
      return msg.reply(
        `⚠️ *Audio terlalu besar!*\n\n` +
        `📦 Ukuran: ${sizeMB} MB\n` +
        `📏 Batas maksimum: ${MAX_FILE_SIZE_MB} MB\n\n` +
        `_Coba audio dari video yang lebih pendek._`
      );
    }

    const base64 = Buffer.from(audioResp.data).toString('base64');
    const media = new MessageMedia('audio/mpeg', base64, `${musicTitle}.mp3`);

    const caption =
      `🎵 *TikTok Audio Downloader*\n\n` +
      `🎶 *Judul:* ${musicTitle}\n` +
      `🎤 *Artis:* ${musicAuthor}\n` +
      `👤 *Creator:* @${author}\n` +
      `📦 *Ukuran:* ${sizeMB} MB\n\n` +
      `_Audio berhasil diekstrak ✅_`;

    // Kirim dengan retry logic
    await sendMediaWithRetry(msg, media, { caption, sendAudioAsVoice: false });

    try { await loadingMsg.delete(true); } catch {}

  } catch (err) {
    try { await loadingMsg.delete(true); } catch {}
    console.error('TikTok audio error:', err.message);

    const isTimeout = err.message?.includes('timed out') || err.message?.includes('protocolTimeout');
    const errorMsg = isTimeout
      ? `❌ *Gagal mengirim audio (timeout)!*\n\n` +
        `Audio berhasil diunduh tapi gagal dikirim.\n` +
        `Coba audio dari video yang lebih pendek.`
      : `❌ *Gagal mengekstrak audio!*\n\n` +
        `Kemungkinan penyebab:\n` +
        `• Link tidak valid / sudah dihapus\n` +
        `• Video privat\n` +
        `• Audio tidak tersedia\n\n` +
        `Coba lagi dengan link lain.`;

    await msg.reply(errorMsg);
  }
}

module.exports = { tiktokVideo, tiktokAudio };
