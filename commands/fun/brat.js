const { createCanvas } = require('@napi-rs/canvas');
const { MessageMedia } = require('whatsapp-web.js');

// ===== BRAT CONFIG (persis bratgenerator.com - white bg) =====
const SIZE      = 512;
const BG_COLOR  = '#FFFFFF'; // putih (sesuai permintaan user)
const TXT_COLOR = '#000000'; // hitam
const PADDING   = 30;        // padding minimal, teks hampir penuhi kanvas
const MAX_W     = SIZE - PADDING * 2;
const BLUR_PX   = 2;         // blur ringan khas brat
const MAX_FONT  = 180;       // font besar untuk teks pendek
const MIN_FONT  = 18;

/**
 * Word-wrap teks supaya muat di dalam kanvas
 */
function wrapText(ctx, words, maxWidth) {
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Cari ukuran font terbesar yang masih muat
 * (bratgenerator.com: teks selalu sebesar mungkin memenuhi kotak)
 */
function fitFontSize(ctx, words, maxW, maxH) {
  for (let size = MAX_FONT; size >= MIN_FONT; size -= 2) {
    // Arial Narrow / condensed, non-bold — persis bratgenerator.com
    ctx.font = `${size}px "Arial Narrow", "Arial", sans-serif`;
    const lines    = wrapText(ctx, words, maxW);
    const lineH    = size * 1.1;
    const totalH   = lines.length * lineH;
    const maxLineW = Math.max(...lines.map(l => ctx.measureText(l).width));
    if (totalH <= maxH && maxLineW <= maxW) {
      return { size, lines, lineH };
    }
  }
  // fallback
  const size  = MIN_FONT;
  ctx.font    = `${size}px "Arial Narrow", "Arial", sans-serif`;
  const lines = wrapText(ctx, words, maxW);
  return { size, lines, lineH: size * 1.1 };
}

async function bratSticker(msg, args) {
  const rawText = args.slice(1).join(' ').trim();
  if (!rawText) {
    return msg.reply(
      '❌ *Format salah!*\n\n' +
      'Gunakan: `!brat [teks]`\n' +
      'Contoh: `!brat damn...`\n' +
      'Contoh: `!brat we should do this again sometime`'
    );
  }

  try {
    const text  = rawText.toLowerCase();
    const words = text.split(/\s+/);

    const canvas = createCanvas(SIZE, SIZE);
    const ctx    = canvas.getContext('2d');

    // ── Background putih ──
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // ── Cari ukuran font optimum ──
    const maxTextH = SIZE - PADDING * 2;
    const { size, lines, lineH } = fitFontSize(ctx, words, MAX_W, maxTextH);

    // Font: non-bold, condensed — khas bratgenerator.com
    ctx.font         = `${size}px "Arial Narrow", "Arial", sans-serif`;
    ctx.fillStyle    = TXT_COLOR;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // ── Blur khas brat ──
    ctx.filter = `blur(${BLUR_PX}px)`;

    // ── Gambar tiap baris, vertikal center ──
    const totalH = lines.length * lineH;
    const startY = (SIZE - totalH) / 2 + lineH / 2;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], SIZE / 2, startY + i * lineH);
    }

    ctx.filter = 'none';

    // ── Encode & kirim sebagai sticker ──
    const base64 = canvas.toBuffer('image/png').toString('base64');
    const media  = new MessageMedia('image/png', base64, 'brat.png');
    const chat   = await msg.getChat();

    await chat.sendMessage(media, { sendMediaAsSticker: true });

  } catch (err) {
    console.error('Brat sticker error:', err.message);
    await msg.reply('❌ Gagal membuat brat sticker: ' + err.message);
  }
}

module.exports = { bratSticker };
