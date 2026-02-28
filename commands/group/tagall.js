// Mention all members in a group
async function tagAll(client, msg, args) {
  const group = await msg.getChat();
  if (!group.isGroup) return msg.reply('❌ Perintah ini hanya bisa digunakan di grup!');

  const customMsg = args.slice(1).join(' ') || '📢 Pengumuman untuk semua member!';
  const participants = group.participants;
  const total = participants.length;

  let mentionIds = [];
  let memberList = '';

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    mentionIds.push(p.id._serialized);
    memberList += `${i + 1}. @${p.id.user}\n`;
  }

  const mentionText =
    `╔══════════════════════╗\n` +
    `║  📢 *TAG ALL MEMBER*  ║\n` +
    `╚══════════════════════╝\n\n` +
    `💬 *Pesan:*\n${customMsg}\n\n` +
    `👥 *Member (${total} orang):*\n` +
    `${memberList}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━`;

  await group.sendMessage(mentionText, { mentions: mentionIds });
}

// Mention all admins in a group
async function tagAdmin(client, msg, args) {
  const group = await msg.getChat();
  if (!group.isGroup) return msg.reply('❌ Perintah ini hanya bisa digunakan di grup!');

  const customMsg = args.slice(1).join(' ') || '📢 Perhatian untuk semua admin!';
  const admins = group.participants.filter(p => p.isAdmin || p.isSuperAdmin);
  const total = admins.length;

  let mentionIds = [];
  let adminList = '';

  for (let i = 0; i < admins.length; i++) {
    const p = admins[i];
    mentionIds.push(p.id._serialized);
    adminList += `${i + 1}. @${p.id.user}${p.isSuperAdmin ? ' 👑' : ''}\n`;
  }

  const mentionText =
    `╔══════════════════════╗\n` +
    `║  🛡️ *TAG ALL ADMIN*   ║\n` +
    `╚══════════════════════╝\n\n` +
    `💬 *Pesan:*\n${customMsg}\n\n` +
    `👮 *Admin (${total} orang):*\n` +
    `${adminList}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━`;

  await group.sendMessage(mentionText, { mentions: mentionIds });
}

// Tag / Broadcast to all groups the bot is in
async function tagGroup(client, msg, args) {
  const customMsg = args.slice(1).join(' ');
  if (!customMsg) return msg.reply('❌ Masukkan pesan yang ingin di-broadcast!\nContoh: !taggroup Pengumuman penting!');

  // Security check: Only owners should broadcast to all groups
  const senderNumber = (await msg.getContact()).id._serialized;
  const isOwner = require('../../config').owners.includes(senderNumber);
  if (!isOwner) {
    return msg.reply('❌ Perintah ini hanya bisa digunakan oleh *Owner Bot*!');
  }

  const chats = await client.getChats();
  const groups = chats.filter(chat => chat.isGroup);
  let successCount = 0;

  const broadcastMsg = 
    `╔══════════════════════╗\n` +
    `║  📢 *BROADCAST PUSAT* ║\n` +
    `╚══════════════════════╝\n\n` +
    `💬 *Pesan:*\n${customMsg}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━`;

  await msg.reply(`⏳ Sedang mengirim broadcast ke ${groups.length} grup...`);

  for (const group of groups) {
    try {
      await group.sendMessage(broadcastMsg);
      successCount++;
    } catch (err) {
      console.error(`Gagal kirim ke grup ${group.name}:`, err.message);
    }
  }

  await msg.reply(`✅ Broadcast selesai! Terkirim ke *${successCount}/${groups.length}* grup.`);
}

module.exports = { tagAll, tagAdmin, tagGroup };
