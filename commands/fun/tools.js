const QRCode = require('qrcode');
const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

// ═══════════════════════════════════════════════════════════════
//  REMINDER STATE (in-memory)
// ═══════════════════════════════════════════════════════════════
const activeReminders = new Map(); // chatId => [{ timer, msg, time }]

// ═══════════════════════════════════════════════════════════════
//  TEXT EFFECT MAPS
// ═══════════════════════════════════════════════════════════════
const aestheticMap = {
  a: 'ａ', b: 'ｂ', c: 'ｃ', d: 'ｄ', e: 'ｅ', f: 'ｆ', g: 'ｇ', h: 'ｈ',
  i: 'ｉ', j: 'ｊ', k: 'ｋ', l: 'ｌ', m: 'ｍ', n: 'ｎ', o: 'ｏ', p: 'ｐ',
  q: 'ｑ', r: 'ｒ', s: 'ｓ', t: 'ｔ', u: 'ｕ', v: 'ｖ', w: 'ｗ', x: 'ｘ',
  y: 'ｙ', z: 'ｚ',
  A: 'Ａ', B: 'Ｂ', C: 'Ｃ', D: 'Ｄ', E: 'Ｅ', F: 'Ｆ', G: 'Ｇ', H: 'Ｈ',
  I: 'Ｉ', J: 'Ｊ', K: 'Ｋ', L: 'Ｌ', M: 'Ｍ', N: 'Ｎ', O: 'Ｏ', P: 'Ｐ',
  Q: 'Ｑ', R: 'Ｒ', S: 'Ｓ', T: 'Ｔ', U: 'Ｕ', V: 'Ｖ', W: 'Ｗ', X: 'Ｘ',
  Y: 'Ｙ', Z: 'Ｚ',
  ' ': '　', '0': '０', '1': '１', '2': '２', '3': '３', '4': '４',
  '5': '５', '6': '６', '7': '７', '8': '８', '9': '９',
};

const tinyMap = {
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ',
  i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ',
  q: 'q', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ',
  y: 'ʸ', z: 'ᶻ',
};

const flipMap = {
  a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ',
  i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd',
  q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x',
  y: 'ʎ', z: 'z',
  A: '∀', B: 'q', C: 'Ɔ', D: 'p', E: 'Ǝ', F: 'Ⅎ', G: '⅁', H: 'H',
  I: 'I', J: 'ſ', K: 'ʞ', L: '˥', M: 'W', N: 'N', O: 'O', P: 'Ԁ',
  Q: 'Q', R: 'ɹ', S: 'S', T: '⊥', U: '∩', V: 'Λ', W: 'M', X: 'X',
  Y: '⅄', Z: 'Z',
  '!': '¡', '?': '¿', '.': '˙', ',': '\'', '\'': ',',
  '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{',
  '<': '>', '>': '<', '_': '‾',
};

const bubbleMap = {
  a: 'ⓐ', b: 'ⓑ', c: 'ⓒ', d: 'ⓓ', e: 'ⓔ', f: 'ⓕ', g: 'ⓖ', h: 'ⓗ',
  i: 'ⓘ', j: 'ⓙ', k: 'ⓚ', l: 'ⓛ', m: 'ⓜ', n: 'ⓝ', o: 'ⓞ', p: 'ⓟ',
  q: 'ⓠ', r: 'ⓡ', s: 'ⓢ', t: 'ⓣ', u: 'ⓤ', v: 'ⓥ', w: 'ⓦ', x: 'ⓧ',
  y: 'ⓨ', z: 'ⓩ',
  A: 'Ⓐ', B: 'Ⓑ', C: 'Ⓒ', D: 'Ⓓ', E: 'Ⓔ', F: 'Ⓕ', G: 'Ⓖ', H: 'Ⓗ',
  I: 'Ⓘ', J: 'Ⓙ', K: 'Ⓚ', L: 'Ⓛ', M: 'Ⓜ', N: 'Ⓝ', O: 'Ⓞ', P: 'Ⓟ',
  Q: 'Ⓠ', R: 'Ⓡ', S: 'Ⓢ', T: 'Ⓣ', U: 'Ⓤ', V: 'Ⓥ', W: 'Ⓦ', X: 'Ⓧ',
  Y: 'Ⓨ', Z: 'Ⓩ',
  '0': '⓪', '1': '①', '2': '②', '3': '③', '4': '④',
  '5': '⑤', '6': '⑥', '7': '⑦', '8': '⑧', '9': '⑨',
};

