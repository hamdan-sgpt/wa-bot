const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

// ═══════════════════════════════════════════════════════════════
//  1. TRANSLATE (!tr)  —  MyMemory API (free, no key)
// ═══════════════════════════════════════════════════════════════
async function translate(msg, args) {
  const lang = args[1]?.toLowerCase();
  const text = args.slice(2).join(' ');

  const langNames = {
    en: '🇬🇧 English', ja: '🇯🇵 日本語', ko: '🇰🇷 한국어', zh: '🇨🇳 中文',
    ar: '🇸🇦 العربية', fr: '🇫🇷 Français', de: '🇩🇪 Deutsch', es: '🇪🇸 Español',
    id: '🇮🇩 Indonesia', pt: '🇧🇷 Português', ru: '🇷🇺 Русский', th: '🇹🇭 ไทย',
    vi: '🇻🇳 Tiếng Việt', hi: '🇮🇳 हिन्दी', tr: '🇹🇷 Türkçe', it: '🇮🇹 Italiano',
    ms: '🇲🇾 Melayu', nl: '🇳🇱 Nederlands', pl: '🇵🇱 Polski', sv: '🇸🇪 Svenska',
  };

  if (!lang || !text) {
    const codes = Object.entries(langNames).map(([k, v]) => `\`${k}\` ${v}`).join(', ');
    return msg.reply(
      `🌐 *TRANSLATE*\n\n` +
      `Cara pakai: \`!tr [kode bahasa] [teks]\`\n\n` +
      `Contoh:\n` +
      `• \`!tr en Halo apa kabar\`\n` +
      `• \`!tr ja Selamat pagi\`\n` +
      `• \`!tr ko Aku suka kamu\`\n\n` +
      `Kode bahasa: ${codes}`
    );
  }

  try {
    const { data } = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`,
      { timeout: 10000 }
    );
    const result = data.responseData?.translatedText;
    if (!result) throw new Error('Gagal translate');

    await msg.reply(
      `🌐 *TRANSLATE*\n\n` +
      `📝 Original:\n_${text}_\n\n` +
      `🔄 ${langNames[lang] || lang.toUpperCase()}:\n*${result}*`
    );
  } catch (err) {
    await msg.reply('❌ Gagal translate: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  2. LIRIK LAGU (!lirik)  —  Lyrist API (free, no key)
// ═══════════════════════════════════════════════════════════════
async function lirik(msg, args) {
  const query = args.slice(1).join(' ');
  if (!query) {
    return msg.reply(
      `🎵 *LIRIK LAGU*\n\n` +
      `Cara pakai: \`!lirik [judul lagu]\`\n\n` +
      `Contoh:\n` +
      `• \`!lirik Someone Like You\`\n` +
      `• \`!lirik Bohemian Rhapsody\`\n` +
      `• \`!lirik Seperti Kisah\``
    );
  }

  await msg.reply('🔍 Mencari lirik...');

  try {
    const { data } = await axios.get(
      `https://lyrist.vercel.app/api/${encodeURIComponent(query)}`,
      { timeout: 15000 }
    );
    if (!data || !data.lyrics) throw new Error('not found');

    const lyrics = data.lyrics.length > 4000
      ? data.lyrics.substring(0, 4000) + '\n\n... _(terpotong)_'
      : data.lyrics;

    await msg.reply(
      `🎵 *${data.title || query}*\n` +
      `🎤 *${data.artist || 'Unknown'}*\n\n` +
      `${lyrics}\n\n` +
      `_Powered by Lyrist_`
    );
  } catch {
    await msg.reply('❌ Lirik tidak ditemukan untuk: _' + query + '_');
  }
}

