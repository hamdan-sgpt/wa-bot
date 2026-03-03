const { MessageMedia } = require('whatsapp-web.js');

// ═══════════════════════════════════════════════════════════════
//  IN-MEMORY STATE
// ═══════════════════════════════════════════════════════════════

// AFK: userId => { reason, since }
const afkUsers = new Map();

// Leveling: `${groupId}_${userId}` => { xp, level, messages, lastXpTime }
const userLevels = new Map();

// XP Config
const XP_PER_MSG = [15, 25]; // random range
const XP_COOLDOWN = 60000;   // 60 detik cooldown antar XP
const LEVEL_BASE = 100;      // XP base per level
const LEVEL_MULTIPLIER = 1.5; // XP multiplier per level

/**
 * Hitung XP yang dibutuhkan untuk suatu level
 */
function xpForLevel(level) {
  return Math.floor(LEVEL_BASE * Math.pow(LEVEL_MULTIPLIER, level - 1));
}

/**
 * Hitung total XP dari level 1 sampai level tertentu
 */
function totalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

/**
 * Dapatkan data level user, create default jika belum ada
 */
function getUserLevel(groupId, userId) {
  const key = `${groupId}_${userId}`;
  if (!userLevels.has(key)) {
    userLevels.set(key, { xp: 0, level: 1, messages: 0, lastXpTime: 0 });
  }
  return userLevels.get(key);
}

// ═══════════════════════════════════════════════════════════════
//  AFK SYSTEM
// ═══════════════════════════════════════════════════════════════

/**
 * Format durasi AFK yang udah berlalu
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} detik`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainMins = minutes % 60;
  if (hours < 24) return `${hours} jam ${remainMins} menit`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return `${days} hari ${remainHours} jam`;
}

/**
 * Command: !afk [alasan]
 * Set user sebagai AFK
 */
async function setAfk(msg, args) {
  const contact = await msg.getContact();
  const userId = contact.id._serialized;
  const reason = args.slice(1).join(' ') || 'Tidak ada alasan';
  const name = contact.pushname || contact.name || contact.id.user;

  afkUsers.set(userId, {
    reason,
    since: Date.now(),
    name,
  });

  await msg.reply(
    `💤 *AFK AKTIF*\n\n` +
    `@${contact.id.user} sekarang sedang AFK\n` +
    `📝 Alasan: _${reason}_\n\n` +
    `_Bot akan otomatis memberitahu jika ada yang mention kamu._\n` +
    `_AFK akan hilang saat kamu kirim pesan lagi._`,
    undefined,
    { mentions: [userId] }
  );
}

/**
 * Hook: Cek apakah sender AFK → auto-remove
 * Dipanggil SEBELUM command prefix check di handler
 * Returns true jika user baru saja keluar dari AFK (untuk skip further processing)
 */
async function checkAfkSender(msg) {
  const contact = await msg.getContact();
  const userId = contact.id._serialized;

  if (afkUsers.has(userId)) {
    const afkData = afkUsers.get(userId);
    const duration = formatDuration(Date.now() - afkData.since);
    afkUsers.delete(userId);

    await msg.reply(
      `👋 *Selamat datang kembali, @${contact.id.user}!*\n\n` +
      `Kamu AFK selama *${duration}*\n` +
      `📝 Alasan AFK: _${afkData.reason}_`,
      undefined,
      { mentions: [userId] }
    );
    return true;
  }
  return false;
}

/**
 * Hook: Cek apakah pesan mention user yang AFK → notify
 * Dipanggil SEBELUM command prefix check di handler
 */