// ═══════════════════════════════════════════════════════════════
//  1. QR CODE GENERATOR
// ═══════════════════════════════════════════════════════════════
async function generateQR(msg, args) {
  const text = args.slice(1).join(' ');
  if (!text) {
    return msg.reply(
      `📱 *QR CODE GENERATOR*\n\n` +
      `Cara pakai: \`!qr [teks atau link]\`\n\n` +
      `Contoh:\n` +
      `• \`!qr https://google.com\`\n` +
      `• \`!qr Halo ini pesan rahasia\`\n` +
      `• \`!qr 081234567890\``
    );
  }

  try {
    const qrBuffer = await QRCode.toBuffer(text, {
      width: 512,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    const base64 = qrBuffer.toString('base64');
    const media = new MessageMedia('image/png', base64, 'qrcode.png');

    await msg.reply(media, undefined, {
      caption: `📱 *QR Code berhasil dibuat!*\n\n📝 Konten: _${text.substring(0, 100)}${text.length > 100 ? '...' : ''}_`,
    });
  } catch (err) {
    await msg.reply('❌ Gagal membuat QR Code: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  2. REMINDER / PENGINGAT
// ═══════════════════════════════════════════════════════════════
async function remind(client, msg, args) {
  const minutes = parseInt(args[1]);
  const message = args.slice(2).join(' ');

  if (!minutes || !message) {
    return msg.reply(
      `⏰ *PENGINGAT / REMINDER*\n\n` +
      `Cara pakai: \`!remind [menit] [pesan]\`\n\n` +
      `Contoh:\n` +
      `• \`!remind 5 Minum obat!\`\n` +
      `• \`!remind 30 Meeting jam 2\`\n` +
      `• \`!remind 60 Jemput adik\`\n\n` +
      `_Maksimal: 1440 menit (24 jam)_`
    );
  }

  if (minutes < 1 || minutes > 1440) {
    return msg.reply('❌ Durasi harus antara 1-1440 menit (max 24 jam)!');
  }

  const chatId = msg.from;
  const contact = await msg.getContact();
  const name = contact.pushname || contact.name || 'User';

  // Set the timer
  const timer = setTimeout(async () => {
    try {
      const chat = await client.getChatById(chatId);
      await chat.sendMessage(
        `⏰ *PENGINGAT!*\n\n` +
        `Hai @${contact.id.user}! Ini pengingatmu:\n\n` +
        `📝 *${message}*\n\n` +
        `_Diset ${minutes} menit yang lalu_`,
        { mentions: [contact.id._serialized] }
      );
    } catch (err) {
      console.error('Reminder error:', err.message);
    }

    // Clean up
    const reminders = activeReminders.get(chatId) || [];
    const idx = reminders.findIndex(r => r.timer === timer);
    if (idx !== -1) reminders.splice(idx, 1);
    if (reminders.length === 0) activeReminders.delete(chatId);
  }, minutes * 60 * 1000);

  // Store reminder
  if (!activeReminders.has(chatId)) activeReminders.set(chatId, []);
  activeReminders.get(chatId).push({ timer, message, minutes });

  const waktu = new Date(Date.now() + minutes * 60000).toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit',
  });

  await msg.reply(
    `⏰ *Pengingat diset!*\n\n` +
    `📝 Pesan: _${message}_\n` +
    `⏱️ Waktu: *${minutes} menit* lagi (±${waktu} WIB)\n\n` +
    `_Aku akan mengingatkanmu nanti! ✅_`
  );
}

// ═══════════════════════════════════════════════════════════════
//  3. RANDOM PICKER / ACAK
// ═══════════════════════════════════════════════════════════════
async function randomPick(msg, args) {
  const items = args.slice(1).join(' ').split(',').map(s => s.trim()).filter(s => s);

  if (items.length < 2) {
    return msg.reply(
      `🎲 *RANDOM PICKER*\n\n` +
      `Cara pakai: \`!acak [item1], [item2], [item3], ...\`\n\n` +
      `Contoh:\n` +
      `• \`!acak Makan nasi goreng, Makan mie ayam, Makan bakso\`\n` +
      `• \`!acak Budi, Ani, Cici, Dedi\`\n` +
      `• \`!acak Merah, Biru, Hijau\`\n\n` +
      `_Minimal 2 pilihan, pisahkan dengan koma_`
    );
  }

  const chosen = items[Math.floor(Math.random() * items.length)];

  await msg.reply(
    `🎲 *RANDOM PICKER*\n\n` +
    `📋 Pilihan (${items.length}):\n` +
    items.map((item, i) => `${i + 1}. ${item}`).join('\n') + `\n\n` +
    `🥁🥁🥁\n\n` +
    `✅ Terpilih: *${chosen}*`
  );
}

// ═══════════════════════════════════════════════════════════════
//  4. POLL / POLLING
// ═══════════════════════════════════════════════════════════════
async function poll(msg, args) {
  const fullText = args.slice(1).join(' ');
  const parts = fullText.split('|').map(s => s.trim()).filter(s => s);

  if (parts.length < 3) {
    return msg.reply(
      `📊 *POLL / VOTING*\n\n` +
      `Cara pakai: \`!poll [pertanyaan] | [opsi1] | [opsi2] | ...\`\n\n` +
      `Contoh:\n` +
      `• \`!poll Makan dimana? | McD | KFC | Warteg | Masak sendiri\`\n` +
      `• \`!poll Kapan kumpul? | Sabtu | Minggu\`\n\n` +
      `_Minimal 1 pertanyaan + 2 opsi, pisahkan dengan |_`
    );
  }

  const question = parts[0];
  const options = parts.slice(1);
  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  let pollText =
    `📊 *POLL / VOTING*\n\n` +
    `❓ *${question}*\n\n`;

  options.forEach((opt, i) => {
    const emoji = numberEmojis[i] || `${i + 1}.`;
    pollText += `${emoji} ${opt}\n`;
  });

  pollText += `\n_Balas angka untuk vote! (1, 2, 3, ...)_\n`;
  pollText += `_Dibuat oleh @${(await msg.getContact()).id.user}_`;

  const chat = await msg.getChat();
  await chat.sendMessage(pollText, {
    mentions: [(await msg.getContact()).id._serialized],
  });
}

// ═══════════════════════════════════════════════════════════════
//  5. TEXT EFFECTS
// ═══════════════════════════════════════════════════════════════
async function textEffect(msg, args) {
  const effect = args[1]?.toLowerCase();
  const text = args.slice(2).join(' ');

  const effects = {
    aesthetic: 'ａｅｓｔｈｅｔｉｃ',
    tiny: 'ᵗⁱⁿʸ',
    flip: 'dılɟ',
    bubble: 'ⓑⓤⓑⓑⓛⓔ',
    bold: '𝗯𝗼𝗹𝗱',
    strike: 's̶t̶r̶i̶k̶e̶',
    space: 's p a c e',
    mock: 'mOcK',
  };

  if (!effect || !effects[effect] || !text) {
    const effectList = Object.entries(effects).map(([k, v]) => `• \`${k}\` → ${v}`).join('\n');
    return msg.reply(
      `✨ *TEXT EFFECTS*\n\n` +
      `Cara pakai: \`!teks [efek] [teks]\`\n\n` +
      `Efek tersedia:\n${effectList}\n\n` +
      `Contoh: \`!teks aesthetic Halo dunia\``
    );
  }

  let result;
  switch (effect) {
    case 'aesthetic':
      result = text.split('').map(c => aestheticMap[c] || c).join('');
      break;
    case 'tiny':
      result = text.toLowerCase().split('').map(c => tinyMap[c] || c).join('');
      break;
    case 'flip':
      result = text.split('').map(c => flipMap[c] || c).reverse().join('');
      break;
    case 'bubble':
      result = text.split('').map(c => bubbleMap[c] || c).join('');
      break;
    case 'bold':
      result = `*${text}*`;
      break;
    case 'strike':
      result = text.split('').map(c => c + '\u0336').join('');
      break;
    case 'space':
      result = text.split('').join(' ');
      break;
    case 'mock':
      result = text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
      break;
    default:
      result = text;
  }

  await msg.reply(`✨ *${effect.toUpperCase()}*\n\n${result}`);
}

// ═══════════════════════════════════════════════════════════════
//  6. COUNTDOWN / HITUNG MUNDUR
// ═══════════════════════════════════════════════════════════════
async function countdown(msg, args) {
  const dateStr = args[1];
  const label = args.slice(2).join(' ') || 'Target';

  if (!dateStr) {
    return msg.reply(
      `📅 *HITUNG MUNDUR*\n\n` +
      `Cara pakai: \`!countdown [DD/MM/YYYY] [label]\`\n\n` +
      `Contoh:\n` +
      `• \`!countdown 17/08/2026 Hari Kemerdekaan\`\n` +
      `• \`!countdown 25/12/2026 Natal\`\n` +
      `• \`!countdown 01/01/2027 Tahun Baru\``
    );
  }

  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    return msg.reply('❌ Format tanggal salah! Gunakan DD/MM/YYYY');
  }

  const [day, month, year] = parts.map(Number);
  const targetDate = new Date(year, month - 1, day);

  if (isNaN(targetDate.getTime())) {
    return msg.reply('❌ Tanggal tidak valid!');
  }

  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return msg.reply(`🎉 *${label}* sudah lewat! Tanggal ${dateStr} sudah terlewati.`);
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  // Progress bar (rough estimate for year)
  const totalDays = 365;
  const progress = Math.max(0, Math.min(100, Math.round(((totalDays - days) / totalDays) * 100)));
  const bar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

  await msg.reply(
    `📅 *HITUNG MUNDUR*\n\n` +
    `🎯 *${label}*\n` +
    `📆 Tanggal: ${dateStr}\n\n` +
    `⏱️ Sisa waktu:\n` +
    `• *${days}* hari\n` +
    `• *${hours}* jam\n` +
    `• *${minutes}* menit\n\n` +
    `[${bar}] ${progress}%`
  );
}

// ═══════════════════════════════════════════════════════════════
//  7. CUACA / WEATHER (wttr.in — free, no API key)
// ═══════════════════════════════════════════════════════════════
async function cuaca(msg, args) {
  const city = args.slice(1).join(' ');
  if (!city) {
    return msg.reply(
      `🌤️ *INFO CUACA*\n\n` +
      `Cara pakai: \`!cuaca [nama kota]\`\n\n` +
      `Contoh:\n` +
      `• \`!cuaca Jakarta\`\n` +
      `• \`!cuaca Bandung\`\n` +
      `• \`!cuaca Surabaya\``
    );
  }

  try {
    const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
      timeout: 10000,
    });

    const current = data.current_condition[0];
    const area = data.nearest_area[0];
    const forecast = data.weather[0];

    const weatherEmoji = {
      Sunny: '☀️', Clear: '🌙', 'Partly cloudy': '⛅', Cloudy: '☁️',
      Overcast: '🌥️', 'Light rain': '🌦️', Rain: '🌧️', 'Heavy rain': '⛈️',
      Thunderstorm: '⛈️', Snow: '❄️', Fog: '🌫️', Mist: '🌫️', Haze: '🌫️',
    };

    const desc = current.weatherDesc[0].value;
    const emoji = weatherEmoji[desc] || '🌡️';

    await msg.reply(
      `🌤️ *INFO CUACA*\n\n` +
      `📍 *${area.areaName[0].value}, ${area.country[0].value}*\n\n` +
      `${emoji} *${desc}*\n\n` +
      `🌡️ Suhu: *${current.temp_C}°C* (Feels like ${current.FeelsLikeC}°C)\n` +
      `💧 Kelembapan: *${current.humidity}%*\n` +
      `💨 Angin: *${current.windspeedKmph} km/h* ${current.winddir16Point}\n` +
      `👁️ Jarak pandang: *${current.visibility} km*\n` +
      `☁️ Tutupan awan: *${current.cloudcover}%*\n` +
      `🌡️ UV Index: *${current.uvIndex}*\n\n` +
      `───────────────\n` +
      `📅 *Prakiraan Hari Ini:*\n` +
      `🔺 Max: ${forecast.maxtempC}°C | 🔻 Min: ${forecast.mintempC}°C\n` +
      `🌅 Matahari terbit: ${forecast.astronomy[0].sunrise}\n` +
      `🌇 Matahari terbenam: ${forecast.astronomy[0].sunset}`
    );
  } catch (err) {
    if (err.response?.status === 404) {
      await msg.reply(`❌ Kota "${city}" tidak ditemukan. Coba nama kota dalam bahasa Inggris.`);
    } else {
      await msg.reply('❌ Gagal mengambil data cuaca. Coba lagi nanti.');
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  8. KBBI (kbbi.kemdikbud.go.id — unofficial API)
// ═══════════════════════════════════════════════════════════════
async function kbbi(msg, args) {
  const kata = args.slice(1).join(' ').toLowerCase();
  if (!kata) {
    return msg.reply(
      `📖 *KBBI — Kamus Besar Bahasa Indonesia*\n\n` +
      `Cara pakai: \`!kbbi [kata]\`\n\n` +
      `Contoh:\n` +
      `• \`!kbbi ambigu\`\n` +
      `• \`!kbbi resiliensi\`\n` +
      `• \`!kbbi paradigma\``
    );
  }

  try {
    const { data } = await axios.get(`https://kbbi-api-zhirrr.vercel.app/api/kbbi?text=${encodeURIComponent(kata)}`, {
      timeout: 10000,
    });

    if (!data || data.status === false || (Array.isArray(data) && data.length === 0)) {
      return msg.reply(`❌ Kata "*${kata}*" tidak ditemukan di KBBI.\nPastikan ejaan sudah benar.`);
    }

    // Handle different API response formats
    let results;
    if (Array.isArray(data)) {
      results = data;
    } else if (data.data) {
      results = Array.isArray(data.data) ? data.data : [data.data];
    } else {
      results = [data];
    }

    let reply = `📖 *KBBI — "${kata}"*\n\n`;

    for (const entry of results.slice(0, 3)) {
      if (entry.lema || entry.word) {
        reply += `📝 *${entry.lema || entry.word}*\n`;
      }
      const meanings = entry.arti || entry.meaning || entry.definitions || [];
      const meaningList = Array.isArray(meanings) ? meanings : [meanings];

      meaningList.forEach((m, i) => {
        const def = typeof m === 'string' ? m : (m.description || m.definition || m.arti || JSON.stringify(m));
        reply += `${i + 1}. ${def}\n`;
      });
      reply += '\n';
    }

    reply += `🔗 _Sumber: KBBI Daring_`;
    await msg.reply(reply);
  } catch (err) {
    // Fallback: try alternative API
    try {
      const { data } = await axios.get(`https://new-kbbi-api.herokuapp.com/cari/${encodeURIComponent(kata)}`, {
        timeout: 10000,
      });

      if (data && data.length > 0) {
        let reply = `📖 *KBBI — "${kata}"*\n\n`;
        for (const entry of data.slice(0, 3)) {
          reply += `📝 *${entry.nama || kata}*\n`;
          (entry.arti || []).forEach((m, i) => {
            reply += `${i + 1}. ${m}\n`;
          });
          reply += '\n';
        }
        reply += `🔗 _Sumber: KBBI Daring_`;
        return msg.reply(reply);
      }
    } catch {}

    await msg.reply(`❌ Tidak bisa mencari kata "${kata}" di KBBI saat ini. Coba lagi nanti.`);
  }
}

// ═══════════════════════════════════════════════════════════════
//  9. URL SHORTENER (TinyURL — free, no API key)
// ═══════════════════════════════════════════════════════════════
async function shortUrl(msg, args) {
  const url = args[1];
  if (!url) {
    return msg.reply(
      `🔗 *URL SHORTENER*\n\n` +
      `Cara pakai: \`!short [url]\`\n\n` +
      `Contoh:\n` +
      `• \`!short https://www.google.com/search?q=test\`\n` +
      `• \`!short https://youtube.com/watch?v=abc123\``
    );
  }

  // Basic URL validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return msg.reply('❌ URL harus dimulai dengan `http://` atau `https://`');
  }

  try {
    const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
      timeout: 10000,
    });

    await msg.reply(
      `🔗 *URL SHORTENER*\n\n` +
      `📎 Original:\n${url}\n\n` +
      `✅ Shortened:\n${data}\n\n` +
      `_Powered by TinyURL_`
    );
  } catch {
    await msg.reply('❌ Gagal mempersingkat URL. Pastikan URL valid dan coba lagi.');
  }
}