// ═══════════════════════════════════════════════════════════════
//  3. WIKIPEDIA (!wiki)  —  Wikipedia REST API (free)
// ═══════════════════════════════════════════════════════════════
async function wiki(msg, args) {
  const query = args.slice(1).join(' ');
  if (!query) {
    return msg.reply(
      `📚 *WIKIPEDIA*\n\n` +
      `Cara pakai: \`!wiki [topik]\`\n\n` +
      `Contoh:\n` +
      `• \`!wiki Indonesia\`\n` +
      `• \`!wiki Albert Einstein\`\n` +
      `• \`!wiki Candi Borobudur\``
    );
  }

  try {
    let data;
    try {
      const res = await axios.get(
        `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
        { timeout: 10000 }
      );
      data = res.data;
    } catch {
      const res = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
        { timeout: 10000 }
      );
      data = res.data;
    }

    if (!data || data.type === 'not_found' || !data.extract) throw new Error('not found');

    const extract = data.extract.length > 2000
      ? data.extract.substring(0, 2000) + '...'
      : data.extract;

    const reply =
      `📚 *WIKIPEDIA*\n\n` +
      `📖 *${data.title}*\n\n` +
      `${extract}\n\n` +
      (data.content_urls?.desktop?.page ? `🔗 ${data.content_urls.desktop.page}\n\n` : '') +
      `_Sumber: Wikipedia_`;

    if (data.thumbnail?.source) {
      try {
        const imgRes = await axios.get(data.thumbnail.source, { responseType: 'arraybuffer', timeout: 10000 });
        const media = new MessageMedia('image/jpeg', Buffer.from(imgRes.data).toString('base64'), 'wiki.jpg');
        return msg.reply(media, undefined, { caption: reply });
      } catch {} // fallback to text
    }

    await msg.reply(reply);
  } catch {
    await msg.reply('❌ Artikel tidak ditemukan untuk: _' + query + '_');
  }
}

// ═══════════════════════════════════════════════════════════════
//  4. SCREENSHOT WEBSITE (!ss)  —  thum.io (free, no key)
// ═══════════════════════════════════════════════════════════════
async function screenshot(msg, args) {
  const url = args[1];
  if (!url) {
    return msg.reply(
      `📸 *SCREENSHOT WEBSITE*\n\n` +
      `Cara pakai: \`!ss [url]\`\n\n` +
      `Contoh:\n` +
      `• \`!ss https://google.com\`\n` +
      `• \`!ss https://github.com\`\n` +
      `• \`!ss https://detik.com\``
    );
  }

  const target = url.startsWith('http') ? url : `https://${url}`;
  await msg.reply('📸 Sedang mengambil screenshot...');

  try {
    const screenshotUrl = `https://image.thum.io/get/width/1280/crop/900/${target}`;
    const { data } = await axios.get(screenshotUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const media = new MessageMedia('image/png', Buffer.from(data).toString('base64'), 'screenshot.png');
    await msg.reply(media, undefined, {
      caption: `📸 *SCREENSHOT*\n\n🌐 ${target}`,
    });
  } catch (err) {
    await msg.reply('❌ Gagal screenshot: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  5. QUOTELY (!quotely)  —  Canvas quote image
// ═══════════════════════════════════════════════════════════════
async function quotely(msg) {
  const quoted = await msg.getQuotedMessage?.();
  if (!quoted || !quoted.body) {
    return msg.reply(
      `💬 *QUOTELY — Quote Image*\n\n` +
      `Cara pakai: Reply ke pesan + ketik \`!quotely\`\n\n` +
      `Bot akan membuat gambar quote yang estetik dari pesan tersebut!`
    );
  }

  try {
    const { createCanvas } = require('@napi-rs/canvas');
    const contact = await quoted.getContact();
    const name = contact.pushname || contact.name || contact.id.user;
    const text = quoted.body;

    const width = 700;
    const padding = 50;
    const fontSize = 22;
    const lineHeight = 34;

    // Word wrap
    const tmp = createCanvas(width, 100);
    const tmpCtx = tmp.getContext('2d');
    tmpCtx.font = `italic ${fontSize}px Georgia, serif`;

    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (tmpCtx.measureText(test).width > width - padding * 2 - 40) {
        if (cur) lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);

    const height = Math.max(280, padding * 2 + lines.length * lineHeight + 120);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative corner circles
    ctx.globalAlpha = 0.06;
    ctx.beginPath(); ctx.arc(60, 60, 100, 0, Math.PI * 2); ctx.fillStyle = '#e94560'; ctx.fill();
    ctx.beginPath(); ctx.arc(width - 60, height - 60, 80, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Opening quote mark
    ctx.fillStyle = 'rgba(233, 69, 96, 0.4)';
    ctx.font = 'bold 120px Georgia, serif';
    ctx.fillText('\u201C', padding - 15, padding + 85);

    // Quote text
    ctx.fillStyle = '#eeeeee';
    ctx.font = `italic ${fontSize}px Georgia, serif`;
    lines.forEach((line, i) => {
      ctx.fillText(line, padding + 35, padding + 55 + i * lineHeight);
    });

    // Closing quote mark
    ctx.fillStyle = 'rgba(233, 69, 96, 0.4)';
    ctx.font = 'bold 80px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('\u201D', width - padding + 10, height - padding - 40);
    ctx.textAlign = 'left';

    // Divider line
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding + 35, height - padding - 30);
    ctx.lineTo(padding + 150, height - padding - 30);
    ctx.stroke();

    // Author
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(`— ${name}`, padding + 35, height - padding - 5);

    // Bottom accent bar
    ctx.fillStyle = '#e94560';
    ctx.fillRect(0, height - 5, width, 5);

    const buffer = canvas.toBuffer('image/png');
    const media = new MessageMedia('image/png', buffer.toString('base64'), 'quote.png');
    await msg.reply(media, undefined, {
      caption: `💬 *Quote by ${name}*`,
    });
  } catch (err) {
    await msg.reply('❌ Gagal buat quote: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  6. FANCY FONT (!font)  —  Unicode math symbol conversion
// ═══════════════════════════════════════════════════════════════
const fontOffsets = {
  bold:       { name: '𝐁𝐨𝐥𝐝', upper: 0x1D400, lower: 0x1D41A, digit: 0x1D7CE },
  italic:     { name: '𝐼𝑡𝑎𝑙𝑖𝑐', upper: 0x1D434, lower: 0x1D44E },
  bolditalic: { name: '𝑩𝒐𝒍𝒅𝑰𝒕𝒂𝒍𝒊𝒄', upper: 0x1D468, lower: 0x1D482 },
  sans:       { name: '𝖲𝖺𝗇𝗌', upper: 0x1D5A0, lower: 0x1D5BA, digit: 0x1D7E2 },
  sansbold:   { name: '𝗦𝗮𝗻𝘀𝗕𝗼𝗹𝗱', upper: 0x1D5D4, lower: 0x1D5EE, digit: 0x1D7EC },
  mono:       { name: '𝙼𝚘𝚗𝚘', upper: 0x1D670, lower: 0x1D68A, digit: 0x1D7F6 },
  cursive:    { name: '𝒞𝓊𝓇𝓈𝒾𝓋𝑒', upper: 0x1D49C, lower: 0x1D4B6 },
  fraktur:    { name: '𝔉𝔯𝔞𝔨𝔱𝔲𝔯', upper: 0x1D504, lower: 0x1D51E },
  double:     { name: '𝔻𝕠𝕦𝕓𝕝𝕖', upper: 0x1D538, lower: 0x1D552, digit: 0x1D7D8 },
  circled:    { name: 'Ⓒⓘⓡⓒⓛⓔⓓ', fn: 'circled' },
};

function convertFont(text, style) {
  const s = fontOffsets[style];
  if (!s) return text;

  if (s.fn === 'circled') {
    let res = '';
    for (const ch of text) {
      const c = ch.codePointAt(0);
      if (c >= 0x41 && c <= 0x5A) res += String.fromCodePoint(0x24B6 + (c - 0x41));
      else if (c >= 0x61 && c <= 0x7A) res += String.fromCodePoint(0x24D0 + (c - 0x61));
      else if (c >= 0x30 && c <= 0x39) res += c === 0x30 ? '⓪' : String.fromCodePoint(0x2460 + (c - 0x31));
      else res += ch;
    }
    return res;
  }

  let res = '';
  for (const ch of text) {
    const c = ch.codePointAt(0);
    if (c >= 0x41 && c <= 0x5A && s.upper) res += String.fromCodePoint(s.upper + (c - 0x41));
    else if (c >= 0x61 && c <= 0x7A && s.lower) res += String.fromCodePoint(s.lower + (c - 0x61));
    else if (c >= 0x30 && c <= 0x39 && s.digit) res += String.fromCodePoint(s.digit + (c - 0x30));
    else res += ch;
  }
  return res;
}

async function fancyFont(msg, args) {
  const style = args[1]?.toLowerCase();
  const text = args.slice(2).join(' ');

  if (!style || !fontOffsets[style] || !text) {
    const list = Object.entries(fontOffsets).map(([k, v]) => `• \`${k}\` → ${v.name}`).join('\n');
    return msg.reply(
      `🔤 *FANCY FONT*\n\n` +
      `Cara pakai: \`!font [style] [teks]\`\n\n` +
      `Style tersedia:\n${list}\n\n` +
      `Contoh: \`!font bold Halo Dunia\``
    );
  }

  const result = convertFont(text, style);
  await msg.reply(`🔤 *${style.toUpperCase()}*\n\n${result}`);
}

// ═══════════════════════════════════════════════════════════════
//  7. URBAN DICTIONARY (!urban)  —  free API, no key
// ═══════════════════════════════════════════════════════════════
async function urban(msg, args) {
  const word = args.slice(1).join(' ');
  if (!word) {
    return msg.reply(
      `📖 *URBAN DICTIONARY*\n\n` +
      `Cara pakai: \`!urban [kata]\`\n\n` +
      `Contoh:\n` +
      `• \`!urban slay\`\n` +
      `• \`!urban ghosting\`\n` +
      `• \`!urban no cap\``
    );
  }

  try {
    const { data } = await axios.get(
      `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`,
      { timeout: 10000 }
    );

    if (!data.list || data.list.length === 0) {
      return msg.reply(`❌ Kata "_${word}_" tidak ditemukan di Urban Dictionary.`);
    }

    const entry = data.list[0];
    const def = entry.definition.replace(/\[|\]/g, '').substring(0, 1500);
    const example = entry.example?.replace(/\[|\]/g, '').substring(0, 500);

    let reply =
      `📖 *URBAN DICTIONARY*\n\n` +
      `📝 *${entry.word}*\n\n` +
      `📖 *Definition:*\n${def}\n`;

    if (example) {
      reply += `\n💭 *Example:*\n_${example}_\n`;
    }

    reply += `\n👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down}`;

    await msg.reply(reply);
  } catch (err) {
    await msg.reply('❌ Gagal mencari: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  8. GITHUB PROFILE (!github)  —  GitHub API (free, no key)
// ═══════════════════════════════════════════════════════════════
async function githubProfile(msg, args) {
  const username = args[1];
  if (!username) {
    return msg.reply(
      `🐙 *GITHUB PROFILE*\n\n` +
      `Cara pakai: \`!github [username]\`\n\n` +
      `Contoh:\n` +
      `• \`!github torvalds\`\n` +
      `• \`!github vercel\``
    );
  }

  try {
    const { data } = await axios.get(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      { timeout: 10000 }
    );

    const created = new Date(data.created_at).toLocaleDateString('id-ID');

    const reply =
      `🐙 *GITHUB PROFILE*\n\n` +
      `👤 *${data.name || data.login}*\n` +
      `📛 @${data.login}\n` +
      (data.bio ? `📝 _${data.bio}_\n` : '') +
      `\n` +
      `📦 Repos: *${data.public_repos}*\n` +
      `⭐ Gists: *${data.public_gists}*\n` +
      `👥 Followers: *${data.followers}*\n` +
      `👤 Following: *${data.following}*\n` +
      (data.company ? `🏢 ${data.company}\n` : '') +
      (data.location ? `📍 ${data.location}\n` : '') +
      (data.blog ? `🔗 ${data.blog}\n` : '') +
      `\n📅 Joined: ${created}\n` +
      `🔗 github.com/${data.login}`;

    // Send with avatar
    try {
      const avatarRes = await axios.get(data.avatar_url, { responseType: 'arraybuffer', timeout: 10000 });
      const media = new MessageMedia('image/jpeg', Buffer.from(avatarRes.data).toString('base64'), 'github.jpg');
      return msg.reply(media, undefined, { caption: reply });
    } catch {} // fallback

    await msg.reply(reply);
  } catch (err) {
    if (err.response?.status === 404) {
      await msg.reply(`❌ User "_${username}_" tidak ditemukan di GitHub.`);
    } else {
      await msg.reply('❌ Gagal: ' + err.message);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  9. RAMALAN ZODIAK (!ramalan)  —  Horoscope API (free)
// ═══════════════════════════════════════════════════════════════
const zodiacSigns = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
  leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
  sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

async function ramalan(msg, args) {
  const sign = args[1]?.toLowerCase();

  if (!sign || !zodiacSigns[sign]) {
    const list = Object.entries(zodiacSigns).map(([k, v]) => `${v} \`${k}\``).join('  ');
    return msg.reply(
      `🔮 *RAMALAN ZODIAK*\n\n` +
      `Cara pakai: \`!ramalan [zodiak]\`\n\n` +
      `Zodiak:\n${list}\n\n` +
      `Contoh: \`!ramalan leo\``
    );
  }

  try {
    const { data } = await axios.get(
      `https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${sign}&day=TODAY`,
      { timeout: 10000 }
    );

    if (!data?.data?.horoscope_data) throw new Error('not found');

    await msg.reply(
      `🔮 *RAMALAN ${sign.toUpperCase()}* ${zodiacSigns[sign]}\n\n` +
      `📅 ${data.data.date || 'Hari Ini'}\n\n` +
      `${data.data.horoscope_data}\n\n` +
      `_✨ Daily Horoscope_`
    );
  } catch {
    // Fallback: generated horoscope
    const fortunes = [
      'Hari ini energimu sedang tinggi! Manfaatkan untuk menyelesaikan tugas penting.',
      'Berhati-hatilah dalam keputusan finansial hari ini. Pikir dua kali sebelum belanja.',
      'Cinta datang dari arah yang tidak terduga. Buka hatimu untuk peluang baru.',
      'Kesehatan perlu diperhatikan. Jangan lupa minum air putih dan istirahat cukup.',
      'Peluang karier besar sedang menanti! Jangan ragu untuk menunjukkan kemampuanmu.',
      'Hari yang baik untuk merencanakan masa depan. Buatlah goals baru untuk minggu ini.',
      'Jalin komunikasi yang baik dengan orang terdekatmu. Ada sesuatu yang perlu dibicarakan.',
      'Kreativitasmu sedang tinggi! Ini waktu yang tepat untuk memulai proyek baru.',
      'Bintang-bintang menunjukkan perubahan positif akan datang dalam waktu dekat.',
      'Waktu yang tepat untuk introspeksi. Evaluasi pencapaianmu dan buat perbaikan.',
    ];
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];

    await msg.reply(
      `🔮 *RAMALAN ${sign.toUpperCase()}* ${zodiacSigns[sign]}\n\n` +
      `📅 Hari Ini\n\n` +
      `${fortune}\n\n` +
      `_✨ Daily Horoscope_`
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  10. COLOR INFO (!color)  —  Canvas color card
// ═══════════════════════════════════════════════════════════════
async function colorCard(msg, args) {
  const hex = args[1]?.replace('#', '');

  if (!hex || !/^[0-9a-fA-F]{3,6}$/.test(hex)) {
    return msg.reply(
      `🎨 *COLOR INFO*\n\n` +
      `Cara pakai: \`!color [hex]\`\n\n` +
      `Contoh:\n` +
      `• \`!color FF5733\`\n` +
      `• \`!color #4ecdc4\`\n` +
      `• \`!color 1a1a2e\``
    );
  }

  // Expand 3-char hex → 6-char
  const fullHex = hex.length === 3
    ? hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
    : hex.padEnd(6, '0');

  try {
    const { createCanvas } = require('@napi-rs/canvas');

    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);

    // HSL conversion
    const rn = r/255, gn = g/255, bn = b/255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      else if (max === gn) h = ((bn - rn) / d + 2) / 6;
      else h = ((rn - gn) / d + 4) / 6;
    }

    const width = 500, height = 320;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Main color swatch
    ctx.fillStyle = `#${fullHex}`;
    ctx.fillRect(0, 0, width, 190);

    // Color name on swatch
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    ctx.fillStyle = brightness > 128 ? '#000000' : '#ffffff';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${fullHex.toUpperCase()}`, width / 2, 105);
    ctx.textAlign = 'left';

    // Info panel
    const panelGrad = ctx.createLinearGradient(0, 190, 0, height);
    panelGrad.addColorStop(0, '#1a1a2e');
    panelGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = panelGrad;
    ctx.fillRect(0, 190, width, 130);

    // Color variations (lighter & darker shades)
    const shades = [-40, -20, 0, 20, 40];
    const swatchW = width / shades.length;
    shades.forEach((offset, i) => {
      const sr = Math.min(255, Math.max(0, r + offset));
      const sg = Math.min(255, Math.max(0, g + offset));
      const sb = Math.min(255, Math.max(0, b + offset));
      ctx.fillStyle = `rgb(${sr},${sg},${sb})`;
      ctx.fillRect(i * swatchW, 190, swatchW, 25);
    });

    // Text info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(`HEX`, 20, 245);
    ctx.fillText(`RGB`, 20, 275);
    ctx.fillText(`HSL`, 20, 305);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText(`#${fullHex.toUpperCase()}`, 75, 245);
    ctx.fillText(`${r}, ${g}, ${b}`, 75, 275);
    ctx.fillText(`${Math.round(h*360)}°, ${Math.round(s*100)}%, ${Math.round(l*100)}%`, 75, 305);

    // Brightness indicator
    ctx.fillStyle = brightness > 128 ? '#4ecdc4' : '#e94560';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(brightness > 128 ? '☀️ LIGHT' : '🌙 DARK', width - 20, 245);
    ctx.fillText(`Brightness: ${Math.round(brightness)}`, width - 20, 270);
    ctx.textAlign = 'left';

    const buffer = canvas.toBuffer('image/png');
    const media = new MessageMedia('image/png', buffer.toString('base64'), 'color.png');

    await msg.reply(media, undefined, {
      caption:
        `🎨 *COLOR INFO*\n\n` +
        `🏷️ HEX: \`#${fullHex.toUpperCase()}\`\n` +
        `🔴 RGB: \`${r}, ${g}, ${b}\`\n` +
        `🎯 HSL: \`${Math.round(h*360)}°, ${Math.round(s*100)}%, ${Math.round(l*100)}%\`\n` +
        `💡 Type: ${brightness > 128 ? 'Light ☀️' : 'Dark 🌙'}`,
    });
  } catch (err) {
    await msg.reply('❌ Gagal buat color card: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════
module.exports = {
  translate,
  lirik,
  wiki,
  screenshot,
  quotely,
  fancyFont,
  urban,
  githubProfile,
  ramalan,
  colorCard,
};