async function checkAfkMentions(msg) {
  const mentions = await msg.getMentions();
  if (!mentions || mentions.length === 0) return;

  for (const mentioned of mentions) {
    const mentionedId = mentioned.id._serialized;
    if (afkUsers.has(mentionedId)) {
      const afkData = afkUsers.get(mentionedId);
      const duration = formatDuration(Date.now() - afkData.since);

      await msg.reply(
        `💤 *@${mentioned.id.user} sedang AFK*\n\n` +
        `📝 Alasan: _${afkData.reason}_\n` +
        `⏱️ Sudah AFK selama: *${duration}*`,
        undefined,
        { mentions: [mentionedId] }
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  LEVELING / XP SYSTEM
// ═══════════════════════════════════════════════════════════════

/**
 * Hook: Tambah XP saat user kirim pesan di grup
 * Dipanggil SEBELUM command prefix check di handler
 * Returns level up message if user leveled up
 */
async function processXp(msg, chat) {
  if (!chat.isGroup) return;

  const contact = await msg.getContact();
  const userId = contact.id._serialized;
  const groupId = chat.id._serialized;
  const data = getUserLevel(groupId, userId);
  const now = Date.now();

  // Increment message count
  data.messages++;

  // XP cooldown check
  if (now - data.lastXpTime < XP_COOLDOWN) return;

  // Give random XP
  const xpGained = Math.floor(Math.random() * (XP_PER_MSG[1] - XP_PER_MSG[0] + 1)) + XP_PER_MSG[0];
  data.xp += xpGained;
  data.lastXpTime = now;

  // Check level up
  const xpNeeded = xpForLevel(data.level);
  const xpInLevel = data.xp - totalXpForLevel(data.level);

  if (xpInLevel >= xpNeeded) {
    data.level++;
    const name = contact.pushname || contact.name || contact.id.user;

    // Level up rewards
    const titles = {
      5: '🥉 Chatters Pemula',
      10: '🥈 Chatters Aktif',
      15: '🥇 Chatters Pro',
      20: '💎 Chatters Elite',
      25: '👑 Chatters Legend',
      30: '🌟 Chatters Myth',
    };

    let levelUpMsg =
      `🎉 *LEVEL UP!*\n\n` +
      `@${contact.id.user} naik ke *Level ${data.level}*! 🆙\n`;

    // Check if earned a title
    const title = titles[data.level];
    if (title) {
      levelUpMsg += `\n🏆 Title baru: *${title}*\n`;
    }

    levelUpMsg += `\n📊 Total XP: *${data.xp}*`;

    await chat.sendMessage(levelUpMsg, { mentions: [userId] });
  }
}

/**
 * Command: !level / !rank
 * Lihat level & XP sendiri
 */
async function showLevel(msg) {
  const chat = await msg.getChat();
  if (!chat.isGroup) return msg.reply('❌ Fitur level hanya untuk grup!');

  const contact = await msg.getContact();
  const userId = contact.id._serialized;
  const groupId = chat.id._serialized;
  const data = getUserLevel(groupId, userId);
  const name = contact.pushname || contact.name || contact.id.user;

  const xpNeeded = xpForLevel(data.level);
  const xpInLevel = data.xp - totalXpForLevel(data.level);
  const progress = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
  const bar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

  // Title based on level
  let title = '🌱 Newbie';
  if (data.level >= 30) title = '🌟 Myth';
  else if (data.level >= 25) title = '👑 Legend';
  else if (data.level >= 20) title = '💎 Elite';
  else if (data.level >= 15) title = '🥇 Pro';
  else if (data.level >= 10) title = '🥈 Aktif';
  else if (data.level >= 5) title = '🥉 Pemula';

  await msg.reply(
    `📊 *LEVEL & XP*\n\n` +
    `👤 *${name}*\n` +
    `🏷️ Title: *${title}*\n\n` +
    `🔰 Level: *${data.level}*\n` +
    `✨ XP: *${xpInLevel}* / *${xpNeeded}*\n` +
    `[${bar}] ${progress}%\n\n` +
    `📨 Total Pesan: *${data.messages}*\n` +
    `💫 Total XP: *${data.xp}*`
  );
}

/**
 * Command: !leaderboard / !lb
 * Top 10 user di grup
 */
async function leaderboard(msg) {
  const chat = await msg.getChat();
  if (!chat.isGroup) return msg.reply('❌ Fitur leaderboard hanya untuk grup!');

  const groupId = chat.id._serialized;
  const prefix = `${groupId}_`;

  // Collect all users in this group
  const rankings = [];
  for (const [key, data] of userLevels.entries()) {
    if (key.startsWith(prefix)) {
      const userId = key.slice(prefix.length);
      rankings.push({ userId, ...data });
    }
  }

  if (rankings.length === 0) {
    return msg.reply('📊 Belum ada data level di grup ini. Mulai ngobrol dulu biar dapet XP!');
  }

  // Sort by XP descending
  rankings.sort((a, b) => b.xp - a.xp);
  const top10 = rankings.slice(0, 10);

  const medals = ['🥇', '🥈', '🥉'];
  let text = `🏆 *LEADERBOARD — ${chat.name}*\n\n`;
  const mentionIds = [];

  for (let i = 0; i < top10.length; i++) {
    const r = top10[i];
    const medal = medals[i] || `${i + 1}.`;
    const userId = r.userId;
    const userNum = userId.replace('@c.us', '');
    text += `${medal} @${userNum} — Level *${r.level}* (${r.xp} XP)\n`;
    mentionIds.push(userId);
  }

  text += `\n📨 _Chat terus untuk naik level!_`;
  await chat.sendMessage(text, { mentions: mentionIds });
}

// ═══════════════════════════════════════════════════════════════
//  CONFESS / ANONYMOUS MESSAGE
// ═══════════════════════════════════════════════════════════════

// Store target group per user for confess: userId => groupId
const confessTargets = new Map();

/**
 * Command: !confess [pesan] atau !confess set [groupId]
 * Kirim pesan anonymous ke grup
 */
async function confess(client, msg, args) {
  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const userId = contact.id._serialized;

  // In group — set this group as target
  if (chat.isGroup) {
    confessTargets.set(userId, {
      groupId: chat.id._serialized,
      groupName: chat.name,
    });
    return msg.reply(
      `🎭 *CONFESS — Anonymous Message*\n\n` +
      `Grup *${chat.name}* sudah diset sebagai target confess!\n\n` +
      `Sekarang kirim pesan dari *private chat bot* dengan format:\n` +
      `\`!confess [pesan kamu]\`\n\n` +
      `Pesanmu akan dikirim secara *anonim* ke grup ini 🤫`
    );
  }

  // In private chat — send confession
  const message = args.slice(1).join(' ');
  if (!message) {
    return msg.reply(
      `🎭 *CONFESS — Anonymous Message*\n\n` +
      `Cara pakai:\n` +
      `1️⃣ Ketik \`!confess\` di *grup target* dulu\n` +
      `2️⃣ Lalu kirim \`!confess [pesan]\` di *private chat bot*\n\n` +
      `Contoh:\n` +
      `\`!confess Aku suka sama seseorang di grup ini 👀\``
    );
  }

  const target = confessTargets.get(userId);
  if (!target) {
    return msg.reply(
      `❌ Kamu belum set grup target!\n\n` +
      `Ketik \`!confess\` di grup yang kamu mau kirim pesan anonim dulu.`
    );
  }

  try {
    const targetChat = await client.getChatById(target.groupId);
    const confessionText =
      `🎭 *PESAN ANONIM*\n\n` +
      `💬 _"${message}"_\n\n` +
      `───────────────\n` +
      `_Dikirim secara anonim melalui bot_\n` +
      `_Mau kirim juga? Ketik !confess di grup ini_`;

    await targetChat.sendMessage(confessionText);
    await msg.reply(
      `✅ *Confess terkirim!*\n\n` +
      `Pesanmu sudah dikirim secara anonim ke *${target.groupName}* 🤫`
    );
  } catch (err) {
    await msg.reply('❌ Gagal mengirim confession: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
//  PROFILE CARD
// ═══════════════════════════════════════════════════════════════

/**
 * Command: !profile [@user]
 * Generate kartu profil user
 */
async function profileCard(msg) {
  const chat = await msg.getChat();
  const mentions = await msg.getMentions();
  const target = mentions.length > 0 ? mentions[0] : await msg.getContact();
  const userId = target.id._serialized;
  const name = target.pushname || target.name || target.id.user;

  // Get level data if in group
  let levelData = { xp: 0, level: 1, messages: 0 };
  if (chat.isGroup) {
    levelData = getUserLevel(chat.id._serialized, userId);
  }

  // Title
  let title = '🌱 Newbie';
  if (levelData.level >= 30) title = '🌟 Myth';
  else if (levelData.level >= 25) title = '👑 Legend';
  else if (levelData.level >= 20) title = '💎 Elite';
  else if (levelData.level >= 15) title = '🥇 Pro';
  else if (levelData.level >= 10) title = '🥈 Aktif';
  else if (levelData.level >= 5) title = '🥉 Pemula';

  // XP progress
  const xpNeeded = xpForLevel(levelData.level);
  const xpInLevel = levelData.xp - totalXpForLevel(levelData.level);
  const progress = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  // AFK status
  const isAfk = afkUsers.has(userId);
  const afkText = isAfk
    ? `💤 AFK: _${afkUsers.get(userId).reason}_ (${formatDuration(Date.now() - afkUsers.get(userId).since)})`
    : `🟢 Online`;

  try {
    const { createCanvas } = require('@napi-rs/canvas');

    const width = 600;
    const height = 340;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#7c5cbf';
    ctx.lineWidth = 3;
    ctx.roundRect(8, 8, width - 16, height - 16, 16);
    ctx.stroke();

    // Inner glow line
    ctx.strokeStyle = 'rgba(124, 92, 191, 0.3)';
    ctx.lineWidth = 1;
    ctx.roundRect(14, 14, width - 28, height - 28, 12);
    ctx.stroke();

    // Avatar circle placeholder
    ctx.beginPath();
    ctx.arc(80, 90, 45, 0, Math.PI * 2);
    ctx.fillStyle = '#7c5cbf';
    ctx.fill();
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Avatar initial
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name.charAt(0).toUpperCase(), 80, 103);
    ctx.textAlign = 'left';

    // Name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(name.length > 20 ? name.substring(0, 20) + '...' : name, 145, 75);

    // Title
    ctx.fillStyle = '#a78bfa';
    ctx.font = '16px Arial';
    ctx.fillText(title, 145, 100);

    // Phone number
    ctx.fillStyle = '#888';
    ctx.font = '13px Arial';
    ctx.fillText(`+${target.id.user}`, 145, 120);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 150);
    ctx.lineTo(width - 30, 150);
    ctx.stroke();

    // Stats section
    const statsY = 180;
    const statsGap = 170;

    // Level
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('⚡ LEVEL', 40, statsY);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`${levelData.level}`, 40, statsY + 38);

    // XP
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('✨ XP', 40 + statsGap, statsY);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`${levelData.xp}`, 40 + statsGap, statsY + 38);

    // Messages
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('📨 PESAN', 40 + statsGap * 2, statsY);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`${levelData.messages}`, 40 + statsGap * 2, statsY + 38);

    // XP Progress bar
    const barY = 265;
    const barWidth = width - 80;
    const barHeight = 18;

    // Bar label
    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.fillText(`Level ${levelData.level} → Level ${levelData.level + 1}`, 40, barY - 5);
    ctx.textAlign = 'right';
    ctx.fillText(`${xpInLevel}/${xpNeeded} XP (${progress}%)`, width - 40, barY - 5);
    ctx.textAlign = 'left';

    // Bar background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(40, barY, barWidth, barHeight, 9);
    ctx.fill();

    // Bar fill
    const fillWidth = Math.max(0, (progress / 100) * barWidth);
    if (fillWidth > 0) {
      const barGradient = ctx.createLinearGradient(40, 0, 40 + fillWidth, 0);
      barGradient.addColorStop(0, '#7c5cbf');
      barGradient.addColorStop(1, '#a78bfa');
      ctx.fillStyle = barGradient;
      ctx.beginPath();
      ctx.roundRect(40, barY, fillWidth, barHeight, 9);
      ctx.fill();
    }

    // Status
    ctx.fillStyle = isAfk ? '#fbbf24' : '#4ade80';
    ctx.font = '13px Arial';
    ctx.fillText(isAfk ? `💤 AFK — ${afkUsers.get(userId).reason}` : '🟢 Online', 40, height - 25);

    // Watermark
    ctx.fillStyle = '#555';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('WA-BOT Profile Card', width - 30, height - 25);
    ctx.textAlign = 'left';

    const buffer = canvas.toBuffer('image/png');
    const base64 = buffer.toString('base64');
    const media = new MessageMedia('image/png', base64, 'profile.png');

    await msg.reply(media, undefined, {
      caption: `🪪 *Profile Card — ${name}*`,
      mentions: [userId],
    });
  } catch (err) {
    // Fallback text version
    const barText = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
    await msg.reply(
      `🪪 *PROFILE CARD*\n\n` +
      `👤 *${name}*\n` +
      `📱 +${target.id.user}\n` +
      `🏷️ ${title}\n` +
      `${afkText}\n\n` +
      `───────────────\n` +
      `⚡ Level: *${levelData.level}*\n` +
      `✨ XP: *${xpInLevel}/${xpNeeded}* [${barText}] ${progress}%\n` +
      `📨 Total Pesan: *${levelData.messages}*\n` +
      `💫 Total XP: *${levelData.xp}*`
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // AFK
  setAfk,
  checkAfkSender,
  checkAfkMentions,
  afkUsers,

  // Leveling
  processXp,
  showLevel,
  leaderboard,

  // Social
  confess,
  profileCard,
};
