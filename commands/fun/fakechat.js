const { MessageMedia } = require('whatsapp-web.js');

// ═══════════════════════════════════════════════════════════════
//  IQC — iPHONE QUOTED CHAT GENERATOR
//  Reply ke pesan → bot render jadi screenshot iPhone style
//  Dark mode, emoji reactions, context menu hold, iOS bubble
// ═══════════════════════════════════════════════════════════════

/**
 * Command: !iqc  atau  !fakechat [teks]
 *
 * Mode 1 — Reply ke pesan:  reply pesan → ketik !iqc
 *          Bot ambil teks dari pesan yang di-reply, render jadi iPhone screenshot
 *
 * Mode 2 — Ketik langsung: !iqc [nama] | [teks] | [waktu]
 *          Bot render teks yang diketik
 */
async function fakeChat(msg, args) {
  let senderName, chatText, timeStr;

  // ── Mode 1: Reply ke pesan ──
  const quotedMsg = await msg.getQuotedMessage?.();

  if (quotedMsg) {
    const contact = await quotedMsg.getContact();
    senderName = contact.pushname || contact.name || contact.id.user;
    chatText = quotedMsg.body || '[Media]';
    // Ambil timestamp dari pesan asli
    const msgDate = new Date(quotedMsg.timestamp * 1000);
    timeStr = msgDate.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } else {
    // ── Mode 2: Ketik manual ──
    const input = args.slice(1).join(' ');
    if (!input) {
      return msg.reply(
        `📱 *IQC — iPhone Quoted Chat*\n\n` +
        `Bikin screenshot chat WhatsApp rasa iPhone! 🍎\n\n` +
        `*Cara pakai:*\n` +
        `1️⃣ Reply ke pesan → ketik \`!iqc\`\n` +
        `2️⃣ Atau ketik \`!iqc [teks]\`\n` +
        `3️⃣ Atau \`!iqc [nama] | [teks] | [waktu]\`\n\n` +
        `*Contoh:*\n` +
        `• Reply pesan → \`!iqc\`\n` +
        `• \`!iqc Di sana pusing pacaran, di sini pusing codingan.\`\n` +
        `• \`!iqc Budi | Besok jadi gak? | 21:30\``
      );
    }

    const parts = input.split('|').map(s => s.trim());
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
  }

  try {
    const { createCanvas } = require('@napi-rs/canvas');

    // ── Measure text for dynamic height ──
    const WIDTH = 390;
    const maxBubbleTextW = WIDTH - 95;

    const measureCanvas = createCanvas(WIDTH, 100);
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = '16px Arial';
    const lines = wrapText(measureCtx, chatText, maxBubbleTextW);
    const lineH = 22;
    const textBlockH = lines.length * lineH;

    // ── Layout calculation ──
    const topPad = 15;
    const reactionsH = 50;
    const gapAfterReactions = 8;
    const bubblePadV = 10;
    const bubblePadH = 12;
    const timestampRowH = 18;
    const bubbleContentH = textBlockH + timestampRowH;
    const bubbleTotalH = bubblePadV * 2 + bubbleContentH;
    const gapAfterBubble = 10;

    // Menu items
    const menuItems = [
      { label: 'Beri Bintang', icon: '☆' },
      { label: 'Balas', icon: '↩' },
      { label: 'Teruskan', icon: '↗' },
      { label: 'Salin', icon: '⧉' },
      { label: 'Ucapkan', icon: '💬' },
      { label: 'Laporkan', icon: '⚠' },
    ];
    const menuItemH = 46;
    const menuTotalH = menuItems.length * menuItemH;
    const gapAfterMenu = 8;
    const deleteH = 46;
    const bottomPad = 15;

    const HEIGHT = topPad + reactionsH + gapAfterReactions +
                   bubbleTotalH + gapAfterBubble +
                   menuTotalH + gapAfterMenu +
                   deleteH + bottomPad;

    // ── Create canvas ──
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // ── Background: dark blurred WA ──
    ctx.fillStyle = '#0b141a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle chat pattern
    ctx.globalAlpha = 0.04;
    for (let y = 0; y < HEIGHT; y += 20) {
      for (let x = 0; x < WIDTH; x += 20) {
        if (Math.random() > 0.6) {
          ctx.fillStyle = '#1a3a2a';
          ctx.fillRect(x, y, 20, 20);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ═══════════════════════════════════════
    //  EMOJI REACTIONS ROW
    // ═══════════════════════════════════════
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
    const emojiCellW = 44;
    const totalEmojisW = emojis.length * emojiCellW;
    const pillW = totalEmojisW + 16;
    const pillH = 42;
    const pillX = (WIDTH - pillW) / 2;
    const pillY = topPad + (reactionsH - pillH) / 2;

    // Pill background
    ctx.fillStyle = '#1f2c33';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 21);
    ctx.fill();

    // Pill border
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 21);
    ctx.stroke();

    // Emojis
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < emojis.length; i++) {
      const x = pillX + 8 + i * emojiCellW + emojiCellW / 2;
      ctx.fillText(emojis[i], x, pillY + pillH / 2);
    }

    // ═══════════════════════════════════════
    //  CHAT BUBBLE (green, right-aligned = sent by user)
    // ═══════════════════════════════════════
    const bubbleY = topPad + reactionsH + gapAfterReactions;
    const bubbleW = Math.min(maxBubbleTextW + bubblePadH * 2 + 15, WIDTH - 50);
    const bubbleX = WIDTH - bubbleW - 16; // right-aligned

    // Bubble background (WhatsApp green)
    ctx.fillStyle = '#005c4b';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleTotalH, 10);
    ctx.fill();

    // Bubble tail (right side)
    ctx.beginPath();
    ctx.moveTo(bubbleX + bubbleW, bubbleY + 6);
    ctx.lineTo(bubbleX + bubbleW + 8, bubbleY + 2);
    ctx.lineTo(bubbleX + bubbleW, bubbleY + 16);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.fillStyle = '#e9edef';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], bubbleX + bubblePadH, bubbleY + bubblePadV + i * lineH);
    }

    // Timestamp + read receipt
    const tsX = bubbleX + bubbleW - bubblePadH;
    const tsY = bubbleY + bubblePadV + textBlockH + 2;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, tsX, tsY);

    // Double blue check ✓✓
    const checkX = tsX - ctx.measureText(timeStr).width - 6;
    ctx.fillStyle = '#53bdeb';
    ctx.font = '12px Arial';
    ctx.fillText('✓✓', checkX, tsY);

    // ═══════════════════════════════════════
    //  CONTEXT MENU (iOS hold menu style)
    // ═══════════════════════════════════════
    const menuX = 18;
    const menuW = WIDTH - 36;
    const menuY = bubbleY + bubbleTotalH + gapAfterBubble;
    const menuR = 14;

    // Menu background
    ctx.fillStyle = '#233138';
    ctx.beginPath();
    ctx.roundRect(menuX, menuY, menuW, menuTotalH, menuR);
    ctx.fill();

    // Menu items
    for (let i = 0; i < menuItems.length; i++) {
      const itemY = menuY + i * menuItemH;

      // Separator
      if (i > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(menuX + 16, itemY);
        ctx.lineTo(menuX + menuW - 16, itemY);
        ctx.stroke();
      }

      // Label (left)
      ctx.fillStyle = '#e9edef';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(menuItems[i].label, menuX + 18, itemY + menuItemH / 2);

      // Icon (right)
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '18px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(menuItems[i].icon, menuX + menuW - 18, itemY + menuItemH / 2);
    }

    // ═══════════════════════════════════════
    //  DELETE BUTTON (red, separated)
    // ═══════════════════════════════════════
    const delY = menuY + menuTotalH + gapAfterMenu;
    const delH = deleteH;

    ctx.fillStyle = '#233138';
    ctx.beginPath();
    ctx.roundRect(menuX, delY, menuW, delH, menuR);
    ctx.fill();

    // "Hapus" text (red)
    ctx.fillStyle = '#ef4444';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Hapus', menuX + 18, delY + delH / 2);

    // Trash icon (right)
    ctx.font = '18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('🗑', menuX + menuW - 18, delY + delH / 2);

    // ═══════════════════════════════════════
    //  RENDER & SEND
    // ═══════════════════════════════════════
    const buffer = canvas.toBuffer('image/png');
    const base64 = buffer.toString('base64');
    const media = new MessageMedia('image/png', base64, 'iqc.png');

    await msg.reply(media, undefined, {
      caption: `📱 *IQC — iPhone Quoted Chat* 🍎`,
    });
  } catch (err) {
    console.error('IQC error:', err);
    await msg.reply('❌ Gagal generate IQC: ' + err.message);
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