// ═══════════════════════════════════════════════════════════════
//  10. NULIS / HANDWRITING GENERATOR
// ═══════════════════════════════════════════════════════════════
async function nulis(msg, args) {
  const text = args.slice(1).join(' ');
  if (!text) {
    return msg.reply(
      `✍️ *NULIS — Tulisan Tangan*\n\n` +
      `Cara pakai: \`!nulis [teks]\`\n\n` +
      `Contoh:\n` +
      `• \`!nulis Halo ini tulisan tangan ku\`\n` +
      `• \`!nulis Surat cinta untuk gebetan\``
    );
  }

  try {
    const { createCanvas } = require('@napi-rs/canvas');

    const lineHeight = 36;
    const padding = 50;
    const maxWidth = 600;
    const fontSize = 22;

    // Word-wrap the text
    const canvas0 = createCanvas(maxWidth, 100);
    const ctx0 = canvas0.getContext('2d');
    ctx0.font = `${fontSize}px "Segoe Script", "Comic Sans MS", cursive`;

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const metrics = ctx0.measureText(testLine);
      if (metrics.width > maxWidth - padding * 2) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Create actual canvas
    const width = maxWidth + padding;
    const height = padding * 2 + lines.length * lineHeight + 20;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Paper background
    ctx.fillStyle = '#FFF8E7';
    ctx.fillRect(0, 0, width, height);

    // Paper lines
    ctx.strokeStyle = '#B0C4DE';
    ctx.lineWidth = 0.5;
    for (let y = padding; y < height - 20; y += lineHeight) {
      ctx.beginPath();
      ctx.moveTo(40, y + lineHeight - 5);
      ctx.lineTo(width - 20, y + lineHeight - 5);
      ctx.stroke();
    }

    // Red margin line
    ctx.strokeStyle = '#FFB6C1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding - 10, 0);
    ctx.lineTo(padding - 10, height);
    ctx.stroke();

    // Write text
    ctx.fillStyle = '#1a1a6e';
    ctx.font = `${fontSize}px "Segoe Script", "Comic Sans MS", cursive`;

    lines.forEach((line, i) => {
      const y = padding + (i + 1) * lineHeight - 10;
      // Slight random offset for handwriting feel
      const offsetX = Math.random() * 3 - 1.5;
      const offsetY = Math.random() * 2 - 1;
      ctx.fillText(line, padding + offsetX, y + offsetY);
    });

    // Small signature
    ctx.fillStyle = '#999';
    ctx.font = '11px Arial';
    ctx.fillText('✍️ WA-BOT Nulis', width - 120, height - 10);

    const buffer = canvas.toBuffer('image/png');
    const base64 = buffer.toString('base64');
    const media = new MessageMedia('image/png', base64, 'tulisan.png');

    await msg.reply(media, undefined, {
      caption: `✍️ *Tulisan Tangan*\n_"${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"_`,
    });
  } catch (err) {
    await msg.reply('❌ Gagal membuat tulisan: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  11. SW GRUP — Post story di tab Status atas nama grup
//  Kirim media ke status@broadcast + group JID mention
//  Hasilnya: muncul di tab Status sebagai "story grup"
// ═══════════════════════════════════════════════════════════════
async function postStatus(client, msg, args) {
  const chat = await msg.getChat();

  if (!chat.isGroup) {
    return msg.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!');
  }

  const text = args.slice(1).join(' ');
  const quotedMsg = await msg.getQuotedMessage?.();

  // Cek media (reply ke gambar/video atau kirim langsung)
  const mediaMsg = quotedMsg?.hasMedia ? quotedMsg : (msg.hasMedia ? msg : null);

  if (!mediaMsg && !text) {
    return msg.reply(
      `📱 *SW GRUP — Story Grup*\n\n` +
      `Post story/status yang muncul di tab Status atas nama grup!\n\n` +
      `*Cara pakai:*\n` +
      `• Kirim gambar + caption \`!sw\`\n` +
      `• Reply gambar/video + \`!sw\`\n` +
      `• Reply gambar + \`!sw [caption]\`\n\n` +
      `📌 Hasilnya muncul di tab *Status/Updates* WhatsApp sebagai story grup`
    );
  }

  try {
    const groupId = chat.id._serialized;
    const groupName = chat.name;

    if (mediaMsg) {
      const media = await mediaMsg.downloadMedia();
      if (!media || !media.data) {
        return msg.reply('❌ Gagal download media.');
      }

      // Kirim ke status@broadcast dengan group mention
      // groupMentions membuat status muncul sebagai "story grup"
      await client.sendMessage('status@broadcast', media, {
        caption: text || '',
        groupMentions: [{
          groupSubject: groupName,
          groupJid: groupId,
        }],
      });
    } else {
      // Status teks dengan group mention
      await client.sendMessage('status@broadcast', text, {
        groupMentions: [{
          groupSubject: groupName,
          groupJid: groupId,
        }],
      });
    }

    await msg.reply(
      `✅ *Berhasil memposting story di grup!*\n\n` +
      `📱 Cek tab *Status/Updates* WhatsApp untuk melihat hasilnya.`
    );
  } catch (err) {
    console.error('SW Grup error:', err);
    await msg.reply('❌ Gagal posting story: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════
module.exports = {
  generateQR,
  remind,
  randomPick,
  poll,
  textEffect,
  countdown,
  cuaca,
  kbbi,
  shortUrl,
  nulis,
  postStatus,
};
