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

module.exports = { tagAll, tagAdmin };
