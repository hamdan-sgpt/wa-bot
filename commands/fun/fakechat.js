const { MessageMedia } = require('whatsapp-web.js');

// ═══════════════════════════════════════════════════════════════
//  FAKE iPHONE CHAT GENERATOR
//  Bikin screenshot chat gaya iPhone WhatsApp (Dark Mode)
//  Lengkap: emoji reactions, context menu, bubble, blur bg
// ═══════════════════════════════════════════════════════════════

/**
 * Command: !fakechat [teks]
 * Generate fake iPhone WhatsApp chat screenshot
 *
 * Format advanced:
 *   !fakechat [nama pengirim] | [teks chat] | [waktu]
 *   !fakechat Budi | Halo apa kabar? | 19:23
 *
 * Format simple:
 *   !fakechat Halo apa kabar?
 */
async function fakeChat(msg, args) {
  const input = args.slice(1).join(' ');

  if (!input) {
    return msg.reply(
      `📱 *FAKE iPHONE CHAT*\n\n` +
      `Bikin screenshot chat WhatsApp gaya iPhone! 🍎\n\n` +
      `*Format:*\n` +
      `\`!fakechat [teks]\`\n` +
      `\`!fakechat [nama] | [teks] | [waktu]\`\n\n` +
      `*Contoh:*\n` +
      `\`!fakechat Di sana pusing pacaran, di sini pusing codingan.\`\n` +
      `\`!fakechat Budi | Besok jadi gak? | 21:30\`\n` +
      `\`!fakechat Sayang ❤️ | I love you moreee | 03:14\``
    );
  }

  await msg.reply('⏳ Generating iPhone chat screenshot...');

  try {
    const { createCanvas } = require('@napi-rs/canvas');

    // ── Parse Input ──
    const parts = input.split('|').map(s => s.trim());
    let senderName, chatText, timeStr;

    if (parts.length >= 3) {
      senderName = parts[0];
      chatText = parts[1];
      timeStr = parts[2];
    } else if (parts.length === 2) {
      senderName = parts[0];
      chatText = parts[1];
      timeStr = new Date().toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false,
      });
    } else {
      const contact = await msg.getContact();
      senderName = contact.pushname || contact.name || contact.id.user;
      chatText = input;
      timeStr = new Date().toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false,
      });
    }

    // ── Canvas Setup ──
    const WIDTH = 430;
    const PADDING = 20;
    const maxTextWidth = WIDTH - 80; // bubble text area

    // Pre-measure text to determine canvas height
    const tempCanvas = createCanvas(WIDTH, 100);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = '17px Arial';

    // Word-wrap the text
    const lines = wrapText(tempCtx, chatText, maxTextWidth);
    const lineHeight = 24;
    const textBlockHeight = lines.length * lineHeight;

    // Calculate component heights
    const blurBgTop = 0;
    const reactionsY = 60;       // emoji reactions row
    const reactionsH = 55;
    const bubbleY = reactionsY + reactionsH + 10; // bubble chat
    const bubblePadH = 14;
    const bubbleTextH = textBlockHeight + 30; // text + timestamp row
    const bubbleH = bubblePadH * 2 + bubbleTextH;
    const menuY = bubbleY + bubbleH + 12; // context menu
    const menuItemH = 50;
    const menuItems = [
      { icon: '⭐', label: 'Beri Bintang' },
      { icon: '↩️', label: 'Balas' },
      { icon: '➡️', label: 'Teruskan' },
      { icon: '📋', label: 'Salin' },
      { icon: '💬', label: 'Ucapkan' },
      { icon: '⚠️', label: 'Laporkan' },
    ];
    const menuH = menuItems.length * menuItemH + 50; // +50 for Hapus button
    const totalH = menuY + menuH + 30;

    // Create actual canvas
    const canvas = createCanvas(WIDTH, totalH);
    const ctx = canvas.getContext('2d');

    // ── Background: Dark blurred WhatsApp ──
    // Dark background
    ctx.fillStyle = '#0b141a';
    ctx.fillRect(0, 0, WIDTH, totalH);

    // Subtle pattern overlay (simulating blurred chat background)
    ctx.globalAlpha = 0.03;
    for (let y = 0; y < totalH; y += 30) {
      for (let x = 0; x < WIDTH; x += 30) {
        ctx.fillStyle = Math.random() > 0.5 ? '#1a2e38' : '#0d1f2d';
        ctx.fillRect(x, y, 30, 30);
      }
    }
    ctx.globalAlpha = 1;

    // Dim overlay (blur effect simulation)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, WIDTH, totalH);

    // ── Emoji Reactions Row ──
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
    const emojiSize = 38;
    const emojiGap = 8;
    const totalEmojiW = emojis.length * (emojiSize + emojiGap) - emojiGap;
    const emojiStartX = (WIDTH - totalEmojiW) / 2;

    // Reactions container (rounded pill)
    const reactPillW = totalEmojiW + 30;
    const reactPillH = 48;
    const reactPillX = (WIDTH - reactPillW) / 2;
    const reactPillY = reactionsY;

    ctx.fillStyle = '#233239';
    ctx.beginPath();
    ctx.roundRect(reactPillX, reactPillY, reactPillW, reactPillH, 24);
    ctx.fill();

    // Draw emojis
    ctx.font = '26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < emojis.length; i++) {
      const x = emojiStartX + i * (emojiSize + emojiGap) + emojiSize / 2;
      const y = reactPillY + reactPillH / 2;
      ctx.fillText(emojis[i], x, y);
    }

    // ── Chat Bubble ──
    const bubbleX = 20;
    const bubbleW = Math.min(maxTextWidth + 40, WIDTH - 40);

    // Bubble background
    ctx.fillStyle = '#005c4b';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 12);
    ctx.fill();

    // Bubble tail (small triangle on right)
    ctx.fillStyle = '#005c4b';
    ctx.beginPath();
    ctx.moveTo(bubbleX + bubbleW, bubbleY + 8);
    ctx.lineTo(bubbleX + bubbleW + 10, bubbleY + 4);
    ctx.lineTo(bubbleX + bubbleW, bubbleY + 18);
    ctx.closePath();
    ctx.fill();

    // Chat text
    ctx.fillStyle = '#e9edef';
    ctx.font = '17px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], bubbleX + 14, bubbleY + bubblePadH + i * lineHeight);
    }

    // Timestamp + double check (✓✓)
    const tsY = bubbleY + bubblePadH + textBlockHeight + 6;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, bubbleX + bubbleW - 14, tsY);

    // Double check mark
    const checkX = bubbleX + bubbleW - 14 - ctx.measureText(timeStr).width - 8;
    ctx.fillStyle = '#53bdeb';
    ctx.font = '12px Arial';
    ctx.fillText('✓✓', checkX, tsY);

    // ── Context Menu ──
    const menuX = 20;
    const menuW = WIDTH - 40;
    const menuRadius = 14;

    // Menu background
    ctx.fillStyle = '#233138';
    ctx.beginPath();
    ctx.roundRect(menuX, menuY, menuW, menuItems.length * menuItemH, menuRadius);
    ctx.fill();

    // Menu items
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < menuItems.length; i++) {
      const itemY = menuY + i * menuItemH;

      // Separator line (except first)
      if (i > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(menuX + 58, itemY);
        ctx.lineTo(menuX + menuW - 16, itemY);
        ctx.stroke();
      }

      // Icon (right side, like iPhone)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '20px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(menuItems[i].icon, menuX + menuW - 20, itemY + menuItemH / 2);

      // Label
      ctx.fillStyle = '#e9edef';
      ctx.font = '16.5px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(menuItems[i].label, menuX + 20, itemY + menuItemH / 2);
    }

    // ── "Hapus" button (red, separated) ──
    const hapusY = menuY + menuItems.length * menuItemH + 10;
    const hapusH = 48;

    ctx.fillStyle = '#233138';
    ctx.beginPath();
    ctx.roundRect(menuX, hapusY, menuW, hapusH, menuRadius);
    ctx.fill();

    // Trash icon
    ctx.fillStyle = '#ef4444';
    ctx.font = '18px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('🗑️', menuX + menuW - 20, hapusY + hapusH / 2);

    // "Hapus" text
    ctx.fillStyle = '#ef4444';
    ctx.font = '16.5px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Hapus', menuX + 20, hapusY + hapusH / 2);

    // ── Timestamp watermark at bottom ──
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('00:0', WIDTH - 30, hapusY + hapusH - 5);

    // ── Export ──
    const buffer = canvas.toBuffer('image/png');
    const base64 = buffer.toString('base64');
    const media = new MessageMedia('image/png', base64, 'fakechat.png');

    await msg.reply(media, undefined, {
      caption:
        `📱 *FAKE iPHONE CHAT* 🍎\n\n` +
        `💬 "${chatText}"\n` +
        `👤 ${senderName}\n` +
        `🕐 ${timeStr}\n\n` +
        `_Generated by WA-BOT_`,
    });
  } catch (err) {
    console.error('FakeChat error:', err);
    await msg.reply('❌ Gagal generate fake chat: ' + err.message);
  }
}

/**
 * Word-wrap helper
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

module.exports = { fakeChat };
